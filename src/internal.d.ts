/** @param {Config} config */
export function init(config: Config): {
    findMatchingNav: (navigation: {
        navigationType: "push" | "replace" | "traverse" | "reload";
        traverseDelta: number;
        to: string;
        from: string;
    }) => NavResult | null;
    /**
     *
     * @param {NavigateEvent} event
     * @returns {NavResult | null}
     */
    findMatchingNavForNavigateEvent: (event: NavigateEvent) => NavResult | null;
    apply: (context: any, params: any) => void;
    /**
     *
     * @param {NavResult} nav
     * @param {ViewTransition} transition
     * @param {"inbound" | "outbound" | "both"} phase
     */
    applyNav(nav: NavResult, transition: ViewTransition, phase: "inbound" | "outbound" | "both"): void;
};
export type Config = import("./types.ts").Config;
export type NavResult = import("./types.ts").NavResult;
export type ExtendedNavigationType = import("./types.ts").ExtendedNavigationType;
