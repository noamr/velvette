// @ts-check
/// <reference path="global.d.ts" />
const promise_fixers = new WeakMap();

/**
 *
 * @param {Promise<void>} p
 * @returns
 */
const promise = p => promise_fixers.has(p) ? promise_fixers.get(p) : p;

/**
 *
 * @param {Promise<void>} promise
 * @param {Promise<void>} fixed
 */
export function fixPromise(promise, fixed) {
    promise_fixers.set(promise, fixed);
}

/**
 *
 * @param {string} className
 * @param {Promise<void>} since
 * @param {Promise<void>} until
 */
export function classScope(className, since, until) {
    promise(since).then(() => document.documentElement.classList.add(className));
    promise(until).then(() => document.documentElement.classList.remove(className));
}

/**
 * @param {ViewTransition} transition
 * @param {object} options
 * @param {"both" | "outbound" | "inbound"} options.phase
 * */
export function extendInternal(transition, {phase} = {phase: "both"}) {
    const now = Promise.resolve();
    /**
     * @type {{selector: string, declaration: Partial<CSSStyleDeclaration>}[]}
     */
    const styles = [];
    classScope("vt-old", now, transition.updateCallbackDone);
    classScope("vt-new", transition.updateCallbackDone, transition.finished);

    /**
     * @type {{selector: string, declaration: Partial<CSSStyleDeclaration>}[]}
     */
    return {
        /** @param {string} cls */
        class(cls) {
            classScope(cls, now, transition.finished);
            return this;
        },

        /**
         * @param {string} selector
         * @param {string} name
         */
        capture(selector, name) {
            const stylesheet = new CSSStyleSheet();

            function captureUntil(selector, name, until) {
                until = promise(until);
                function captureRecursive(selector, root = document.documentElement, params = {}) {
                    const sub = (str, args) =>
                        str.replace(/\$\(([^\)]+)\)/, (original, arg) => args[arg] ?? original);
                    function resolve(element, params) {
                        const nameAfterSubs = sub(name, params);
                        const classes = new Set();
                        const finalName = nameAfterSubs.replace(/\.([^\.]+)/g, (_, cls) => {
                            classes.add(cls);
                            return "";
                        });

                        for (const style of styles) {
                            let found = false;
                            const selector = style.selector.replace(/\(\.([^\)]+)\)/, (t, cls) => {
                                if (!classes.has(cls))
                                    return t;
                                found = true;
                                return `(${finalName})`;
                            });
                            if (!found)
                                continue;


                            const rule = /** @type {CSSStyleRule} */ (stylesheet.cssRules[stylesheet.insertRule(`${selector} {}`)]);
                            for (const prop in style.declaration)
                                rule.style.setProperty(prop, style.declaration[/** @type {string | null} */(prop)] ?? null);
                            stylesheet.insertRule(rule.cssText);
                        }
                        element.style.setProperty("view-transition-name", finalName);
                        until.then(() =>
                            element.style.removeProperty("view-transition-name"));
                    }

                    selector = selector.trim();
                    const result = /\[\:([^\]]+)\]/gd.exec(selector);
                    if (result) {
                        for (const element of root.querySelectorAll(selector.substr(0, result.index))) {
                            const newParams = {...params, [result[1]]: element.getAttribute(result[1])};
                            const next = selector.substring(result.indices[0][1]);
                            captureRecursive(next, element, newParams);
                        }
                    } else {
                        for (const element of selector.length ? root.querySelectorAll(selector) : [root])
                            resolve(element, params);
                    }
                }

                captureRecursive(selector);
            }

            if (phase !== "inbound")
                queueMicrotask(() => captureUntil(selector, name, transition.updateCallbackDone));
            if (phase !== "outbound") {
                promise(transition.updateCallbackDone).then(() =>
                    captureUntil(selector, name, transition.finished));
                transition.ready.then(() => {
                    const index = document.adoptedStyleSheets.length;
                    document.adoptedStyleSheets.push(stylesheet);
                    transition.finished.then(() => document.adoptedStyleSheets.splice(index, 1));
                });
            }

            return this;
        },

        /**
         * @param {string} selector
         * @param {Partial<CSSStyleDeclaration>} declaration
         */
        style(selector, declaration) {
            styles.push({selector, declaration});
            return this;
        }
    }
}
