// @ts-check
/// <reference path="global.d.ts" />
const promise_fixers = new WeakMap();

/**
 *
 * @param {Promise<void>} p
 * @returns {Promise<void>}
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
 * @param {string[]} classes
 * @param {boolean} enable
 */
function applyClasses(classes, enable) {
    for (const cls of classes)
        document.documentElement.classList.toggle(cls, enable);
}


/**
 * @param {object} options
 * @param {"both" | "old-only" | "new-only"} options.phase
 * @param {string[]} options.oldClasses
 * @param {string[]} options.newClasses
 * @param {{selector: string, declaration: Partial<CSSStyleDeclaration>}[]} options.styles
 * @param {ViewTransition} options.transition
 * @param {{selector: string, name: string}[]} options.captures
 */
async function process({transition, oldClasses, newClasses, phase, captures, styles}) {
    /** @type {Set<HTMLElement>} */
    const elements = new Set();
    const stylesheet = new CSSStyleSheet();

    if (phase !== "new-only") {
        applyClasses(oldClasses, true);
        applyCaptures();
        await promise(transition.updateCallbackDone);
        applyClasses(oldClasses, false);
        cleanupCaptures();
    }

    if (phase === "old-only")
        return;

    applyClasses(newClasses, true);
    applyCaptures();
    document.adoptedStyleSheets.push(stylesheet);
    await promise(transition.finished);
    document.adoptedStyleSheets.splice( document.adoptedStyleSheets.indexOf(stylesheet), 1);
    cleanupCaptures();
    applyClasses(newClasses, false);

    function applyCaptures() {
        const jobs = captures.map(({selector, name}) => ({selector, name, root: document.documentElement, params: {}}));
        for (const {selector, name, root, params} of jobs) {
            const sub = (str, args) =>
                str.replace(/\$\(([^\)]+)\)/, (original, arg) => args[arg] ?? arg);

            const trimmedSelector = selector.trim();
            const result = /\[\:([^\]]+)\]/gd.exec(selector);
            if (result) {
                for (const element of root.querySelectorAll(trimmedSelector.substr(0, result.index))) {
                    const newParams = {...params, [result[1]]: element.getAttribute(result[1])};
                    const next = trimmedSelector.substring(result.indices[0][1]);
                    jobs.push({selector: next, name, root: /** @type {HTMLElement} */(element), params: newParams})
                }

                continue;
            }

            for (const element of selector.length ?
                /** @type {NodeListOf<HTMLElement>} */(root.querySelectorAll(selector)) :
                [root]) {
                const nameAfterSubs = sub(name, params);
                const classes = new Set();
                const finalName = nameAfterSubs.replace(/\.([^\.]+)/g, (_, cls) => {
                    classes.add(cls);
                    return "";
                });

                element.style.setProperty("view-transition-name", finalName);
                elements.add(element);
                applyStyles(finalName, classes);
            }
        }
    }

    function applyStyles(name, classes) {
        if (phase === "old-only")
            return;
        for (const style of styles) {
            let found = false;
            const selector = style.selector.replace(/\(\.([^\)]+)\)/, (t, cls) => {
                if (!classes.has(cls))
                    return t;
                found = true;
                return `(${name})`;
            });
            if (!found)
                continue;

            const rule = /** @type {CSSStyleRule} */ (stylesheet.cssRules[stylesheet.insertRule(`${selector} {}`)]);
            for (const prop in style.declaration)
                rule.style.setProperty(prop, style.declaration[/** @type {string | null} */(prop)] ?? null);
            stylesheet.insertRule(rule.cssText);
        }
    }

    function cleanupCaptures() {
        for (const e of elements)
            e.style.removeProperty("view-transition-name");
        elements.clear();
    }
}

/**
 * @param {ViewTransition} transition
 * @param {object} options
 * @param {"both" | "old-only" | "new-only"} options.phase
 * @param {string[]} options.oldClasses
 * @param {string[]} options.newClasses
 * */
export function extendInternal(transition, options) {
    /**
     * @type {{selector: string, declaration: Partial<CSSStyleDeclaration>}[]}
     */
    const styles = [];
    /**
     * @type {{selector: string, name: string}[]}
     */
    const captures = [];
    const oldClasses = [...options.oldClasses, "vt-old"];
    const newClasses = [...options.newClasses, "vt-new"];

    queueMicrotask(() => {
        process({
            transition,
            phase: options.phase,
            captures, oldClasses, newClasses, styles
        });
    });

    /**
     * @type {{selector: string, declaration: Partial<CSSStyleDeclaration>}[]}
     */
    return {
        /** @param {string} cls */
        class(cls) {
            oldClasses.push(cls);
            newClasses.push(cls);
            return this;
        },

        /**
         * @param {string} selector
         * @param {string} name
         */
        capture(selector, name) {
            captures.push({selector, name});
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
