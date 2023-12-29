// @ts-check
/// <reference path="src/global.d.ts" />
/** @typedef {import("./types.ts").Config} Config */
/** @typedef {import("./types.ts").CrossDocumentViewTransition} CrossDocumentViewTransition */

import { extendInternal, fixPromise } from "./extend.js";
import { init } from "./internal.js";

/**
 *
 * @param {ViewTransition} viewTransition
 * @returns
 */
export function extend(viewTransition) {
    return extendInternal(viewTransition, {phase: "both"});
}

export class VelvetteEvent extends Event {
    viewTransition;
    /**
     *
     * @param {"outbound" | "inbound"} name
     * @param {ViewTransition} viewTransition
     */
    constructor(name, viewTransition) {
        super(name);
        this.viewTransition = viewTransition;
    }
}

export class Velvette {
    #internal;
    /**  @param {Config} config */
    constructor(config) {
        this.#internal = init(config);
    }

    /**
     * @param {ViewTransition} transition
     * @param {{[key: string]: string}?} params
     */
    apply(transition, params = {}) {
        const context = extend(transition);
        this.#internal.apply(context, params);
        return context;
    }

    /**
     * @param {NavigateEvent} event
     * @param {{handler: () => Promise<void>}} interceptor
     * @return {Promise<ViewTransition | void>}
     */
    intercept(event, interceptor) {
        const nav = this.#internal.findMatchingNavForNavigateEvent(event);
        if (!nav) {
            event.intercept(interceptor);
            return Promise.resolve();
        }

        return new Promise(resolve => event.intercept({
            handler: () => {
                /** @type {(value?: any) => void} */
                let resolver;
                const updateCallbackDone = new Promise(resolve => {resolver = resolve});
                const transition = document.startViewTransition(
                    async () => {
                        await interceptor.handler();
                        resolver();
                    });
                fixPromise(transition.updateCallbackDone, updateCallbackDone);
                this.#internal.applyNav(nav, transition, "both");
                resolve(transition);
                return transition.finished;
            }
        }));
    }

    /**
     * @returns {CrossDocumentViewTransition}
     */
    crossDocument() {
        /** @type {CrossDocumentViewTransition} */
        const result = new EventTarget();
        if (!("PageRevealEvent" in window)) {
            console.warn("MPA view-transitions not supported");
            return result;
        }
        const style = new CSSStyleSheet();
        document.adoptedStyleSheets.push(style);
        style.replace(`@view-transition { navigation: auto }`);
        const styleRule = /** @type {CSSViewTransitionRule} */ (style.rules[0]);
        /**
         *
         * @param {boolean} enabled
         * @returns
         */
        const toggle = enabled =>
            styleRule.navigation = enabled ? "auto" : "none";

        window.addEventListener("pagehide", () => toggle(true));
        window.addEventListener("pagereveal", event => {
            /** @type {PageRevealEvent} */
            const {viewTransition} = /** @type {PageRevealEvent} */(event);
            if (!viewTransition)
                return;

            const nav = this.#internal.findMatchingNav({
                from: window.navigation.activation.from.url,
                to: window.navigation.activation.entry.url,
                navigationType: window.navigation.activation.navigationType,
                traverseDelta: window.navigation.activation.entry.index - window.navigation.activation.from.index
            });
            console.log(nav)
            if (!nav) {
                viewTransition.skipTransition();
                return;
            }

            this.#internal.applyNav(nav, viewTransition, "inbound");
            result.dispatchEvent(new VelvetteEvent("inbound", viewTransition))
        });

        window.navigation.addEventListener("navigate", event => {
            const nav = this.#internal.findMatchingNavForNavigateEvent(/** @type {NavigateEvent} */(event));
            const pageHidden = new Promise(resolve => window.addEventListener("pagehide", resolve));
            if (!nav) {
                toggle(false);
                return;
            }

            const viewTransition = {
                finished: pageHidden,
                ready: pageHidden,
                updateCallbackDone: pageHidden,
                skipTransition: () => toggle(false)
            };

            this.#internal.applyNav(nav, viewTransition, "outbound");
            result.dispatchEvent(new VelvetteEvent("outbound", viewTransition));
        });
        return result;
    }
}
