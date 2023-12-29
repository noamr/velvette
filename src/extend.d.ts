export function fixPromise(promise: any, fixed: any): void;
export function classScope(className: any, since: any, until: any): void;
/**
 * @param {ViewTransition} transition
 * @param {object} options
 * @param {"both" | "outbound" | "inbound"} options.phase
 * */
export function extendInternal(transition: ViewTransition, { phase }?: {
    phase: "both" | "outbound" | "inbound";
}): {
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
