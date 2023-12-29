# Velvette
Making it easier to author CSS View Transitions

## Tl;dr
A small JS library (~4kb minified) that implements common patterns on top of CSS view-transitions:
* Multiple transitions in the same page
* Unique name generation
* Share pseudo-element styles between captured elements
* Respond to navigations
* Animate between list and details

## Overview

### CSS View Transitions
[CSS View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions), released in 2022,
allow smooth transitions between different states of the same page, and soon they would allow smooth transitions
between different documents of the same origin.

### What's Missing
As it happens with web platform features, the patterns for using the feature emerged after its release.
We've found that people who use CSS view-transitions often end up running into similar challenges and gotchas,
having to write similar broilerplate code to overcome them.

### In comes Velvette
Velvette is a library that allows you to specify in a declarative way how your transitions should behave,
in isolation or as a response to a navigation,
and then apply the declaration to a particular [`ViewTransition`](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition), [`NavigateEvent`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent), or
use it to handle cross-document ("MPA") navigations.

### Why not implement these patterns in the browser instead?
The Chrome team is definitely doing that!
But implementing browser features takes time, and requires a consensus among many players.
Implementing them now in JS allows authors to use them ergonomically *today*, and also gives
us an experimentation ground to new ideas before they mature enough to go into the spec.

## General Design
`Velvette` handles these features by attaching to the `ViewTransition`'s promises, and changing the DOM in the following ways:
- Add temporary classes to the document element while capturing the transition states.
- Add constructed styles to the document while animating.
- Generate and set `view-transition-name` properties according to rules.
- Perform all of the above based on same-document navigations (using the Navigation API) or cross-document navigations.

### Extending a single transition

### Configuration & Navigations

## Features
(From simple to complex)

