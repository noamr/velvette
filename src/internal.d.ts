/** @param {Config} config */
export function init(config: Config): {
    findMatchingNav: (navigation: {
        navigationType: "push" | "replace" | "traverse" | "reload";
        traverseDelta: number;
        to: string;
        from: string;
    }) => NavigationInfo | null;
    /**
     *
     * @param {NavigateEvent} event
     * @returns {NavigationInfo | null}
     */
    findMatchingNavForNavigateEvent: (event: NavigateEvent) => NavigationInfo | null;
    apply: (context: any, params: any) => void;
    /**
     *
     * @param {NavigationInfo} nav
     * @param {ViewTransition} transition
     * @param {"inbound" | "outbound" | "both"} phase
     */
    applyNav(nav: NavigationInfo, transition: ViewTransition, phase: "inbound" | "outbound" | "both"): void;
};
export type Config = import("./types.ts").Config;
export type NavigationInfo = import("./types.ts").NavigationInfo;
export type ExtendedNavigationType = import("./types.ts").ExtendedNavigationType;
