// @ts-check
/**
 * @typedef {import("./types.ts").Config} Config
 * @typedef {import("./types.ts").NavResult} NavResult
 * @typedef {import("./types.ts").ExtendedNavigationType} ExtendedNavigationType
 * */

import { classScope, extendInternal } from "./extend.js";

/** @param {Config} config */
export function init(config) {
    const routes = new Map(Object.entries(config.routes).map(([name, pattern]) => [name, new URLPattern(pattern, location.href)]));
    const sub = (str, params) =>
        str.replace(/\$\(([^\)]+)\)/g, (_, t) => params[t] ?? _);

    const actions = [
        ...Object.entries(config.captures).map(([selector, name]) =>
                (extend, params) =>
                    extend.capture(sub(selector, params), sub(name, params))),
        ...Object.entries(config.styles || {}).map(([selector, style]) =>
                (extend) =>
                    extend.style(selector, style))];

    /** @type {{to: string | null, from: string | null, type: ExtendedNavigationType, class: string | null}[]} */
    const rules = config.navs.flatMap(nav => {
        const navs =
            ("from" in nav || "to" in nav) ? [{from: nav["from"], to: nav["to"]}]:
            ("with" in nav) ? [{from: nav.with}, {to: nav.with}] :
            ("between" in nav) ? [
                {from: nav.between[0], to: nav.between[1]},
                {from: nav.between[1], to: nav.between[0]}] : [];
        return navs.map(n => ({from: n.from, to: n.to, type: nav.type || "auto", class: nav.class ?? null}));
    }).reverse();

    /**
     *
     * @param {ExtendedNavigationType} expected
     * @param {NavigationType} actual
     * @param {number} delta
     * @returns
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
     *
     * @param {object} navigation
     * @param {"push" | "replace" | "traverse" | "reload"} navigation.navigationType
     * @param {number} navigation.traverseDelta
     * @param {string} navigation.to
     * @param {string} navigation.from
     * @returns {NavResult | null}
     */
    function findMatchingNav(navigation) {
        for (const rule of rules) {
            if (!matchNavType(rule.type, navigation.navigationType, navigation.traverseDelta))
                continue;

            /** @type {{[key: string]: string}} */
            const params = {};
            const applyParams = result => result ?
                Object.assign(params, result?.pathname?.groups, result?.search?.groups) : null;

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
         * @returns {NavResult | null}
         */
        findMatchingNavForNavigateEvent : event =>
            findMatchingNav({
                from: window.navigation.currentEntry.url,
                to: event.destination.url,
                navigationType: event.navigationType,
                traverseDelta: event.destination.index - window.navigation.currentEntry.index}),
        apply: (context, params) => actions.forEach(e => e(context, params)),
        /**
         *
         * @param {NavResult} nav
         * @param {ViewTransition} transition
         * @param {"inbound" | "outbound" | "both"} phase
         */
        applyNav(nav, transition, phase) {
            if (nav.from)
                classScope(`vt-route-${nav.from}`, Promise.resolve(), transition.updateCallbackDone);
            if (nav.to)
                classScope(`vt-route-${nav.to}`, transition.updateCallbackDone, transition.finished);
            if (nav.class)
                classScope(nav.class, Promise.resolve(), transition.finished);
            this.apply(extendInternal(transition, {phase}), nav.params);
        }
    };
}

