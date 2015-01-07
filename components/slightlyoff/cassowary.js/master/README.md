Cassowary JS
============

Cassowary is an algorithm that computes flexible, responsive layouts quickly
without resorting to piles of imperative code. Just describe the preferred
relationships between values, noting which constraints are more important than
others, and Cassowary figures out an optimal solution based on the current
inputs. When the inputs or constraints change, Cassowary is particularly
efficient at computing a new answer quickly based on the last-known solution.
These properties together make it ideal for use in layout systems -- indeed,
it's the algorithm at the center of Apple's new [Auto Layout system for iOS & OS X](https://developer.apple.com/library/ios/documentation/userexperience/conceptual/AutolayoutPG/Introduction/Introduction.html).

This repo hosts an improved version of [Greg Badros's
port](http://www.badros.com/greg/cassowary/js/quaddemo.html "JS Quad Demo") of
the [Cassowary hierarchial constraint
toolkit](http://www.cs.washington.edu/research/constraints/cassowary/) to
[JavaScript](http://cassowary.cvs.sourceforge.net/viewvc/cassowary/cassowary/js/).

This version dramatically improves the performance of the original translation,
removes external library dependencies, and improves hackability. The solver
core can now be used inside web workers, at the command line, and directly in
modern browsers.

For civil discussion of this port and constraint-based UIs, join the
[Overconstrained mailing
list](https://groups.google.com/forum/?fromgroups#!forum/overconstrained).

License
-------

Cassowary JS is licensed under the [Apache 2.0 license]
(http://www.apache.org/licenses/LICENSE-2.0).

Constraint Solver? Say What?
----------------------------

Constraint solvers are iterative algorithms that work towards ever more ideal
solutions, often using some variant of Dantzig's [simplex
method](http://en.wikipedia.org/wiki/Simplex_algorithm). They are primarily of
interest in situations where it's possible to easily set up a set of rules
which you would like a solution to adhere to, but when it is very difficult to
consider all of the possible solutions yourself.

Cassowary and other hierarchial constraint toolkits add a unique mechanism for
deciding between sets of rules that might conflict in determining which of a
set of possible solutions are "better". By allowing constraint authors to
specify *weights* for the constraints, the toolkit can decide in terms of
*stronger* constraints over weaker ones, allowing for more optimal solutions.
These sorts of situations arise *all the time* in UI programming; e.g.: "I'd
like this to be it's natural width, but only if that's smaller than 600px, and
never let it get smaller than 200px". Constraint solvers offer a way out of the
primordial mess of nasty conditionals and brittle invalidations.

If all of this sounds like it's either deeply esoteric or painfully academic,
you might start by boning up on what optimizers like this do and what they're
good for. I recommend John W. Chinneck's ["Practical Optimization: A Gentle
Introduction"](http://www.sce.carleton.ca/faculty/chinneck/po.html) and the
Cassowary paper that got me into all of this: ["Constraint Cascading Style
Sheets for the
Web"](http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.101.4819)

Getting Started Under Node
--------------------------

Cassowary is [distributed as an NPM package](https://npmjs.org/package/cassowary)
and can be added as a dependency or used under node in the usual way.
Using Cassowary under node is as simple as:

```js
// The entire API is exported by the cassowary object
var c = require("cassowary");

var solver = new c.SimplexSolver();
var x = new c.Variable({ value: 167 });
var y = new c.Variable({ value: 2 });
var eq = new c.Equation(x, new c.Expression(y));
solver.addConstraint(eq);
// ...
```

The current low (sub 0.1) version number reflects the instability of the API.
Also, note that the NPM package includes no tests or demos. For those, clone
the github repo.

To make an NPM package from sources, clone the github repo, follow the below
instructions for installing dependencies, and run `make dist`. This is the same
process the maintainers use to package NPM releases.

Getting Started From Source
---------------------------

This repo pulls in other Git repositories through
[submodules](http://help.github.com/submodules/) and pulls in [intern](http://theintern.io) for testing via npm. After cloning the repo, run:

```
$ git submodule update --init
$ npm install
...
```

To run the tests, point your thorougly modern browser at `tests/unittests.html?config=tests/intern` and view the console. You can also check out `demos/quad/quaddemo.html`.

Running tests from the command line requires [Node](http://nodejs.org/). Once
you've installed Node, run:

```
$ npm test

> cassowary@0.0.2 test /Users/bitpshr/Projects/cassowary.js
> node node_modules/intern/client.js config=tests/intern

Defaulting to "console" reporter

...

121/122 tests passed
```

If you have a working `make`, a Makefile is provided with a `test` target that
does the same thing. The Makefile also provides a `make build` target which
generates a new minified `bin/c.js` binary out of the files in `src/`. It
requires Python and isn't something you should need to do manually as it's not
reqired to run tests or use the solver. The checked-in binary should always be
up-to-date (or at some checkpoint which is known-good), so use it in your
projects instead of the source versions.

Supported Runtimes
------------------

This refactoring currently runs in:

  * Chrome
  * Firefox 9+
  * Opera 11+
  * Safari 5+
  * IE 9+
  * Command-line:
    * V8 (d8 shell)
    * JSC (built into OS X)
    * Rhino (Java) js.jar included in checkout

This is an unapologetically modern reinterpretation optimized for size, low
complexity, and speed. It will not work on old versions of IE.

Configuration
-------------

```
// Log general debugging information
c.debug = [ false || true ]; // default false
// Detailed logging
c.trace = [ false || true ]; // default false
// Verbose logging
c.verbose = [ false || true ]; // default false
// Logging of tableau additions
c.traceAdded = [ false || true ]; // default false
// Logging of ...?
c.GC = [ false || true ]; // default false
```

Current Build Status
--------------------

Binary versions of the solver that work in both the browser and under node are
available in the `bin/` directory and are updated frequently. Tests are run on
each commit via Travis CI:

[![Build Status](https://travis-ci.org/slightlyoff/cassowary-js-refactor.png?branch=master)](https://travis-ci.org/slightlyoff/cassowary-js-refactor)

Pull requests that do not include tests or break the build will be denied or 
reverted, respectively.


<!--
TODO(slightlyoff): show how to set configuration information through command line and in the tests.

API
---

TODO(slightlyoff)

Make and NPM Targets
--------------------

TODO(slightlyoff)
-->
