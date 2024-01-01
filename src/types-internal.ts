/// <reference path="global.d.ts" />
export interface ViewTransitionParams {
    viewTransition : ViewTransition
    captures?: {[selector: string]: string}
    styles?: {[selector: string]: Partial<CSSStyleDeclaration>}
    classes?: Partial<{
        old: string[]
        new: string[]
        both: string[]
    }>
}

export interface NavigationInfo {
    params: {[key: string]: string}
    class: string | null
    from: string | null
    to: string | null
}