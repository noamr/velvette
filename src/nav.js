// @ts-check
/**
 * @typedef {import("./types.ts").Config} Config
 * @typedef {import("./types-internal.js").NavigationInfo} NavigationInfo
 * @typedef {import("./types.ts").ExtendedNavigationType} ExtendedNavigationType
 * */

import { start } from "./transition.js";

/**
 * @param {Config} config
 * @private
 * */
export function init(config) {
    const routes = new Map(Object.entries(config.routes).map(([name, pattern]) => [name, new URLPattern(pattern, location.href)]));

    /** @type {{to: string | null, from: string | null, type: ExtendedNavigationType, class: string | null}[]} */
    const rules = config.rules.flatMap(nav => {
        const navs =
            ("from" in nav || "to" in nav) ? [{from: Reflect.get(nav, "from"), to:Reflect.get(nav, "to")}]:
            ("with" in nav && typeof nav.with === "string") ? [{from: nav.with}, {to: nav.with}] :
            ("with" in nav && Array.isArray(nav.with)) ? [
                {from: nav.with[0], to: nav.with[1]},
                {from: nav.with[1], to: nav.with[0]}] : [];
        return navs.map(n => ({from: n.from, to: n.to, type: nav.type || "auto", class: nav.class ?? null}));
    }).reverse();

    /**
     * @param {ExtendedNavigationType} expected
     * @param {NavigationType} actual
     * @param {number} delta
     */
    function matchNavType(expected, actual, delta) {
        switch (expected) {
            case "auto":
                return actual !== "reload";
            case "back":
                return actual === "traverse" && delta === -1;
            case "forward":
                return actual === "traverse" && delta === 1;
            default:
                return actual === expected;
        }
    }

    /**
     * @private
     * @param {object} navigation
     * @param {"push" | "replace" | "traverse" | "reload"} navigation.navigationType
     * @param {number} navigation.traverseDelta
     * @param {string} navigation.to
     * @param {string} navigation.from
     * @returns {NavigationInfo | null}
     */
    function findMatchingNav(navigation) {
        for (const rule of rules) {
            if (!matchNavType(rule.type, navigation.navigationType, navigation.traverseDelta))
                continue;

            /** @type {{[key: string]: string}} */
            const params = {};
            /**
             *
             * @param {URLPatternResult} result
             * @returns {{[key: string]: string}}
             */
            const applyParams = result => result ?
                Object.assign(params, result?.pathname?.groups, result?.search?.groups) : {};

            const defaultRoute = new URLPattern("*", location.href);
            const from = routes.get(rule.from ?? "") ?? defaultRoute;
            const to = routes.get(rule.to ?? "") ?? defaultRoute;
            if (applyParams(from.exec(navigation.from)) &&
                applyParams(to.exec(navigation.to)))
                return {params, class: rule.class, from: rule.from, to: rule.to};
        }

        return null;
    }

    return {
        findMatchingNav,
        /**
         *
         * @param {NavigateEvent} event
         * @returns {NavigationInfo | null}
         */
        findMatchingNavForNavigateEvent : event =>
            findMatchingNav({
                from: window.navigation.currentEntry.url,
                to: event.destination.url,
                navigationType: event.navigationType,
                traverseDelta: event.destination.index - window.navigation.currentEntry.index}),
        /**
         *
         * @param {NavigationInfo} nav
         * @param {ViewTransition} viewTransition
         * @param {"old-only" | "new-only" | "both"} phase
         */
        startNavigation(nav, viewTransition, phase) {
            /**
             *
             * @param {string} str
             * @returns
             */
            const sub = str =>
                str.replace(/\$\(([^\)]+)\)/g, (_, t) => nav.params[t] ?? _);

            const captures =
                Object.fromEntries(Object.entries(config.captures || {}).map(([selector, name]) =>
                        [sub(selector), sub(name)]));

            return start({
                viewTransition,
                classes: {
                    old: [`route-${nav.from}`],
                    new: [`route-${nav.to}`],
                    both: [`from-${nav.from}`, `to-${nav.to}`, ...(nav.class ? [nav.class] : [])]
                },
                styles: config.styles,
                captures
            }, phase);
        }
    };
}

