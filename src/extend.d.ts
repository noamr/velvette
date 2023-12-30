export function fixPromise(promise: any, fixed: any): void;
/**
 * @param {ViewTransition} transition
 * @param {object} options
 * @param {"both" | "old-only" | "new-only"} options.phase
 * @param {string[]} options.oldClasses
 * @param {string[]} options.newClasses
 * */
export function extendInternal(transition: ViewTransition, { phase, oldClasses, newClasses }): {
    /** @param {string} cls */
    class(cls: string): any;
    /**
     * @param {string} selector
     * @param {string} name
     */
    capture(selector: string, name: string): any;
    /**
     * @param {string} selector
     * @param {Partial<CSSStyleDeclaration>} declaration
     */
    style(selector: string, declaration: Partial<CSSStyleDeclaration>): any;
};
