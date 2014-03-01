GSS engine [![Build Status](https://travis-ci.org/the-gss/engine.png?branch=master)](https://travis-ci.org/the-gss/engine)
==========

[![Cross-browser testing status](https://saucelabs.com/browser-matrix/gss-engine.svg)](https://saucelabs.com/u/gss-engine)

Compiles and runs Grid Style Sheet (GSS) rules. GSS is an implementation of Badros & Borning's [Constraint Cascading Style Sheets](http://www.cs.washington.edu/research/constraints/web/ccss-uwtr.pdf), enabling far better layout control through building relational rules between different elements.

GSS supports the following syntaxes for defining layout rules:

* [CCSS](https://github.com/the-gss/ccss-compiler#readme) - direct constraints related to position and size of DOM elements
* [VFL](https://github.com/the-gss/vfl-compiler#readme) - horizontal and vertical spacing constraints based on [Apple's Visual Format Language](https://developer.apple.com/library/ios/documentation/userexperience/conceptual/AutolayoutPG/VisualFormatLanguage/VisualFormatLanguage.html)

Additionally, support for [GTL](https://github.com/the-gss/gtl-compiler#readme), based on the [W3C Grid Template Language](http://dev.w3.org/csswg/css-template/) is planned.

The main GSS repository provides a [Component](http://component.io/) library handling both the compilation and application of the layout constraints.

Please refer to <http://gridstylesheets.org/> for documentation and usage instructions.
