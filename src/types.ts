/// <reference path="global.d.ts" />
export type ExtendedNavigationType = NavigationType | "back" | "forward" | "auto";
export interface Config {
    routes: {[name: string]: string};
    captures: {[selector: string]: string};
    rules: (({from: string, to: string} |
            {from: string} | {to: string} |
            {with: string} | {between: [string, string]}) & {
                type?: ExtendedNavigationType,
                class?: string
            })[];
    styles?: {[selector: string]: Partial<CSSStyleDeclaration>}
}

export interface NavigationInfo {
    params: {[key: string]: string}
    class: string | null
    from: string | null
    to: string | null
}

export declare class VelvetteEvent extends Event{
    constructor(type: "inbound" | "outbound", viewTransition: ViewTransition);
    viewTransition: ViewTransition;
}

export interface CrossDocumentViewTransition {
    addEventListener(type: "inbound" | "outbound", callback: (event: VelvetteEvent) => any): void;
    dispatchEvent(event: VelvetteEvent): void;
}