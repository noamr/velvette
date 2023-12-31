// @ts-check
/// <reference path="global.d.ts" />
/** @typedef {import("./types.ts").Config} Config */
/** @typedef {import("./types.ts").CrossDocumentViewTransition} CrossDocumentViewTransition */

import { start } from "./transition.js";
import { init } from "./nav.js";

/**
 *
 * @param {object} options
 * @param {() => void | Promise<void>} options.update
 * @param {string[]?} options.classes
 * @param {{[key: string]: Partial<CSSStyleDeclaration>}?} options.styles
 * @param {{[selector: string]: string}?} options.captures
 *
 * @returns {ViewTransition | null}
 */
export function startViewTransition(options) {
    return start({
        update: options.update,
        captures: options.captures || {},
        styles: options.styles || {},
        classes: {both: options.classes || []}
    }, "both");
}

export class VelvetteEvent extends Event {
    viewTransition;
    /**
     *
     * @param {"old-only" | "new-only"} name
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
     * @param {object} navigation
     * @param {string} navigation.from
     * @param {string} navigation.to
     * @param {NavigationType} navigation.navigationType
     * @param {number} navigation.traverseDelta
     */
    startNavigation(navigation, update) {
        const result = this.#internal.findMatchingNav(navigation);
        if (!result) {
            update();
            return null;
        }
        const transition = document.startViewTransition(update);
        this.#internal.applyNav(result, transition, "both");
        return transition;
    }

    /**
     * @param {NavigateEvent} event
     * @param {{handler: () => Promise<void>}} interceptor
     * @return {Promise<ViewTransition | null>}
     */
    intercept(event, interceptor) {
        const nav = this.#internal.findMatchingNavForNavigateEvent(event);
        if (!nav) {
            event.intercept(interceptor);
            return Promise.resolve(null);
        }

        return new Promise(resolve => event.intercept({
            handler: async () => {
                const transition = this.#internal.startNavigation(nav, interceptor.handler, "both");
                resolve(transition);
                await transition?.finished;
            }
        }));
    }

    /**
     * @returns {CrossDocumentViewTransition}
     */
    crossDocument() {
        const result = /** @type {CrossDocumentViewTransition} */(new EventTarget());
        if (!("PageRevealEvent" in window)) {
            console.warn("MPA view-transitions not supported");
            return result;
        }
        const style = new CSSStyleSheet();
        document.adoptedStyleSheets.push(style);
        style.replace(`@view-transition { navigation: auto }`);
        const styleRule = /** @type {CSSViewTransitionRule} */ (style.rules[0]);
        /**
         * @param {boolean} enabled
         * @returns {void}
         */
        const toggle = enabled => {
            styleRule.navigation = enabled ? "auto" : "none"};

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

            if (!nav) {
                viewTransition.skipTransition();
                return;
            }

            this.#internal.applyNav(nav, viewTransition, "new-only");
            result.dispatchEvent(new VelvetteEvent("new-only", viewTransition))
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

            this.#internal.applyNav(nav, viewTransition, "old-only");
            result.dispatchEvent(new VelvetteEvent("old-only", viewTransition));
        });
        return result;
    }
}
