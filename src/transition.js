// @ts-check
/// <reference path="global.d.ts" />

/**
 * @param {import("./types").ViewTransitionParams} transitionParams
 * @param {"new-only" | "old-only" | "both"} phase
 * @returns void
 * */
export async function start(transitionParams, phase) {
    /** @type {Set<HTMLElement>} */
    const elements = new Set();
    const stylesheet = new CSSStyleSheet();

    const oldClasses = [...(transitionParams.classes?.old || []), "old"];
    const newClasses = [...(transitionParams.classes?.new || []), "new"];

    if (phase !== "new-only") {
        applyClasses(oldClasses, true);
        applyClasses(transitionParams.classes?.both, true);
        applyCaptures();
        await transitionParams.viewTransition.updateCallbackDone;
        applyClasses(oldClasses, false);
        cleanupCaptures();
    }

    if (phase === "old-only")
        return;

    applyClasses(newClasses, true);
    applyCaptures();
    document.adoptedStyleSheets.push(stylesheet);
    await transitionParams.viewTransition.finished;
    document.adoptedStyleSheets.splice( document.adoptedStyleSheets.indexOf(stylesheet), 1);
    cleanupCaptures();
    applyClasses(newClasses, false);
    applyClasses(transitionParams.classes?.both, false);

    function applyCaptures() {
        const jobs = Object.entries(transitionParams.captures || {}).map(
            ([selector, name]) => ({selector, name, root: document.documentElement, params: {}})) ?? [];
        for (const {selector, name, root, params} of jobs) {
            /**
             *
             * @param {string} str
             * @param {{[key: string]: string}} args
             * @returns
             */
            const sub = (str, args) =>
                str.replace(/\$\(([^\)]+)\)/, (original, arg) => args[arg] ?? arg);

            const trimmedSelector = selector.trim();
            const result = /\[\:([^\]]+)\]/gd.exec(selector);
            if (result) {
                for (const element of root.querySelectorAll(trimmedSelector.substr(0, result.index))) {
                    const newParams = {...params, [result[1]]: element.getAttribute(result[1])};
                    // @ts-ignore
                    const next = trimmedSelector.substring(result.indices[0][1]);
                    jobs.push({selector: next, name, root: /** @type {HTMLElement} */(element), params: newParams})
                }

                continue;
            }

            let children = [root];
            if (selector.length) {
                try {
                    children = Array.from(/** @type {NodeListOf<HTMLElement>} */(root.querySelectorAll(selector)));
                } catch (e) {}
            }

            for (const element of children) {
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

    /**
     *
     * @param {string} name
     * @param {Set<string>} classes
     * @returns
     */
    function applyStyles(name, classes) {
        if (phase === "old-only")
            return;
        for (let [selector, declaration] of Object.entries(transitionParams.styles || {})) {
            let found = false;
            selector = selector.replace(/\(\.([^\)]+)\)/, (t, cls) => {
                if (!classes.has(cls))
                    return t;
                found = true;
                return `(${name})`;
            });
            if (!found)
                continue;

            const rule = /** @type {CSSStyleRule} */ (stylesheet.cssRules[stylesheet.insertRule(`${selector} {}`)]);
            for (const prop in declaration)
                rule.style.setProperty(prop, declaration[/** @type {string | null} */(prop)] ?? null);
            stylesheet.insertRule(rule.cssText);
        }
    }

    function cleanupCaptures() {
        for (const e of elements)
            e.style.removeProperty("view-transition-name");
        elements.clear();
    }

    /**
     * @param {string[] | null | undefined} classes
     * @param {boolean} enable
     */
    function applyClasses(classes, enable) {
        for (const cls of classes || [])
            document.documentElement.classList.toggle(`vt-${cls}`, enable);
    }
}
