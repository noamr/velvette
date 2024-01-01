// @ts-check
/// <reference path="global.d.ts" />
/** @typedef {import("./types.ts").Config} Config */
/** @typedef {import("./types.ts").CrossDocumentViewTransition} CrossDocumentViewTransition */

import { start } from "./transition.js";
import { init } from "./nav.js";

/**
 * Starts a {@link https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition ViewTransition} with
 * additional params. Based on these params, Velvette applies temporary classes to the {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html document element},
 * generates {@link https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name `view-transition-name`} properties
 * and adds temporary styles for {@link https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API#the_view_transition_process the `::view-transition-*` pseudo-elements}.
 *
 * @param {object} options
 * @param {() => void | Promise<void>} options.update The operation that updates the DOM to the new state.
 * @param {string[]?} options.classes A list of temporary classes to be applied to the document element with a `vt-` prefix during the course of the transition.
 * @param {{[key: string]: Partial<CSSStyleDeclaration>}?} options.styles A map of styles, see {@link Config#styles}
 * @param {{[selector: string]: string}?} options.captures A map of captures, see {@link Config#captures}
 *
 * @returns {ViewTransition | null}
 *
 * @example
 * import {startViewTransition} from "velvette";
 * // This will return a ViewTransition, or a null if this browser doesn't support CSS View Transitions.
 * startViewTransition({
 *   async update() {
 *     // Make actual DOM update
 *   },
 *
 *   // This would apply `vt-slide-in` on the root element for the duration of the transition
 *   classes: ["slide-in"],
 *
 *   // This would capture any `li.item .box`, and would give it the `view-transition-name`
 *   // corresponding to "box-" plus its ancestor `li.item`'s id.
 *   // In addition, it would apply any style with a pseudo that matches '.any-box' to all the
 *   // captured elements.
 *   captures: { "li.item[:id] .box": "box-$(id).any-box" }
 *
 *   // Would apply a blur during the transition, to the transition group generated
 *   // for any capture that matches the ".any-box".
 *   styles: {"::view-transition-group(.any-box)": {filter: "blur(1px)"}},
 * });
 */
export function startViewTransition(options) {
    if (!("startViewTransition" in document)) {
        options.update();
        return null;
    }

    const viewTransition = document.startViewTransition(options.update);

    start({
        viewTransition,
        captures: options.captures || {},
        styles: options.styles || {},
        classes: {both: options.classes || []}
    }, "both");
    return viewTransition;
}

export class VelvetteEvent extends Event {
    viewTransition;
    /**
     *
     * @param {"inbound" | "outbound"} name
     * @param {ViewTransition} viewTransition
     */
    constructor(name, viewTransition) {
        super(name);
        this.viewTransition = viewTransition;
    }
}

/**
 * Constructs an object that takes a {@link Config} param and can then perform view transitions
 * based on navigations. There are 3 ways to invoke a navigation-based transition:
 *
 * - Programatically, via {@link Velvette#startNavigation Velvette.startNavigation}
 * - Same-document: by {@link Velvette#intercept intercepting} a navigation using the {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API Navigation API}
 * - Cross-document: by attaching to the window's events {@link Velvette#crossDocument Velvette.crossDocument}. Note that this doesn't work in stable browsers yet.
 *
 * See {@link Config} for the different configuration options.
 */
export class Velvette {
    #internal;
    /**  @param {Config} config The configuration object that defines how to handle each navigation */
    constructor(config) {
        this.#internal = init(config);
    }

    /**
     * @param {object} navigation
     * @param {string} navigation.from The previous URL of the navigation
     * @param {string} navigation.to The next URL of the navigation
     * @param {NavigationType} navigation.navigationType The type of navigation (push/replace/reload/traverse)
     * @param {number} navigation.traverseDelta If this is a `traverse` navigation, the delta. E.g. -1 is "back".
     * @param {() => void | Promise<void>} update The operation that updates the DOM based on the navigation.
     *
     * @example
     *
     * const velvette = new Velvette(config);
     * link.addEventListener("click", event => {
     *     velvette.startNavigation({
     *         from: document.URL,
     *         to: event.target.href,
     *         navigationType: "push",
     *     }, () => {
     *        // Make actual DOM change.
     *     });
     * });
     */
    startNavigation(navigation, update) {
        const result = this.#internal.findMatchingNav(navigation);
        if (!result) {
            update();
            return null;
        }
        const transition = document.startViewTransition(update);
        this.#internal.startNavigation(result, transition, "both");
        return transition;
    }

    /**
     * @param {NavigateEvent} event A `NavigateEvent`
     * @param {{handler: () => Promise<void>}} interceptor
     * @return {Promise<ViewTransition | null>}
     *
     * @example
     * const velvette = new Velvette(config);
     * window.navigation.addEventListener("navigate", event => {
     *   if (shouldInterceptEvent(event)) {
     *       // This would potentially start a transition based on the configuration.
     *       velvette.intercept(event, {
     *              async handler() {
     *                 // Make actual DOM change
     *              }
     *          });
     *       });
     *   }
     */
    intercept(event, interceptor) {
        const nav = this.#internal.findMatchingNavForNavigateEvent(event);
        if (!nav) {
            event.intercept(interceptor);
            return Promise.resolve(null);
        }

        return new Promise(done => event.intercept({
            handler: async () => {
                /** @type {ViewTransition} */
                let transition;
                const updateCallbackDone = new Promise(resolve => {
                    transition = document.startViewTransition(async () => {
                        await interceptor.handler();
                        resolve(null);
                    });
                    transition.finished.then(() => done(null));
                });

                this.#internal.startNavigation(nav, {
                    get finished() { return transition.finished },
                    get ready() { return transition.ready },
                    updateCallbackDone,
                    skipTransition() { transition.skipTransition(); }
                }, "both");
            }
        }));
    }

    /**
     * Note: This is experimental and only work in Chrome canary with some flags.
     * Attaches to the document's events and enables the view-transition config for
     * cross-document navigations.
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
            styleRule.navigation = enabled ? "auto" : "none"
        };

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

            this.#internal.startNavigation(nav, viewTransition, "new-only");
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

            this.#internal.startNavigation(nav, viewTransition, "old-only");
            result.dispatchEvent(new VelvetteEvent("outbound", viewTransition));
        });
        return result;
    }
}
