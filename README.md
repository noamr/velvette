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
We're definitely doing that. But implementing browser features takes time, and requires a consensus among
many players. Implementing them now in JS allows authors to use them ergonomically *today*, and also gives
us an experimentation ground to new ideas before they mature enough to go into the spec.

### Specify different transitions in the same page
### Generate unique view-transition-names
### Share pseudo-element styles between captured elements
### Respond to navigations
### Animate between list & details

## The API

