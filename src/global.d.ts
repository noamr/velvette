declare type URLPatternInit = {
    [key in "protocol" | "username" | "password" | "hostname" | "port" | "pathname" | "search" | "hash" | "baseURL"]: string;
}

declare type URLPatternInput = string | URLPatternInit;

declare interface URLPatternOptions {
    ignoreCase: boolean
}

declare interface URLPatternComponentResult {
    input: string;
    groups: {
        [key: string]: string
    };
}

declare interface URLPatternResult {
    inputs: URLPatternInput[];
    protocol: URLPatternComponentResult;
    username: URLPatternComponentResult;
    password: URLPatternComponentResult;
    hostname: URLPatternComponentResult;
    port: URLPatternComponentResult;
    pathname: URLPatternComponentResult;
    search: URLPatternComponentResult;
    hash: URLPatternComponentResult;
}

declare class URLPattern {
    constructor(input: URLPatternInput, baseURL: string, options ? : URLPatternOptions);
    test(input ? : URLPatternInput, baseURL ? : string): boolean;
    exec(input ? : URLPatternInput, baseURL ? : string): URLPatternResult;
}
declare interface Document {
    startViewTransition(updateCallback: () => Promise < void > ): ViewTransition;
}

declare interface NavigationInterceptor {
    handler(): Promise < void > ;
}

declare interface NavigateEvent extends Event {
    intercept(handler: NavigationInterceptor): void;
    destination: {
        url: string,
        index: number
    };
    navigationType: NavigationType;
}

declare interface Navigation extends EventTarget {
    currentEntry: {
        index: number
        url: string
    }
    activation: {
        from: {
            url: string
            index: number
        }
        entry: {
            url: string
            index: number
        }
        navigationType: NavigationType;
    }
}

declare interface Window {
    navigation: Navigation;
}

declare interface ViewTransition {
    ready: Promise < void > ;
    finished: Promise < void > ;
    updateCallbackDone: Promise < void > ;
    skipTransition: () => void;
}

declare interface PageRevealEvent extends Event {
    viewTransition: ViewTransition | null;
}

declare type NavigationType = "push" | "replace" | "traverse" | "reload";

declare interface CSSViewTransitionRule extends CSSRule {
    navigation: "auto" | "none";
}