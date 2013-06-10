GSS engine [![Build Status](https://travis-ci.org/the-gss/engine.png?branch=master)](https://travis-ci.org/the-gss/engine)
==========

This library processes parsed GSS constraints, solves them using Cassowary, and updates CSS accordingly.

## Supported dimensions

Each instance of the GSS engine is run for a given DOM container. If no container is provided, the GSS engine will fall back to the [document object](https://developer.mozilla.org/en-US/docs/Web/API/document).

Constraints are given by using various dimensions of elements. The elements are chosen using standard [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_started/Selectors).

The currently supported dimensions of an element are:

* width (shorthand: `w`)
* height (shorthand: `h`)
* `top` (shorthand: `y`)
* `left` (shorthand: `x`)
* bottom *read-only*
* right *read-only*
* centerX *read-only*
* centerY *read-only*

## Cassowary

[Cassowary](http://www.cs.washington.edu/research/constraints/cassowary/) is a constraint solving toolkit that GSS uses for solving the correct sizes and positions for the various elements.

### Cassowary-DOM Connection

As with the [Badros and Borning's SCWM](http://www.jeffreynichols.com/papers/scwm-aaai.pdf), to connect the Cassowary constraint solver to UI objects, or in our case the DOM elements, each UI object has four constrainable variables of the class `c.Variable`:

`x`, `y`, `width`, `height`

These four constraint variables are instantiated and cached per UI object.  The other constraint relevant 'variables' available per UI object are actually constraint expressions of the class `c.Expression`, these include:

`centerX`, `centerY`, `right`, `bottom`

These constraint expressions are exposed like variables, but unlike constraint variables, each get returns a new instance of the expression.
