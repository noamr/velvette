/// <reference path="global.d.ts" />
export interface ViewTransitionParams {
    afterUpdateCallback: PromiseLike<void>
    transitionFinished: PromiseLike<void> | null
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