### Respond to old/new transition states
See [#9424](https://github.com/w3c/csswg-drafts/issues/9424).
Sometimes we want to style the transition based on "old" and "new" states.

`Velvette` does this automatically when a transition is extended, by setting
temporary classes `vt-old` and `vt-new` on the document element:

```js
import {extend} from "velvette";
extend(viewTransition);
```

```css
:root.vt-old #foo { view-transition-name: item; }
:root.vt-new #bar { view-transition-name: item; }
```


### Specify different transitions in the same page
See [isue #8960](https://github.com/w3c/csswg-drafts/issues/8960)

When there are multiple transitions in the same page, it's hard to define what is captured, often
leading to over-capturing unnecessary elements.

To specify a temporary class, extend a `ViewTransition` like so:
```js
import {extend} from "velvette";
extend(viewTransition).class("slide-main");
```

```css
:root.slide-main main {
    view-transition-name: main;
}
```

### Generate unique view-transition-names
See [#8320](https://github.com/w3c/csswg-drafts/issues/8320).

Some view-transitions operate on many elements in a page, rather than
on a given set of elements. A common use-case for this is animated list-sorting.
Setting unique `view-transition-name` properties on all the participating elements
could become a tideous job.

`Velvette` implements this in the form of attribute substitution:

```html
<main>
    <div class="box" id="box1"><img src="..."></div>
    <div class="box" id="box2"><img src="..."></div>
</main>
```
```js
import {extend} from "velvette";
extend(viewTransition).capture(".box[:id] img", "$(id)");
```

This would generate the following temporary CSS (as inline styles)
while capturing the transition:
```css
.box#box1 img { view-transition-name: box1 }
.box#box2 img { view-transition-name: box2 }
```

### Share pseudo-element styles between captured elements
[See #8319](https://github.com/w3c/csswg-drafts/issues/8319)

When we capture multiple elements under different names, we might
want to apply the same styles to their corresponding [pseudo-elements](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API#the_view_transition_process).

For example, in the example above, we might want all the boxes
to animate for a 1 second duration.

We do this by extending the view transition with a style that matches a capture, like so:
```js
extend(viewTransition)
    .capture(".box[:id] img", "$(id).any-box")
    .style("::view-transition-group(.any-box)", {animationDuration: "1s"})
```

This will generate styles for all the captured elements that fit the class, e.g.:

```css
::view-transition-group(box1) { animation-duration: 1s }
::view-transition-group(box2) { animation-duration: 1s }
```

## Responding to navigations
See [issue #8685](https://github.com/w3c/csswg-drafts/issues/8685), [issue #8925](https://github.com/w3c/csswg-drafts/issues/8925), [issue #8683](https://github.com/w3c/csswg-drafts/issues/8683), and others.

A common use-case for CSS view-transitions is responding to a navigation, whether it's in the same document
("SPA") or across same-origin documents ("MPA").

To help with this, constucting a `Velvette` object with a certain configuration lets you
declare the rules to how different navigations should be handled.

A navigation consists of an old URL, a new URL, and a navigation type, which could be
"`push`", "`replace`", "`reload`", "`traverse`", "`back`", "`forward`", or "`auto`" ("`auto`" means everything except "`reload`").

### Configuring the navigations

To configure a `Velvette` object to handle navigations, we need to provide `routes`, `rules`, `captures`, and `styles`. For example:

```js
new Velvette({
    routes: {
        "home": "/",
        "about": "/about"
    },
    rules: [
        {to: "home", type: "back", class: "slide-right"}
    ],
    captures: {
        "section#main": "main.slow"
    },
    styles: {
        '::view-transition-group(".slow")': {animationDuration: "3s"}
    }
});
```

When responding to a navigation, `Velvette` would find the last matching rule in the rules list,
and apply its class and parameters. If a matching rule is found, the view
transition would be invoked and the specified `class`, `captures` and `styles` would be activated,
exactly like calls to `extend` on a particular `ViewTransition`.

### Transition between list and details
See [issue #8209](https://github.com/w3c/csswg-drafts/issues/8209).

One thing that came up a lot from early adopters of CSS view-transitions is the difficulty to create
transitions between list & details pages, e.g. a playlist in `https://example.com/playlist/` that
animates the song thumbnail to the hero in `https://example.com/song/315` when selecting the
appropriate song in the playlist.

In `Velvette`, this is done in the navigation configuration, like so:

```js
new Velvette({
    routes: {
        "playlist": "/playlist/",
        "song": "/song/:song_id"
    },
    rules: [
        // "between" would match both song<->playlist and playlist<->song
        {between: ["song", "playlist"], class: "expand"}
    ],
    captures: {
        ".vt-expand.vt-route-song img#song-artwork": "artwork",
        ".vt-expand.vt-route-playlist ul.playlist li#song-$(song_id) img.thumbnail": "artwork"
    }
});
```

This example demonstrates several things that happen as a response to navigation:
- The class `vt-expand` is applied for the entire duration of the transition.
- The classes `vt-route-song` and `vt-route-playlist` are applied at the appropriate times only.
- The second capture replaces the `$(song_id)` string with the value of the `song_id` parameter
  coming from either route (in this case, the `song` route).



### Triggering the navigation

Once we have a configured `Velvette` object, we can apply it to navigations
in 3 different ways.

#### Same-document (custom)

To potentially start a view transition for a same-document navigation, we simply call `velvette.startNavigation`, like so:
```js
const velvette = new Velvette(config);
const transitionOrNull = velvette.startNavigation({
    from: "https://example.com/old-url",
    to: "https://example.com/new-url",
    // "push" | "replace" | "traverse" | "reload"
    navigationType,
    // e.g. -1 is "back"
    traverseDelta
}, async () => {
    // update the DOM to the new state
});
```

This allows integrating `Velvette` with routers or other styles
of SPA authoring.

#### Same-document (with the Navigation API)

With the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), the information about old URL, new URL and navigation type
is already known to us, so `Velvette` provides a convenient way to use
CSS view-transitions together with it:

```js
const velvette = new Velvette(config);
navigation.addEventListener("navigate", async event => {
    if (shouldIntercept(event)) {
        velvette.intercept(event, {
            async handler() {
                /* make actual changes based on the navigation */
            }
        });
    }
});
```

#### Cross-document
Note: cross-document navigations are currently only available in Chrome canary with experimental web features flag enabled, and is missing a few key features.
`Velvette` already works with the current set of features, and aims to keep up with the changes until
cross-document view transitions are stable.

To apply a `Velvette` configuration for cross-document view transitions:

```js
// This has to be called very early, before the first render opportunity.
// e.g. in a classic script in the <head>.
new Velvette(config).crossDocument();
```




## The API

