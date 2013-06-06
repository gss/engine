GSS engine [![Build Status](https://travis-ci.org/the-gss/engine.png?branch=master)](https://travis-ci.org/the-gss/engine)
==========

This library processes parsed GSS constraints, solves them using Cassowary, and updates CSS accordingly.

# Cassowary

## Cassowary-DOM Connection

As with the [Badros and Borning's SCWM](http://www.jeffreynichols.com/papers/scwm-aaai.pdf), to connect the Cassowary constraint solver to UI objects, or in our case the DOM elements, each UI object has four constrainable variables of the class `c.Variable`:

`x`, `y`, `width`, `height`

These four constraint variables are instantiated and cached per UI object.  The other constraint relevant 'variables' available per UI object are actually constraint expressions of the class `c.Expression`, these include:

`centerX`, `centerY`, `right`, `bottom`

These constraint expressions are exposed like variables, but unlike constraint variables, each get returns a new instance of the expression.

 