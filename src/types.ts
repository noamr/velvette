/// <reference path="global.d.ts" />
export type ExtendedNavigationType = NavigationType | "back" | "forward" | "auto";

/**
 * A navigation rule, that matches a certain navigation.
 */
interface NavRule {
    /**
     * If provided, the class (with a `vt-` prefix) would be applied for the duration
     * of the view transition if the navigation was matched.
     */
    class?: string;

    /**
     * A navigation type to match. Supports either standard {@link https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/navigationType NavigationType} values,
     * with a few additions:
     * - `"back"` matches a `"traverse`" navigation of -1.
     * - `"forward"` matches a `"traverse"` navigation of 1.
     * - `"auto"` matches any navigation apart from `"reload"`.
     */
    type: ExtendedNavigationType
};

/**
 * Matches any navigation where the old URL matches the route in {@link NavFromRule#from from }
 */
export interface NavFromRule extends NavRule {
    from: string
}
/**
 * Matches any navigation where the new URL matches the route in {@link NavToRule#to to }.
 */
export interface NavToRule extends NavRule{ to: string}

/**
 * Matches any navigation where both the old and new URLs match the routes.
 */
export type NavFromToRule = NavFromRule & NavToRule;

/**
 * Matches any navigation where the provided routes match the new or old URL, regardless of order.
 */
export interface NavWithRule extends NavRule { with: string | [string, string] }

/**
 * A configuration that determines whether a navigaiton should result in a view transition,
 * and how this view-transition should be styled.
 */
export interface Config {
    /**
     * A map of route name to a pattern, which is in the format of a {@link https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API URL pattern}.
     * The names defined here are looked up by the config's {@link Config#rules rules}. When a particular
     * view transition is started as a result of navigation, the route names as applied as the temporary classses
     * on the root (HTML) element, e.g. `vt-route-a`, `vt-route-b`, `vt-from-a`, `vt-to-b`.
     *
     * @example
     * config = {routes: {"details": "/app/item/:item_id"}, ...}
     */
    routes: {[name: string]: string};

    /**
     * A map between a selector and a generated `view-transition-name`.
     *
     * Both the selector and the name are string templates that use to the navigation's route parameters
     * as a context, as shown in the first example.
     *
     * As per the second example, attribute names from the selector chain can also be used as parameters
     * to generate the `view-transition-name`.
     *
     * In addition, if a view-transition-name contains a class, the appropriate style is applied
     * to the captured element, as demonstrated in the last example.
     *
     * @example
     * const config = {
     *     routes: {
     *         page: "/page/:page",
     *         details: "/item/:item_id"
     *      },
     *      captures: {
     *          "nav.$(page)": "page-nav-link",
     *          "ul li.item#$(item_id) div": "thing"
     *      }
     * }
     * @example
     * const config = {
     *     captures: {
     *          // For example, with the following DOM:
     *          // <main><section name="faq"><div class="hero"></section></main>
     *          // The `div` would receive a `view-transition-name` of `part-faq`.
     *          "main section[:name] .hero": "part-$(name)"
     *     }
     * }
     *
     */
    captures?: {[selector: string]: string};

    /**
     * An array of rules that match a navigation and apply temporary classes
     * and params based pn that rule. The last matching rule would take affect.
     */
    rules: (NavFromRule | NavToRule | NavFromToRule | NavWithRule)[];

    /**
     *   A map of selectors to partial style declarations.
     *   When a generated name in a capture contains a `.{class}`, it would match styles
     *   from the styles map with that class. In the following example, all boxes
     *   matching (".box[id]") would receive a 1 second animation duration, and would have
     *   their `view-transition-name` generated based on the ID.
     *
     *   @example
     *   {
     *      captures: {".box[:id]": "box-$(id).any-box"}
     *      styles: {"::view-transition-group(.any-box)": {animationDuration: "1s"}},
     *   }
     */
    styles?: {[selector: string]: Partial<CSSStyleDeclaration>}
}

/** @private */
export declare class VelvetteEvent extends Event{
    constructor(type: "new-only" | "old-only", viewTransition: ViewTransition);
    viewTransition: ViewTransition;
}

/** @private */
export interface CrossDocumentViewTransition {
    addEventListener(type: "new-only" | "old-only", callback: (event: VelvetteEvent) => any): void;
    dispatchEvent(event: VelvetteEvent): void;
}
