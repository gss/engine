(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./cassowary");

require("./command-nested-rules");

require("./selectors");

require("./matrix");

require("./conditions");

require("./command");

require("./domain");

require("./end-to-end");

require("./engine");

require("./perf");

require("./units");

require("./matrix");

require("./signatures");

require("./styles");

require("./thread");

require("./stylesheet");

require("./poly-test/full");



},{"./cassowary":2,"./command":4,"./command-nested-rules":3,"./conditions":5,"./domain":6,"./end-to-end":7,"./engine":8,"./matrix":9,"./perf":10,"./poly-test/full":11,"./selectors":12,"./signatures":13,"./styles":14,"./stylesheet":15,"./thread":16,"./units":17}],2:[function(require,module,exports){
var c, expect;

expect = chai.expect;

c = GSS.prototype.Domains.Linear.prototype.Solver;

describe('Cassowary', function() {
  it('should be available', function() {
    return expect(c).to.be.a('function');
  });
  it('var >= num', function() {
    var ieq, solver, x;
    solver = new c.SimplexSolver();
    x = new c.Variable({
      value: 10
    });
    ieq = new c.Inequality(x, c.GEQ, 100);
    solver.addConstraint(ieq);
    return expect(x.value).to.equal(100);
  });
  it('[x]==7; [y]==5; [x] - [y] == [z] // z is 2', function() {
    var eq1, eq2, eq3, solver, x, y, z;
    solver = new c.SimplexSolver();
    x = new c.Variable();
    y = new c.Variable();
    z = new c.Variable();
    eq1 = new c.Equation(x, 7);
    eq2 = new c.Equation(y, 5);
    eq3 = new c.Equation(c.minus(x, y), z);
    solver.addConstraint(eq1);
    solver.addConstraint(eq2);
    solver.addConstraint(eq3);
    expect(x.value).to.equal(7);
    expect(y.value).to.equal(5);
    return expect(z.value).to.equal(2);
  });
  it('top left right bottom // z is 2', function() {
    var eq1, eq2, eq3, solver, x, y, z;
    solver = new c.SimplexSolver();
    x = new c.Variable();
    y = new c.Variable();
    z = new c.Variable();
    eq1 = new c.Equation(x, 7);
    eq2 = new c.Equation(y, 5);
    eq3 = new c.Equation(c.minus(x, y), z);
    solver.addConstraint(eq1);
    solver.addConstraint(eq2);
    solver.addConstraint(eq3);
    expect(x.value).to.equal(7);
    expect(y.value).to.equal(5);
    return expect(z.value).to.equal(2);
  });
  it('plus expression', function() {
    var aw, eq1, eq2, eq3, pad, solver, tw;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    aw = new c.Variable();
    tw = new c.Variable();
    pad = new c.Variable();
    eq1 = new c.Equation(tw, 100, c.Strength.required);
    eq2 = new c.Equation(aw, c.plus(tw, pad), c.Strength.required);
    eq3 = new c.Equation(pad, 2, c.Strength.required);
    solver.addConstraint(eq1).addConstraint(eq2).addConstraint(eq3);
    solver.solve();
    expect(aw.value).to.equal(102);
    expect(tw.value).to.equal(100);
    return expect(pad.value).to.equal(2);
  });
  it('times expression', function() {
    var aw, eq1, eq2, solver, tw, zoom;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    aw = new c.Variable();
    tw = new c.Variable();
    zoom = new c.Variable();
    solver.addEditVar(zoom);
    solver.beginEdit();
    solver.suggestValue(zoom, 2);
    solver.solve();
    eq1 = new c.Equation(tw, 100, c.Strength.required);
    eq2 = new c.Equation(aw, c.times(tw, zoom.value), c.Strength.required);
    solver.addConstraint(eq1).addConstraint(eq2);
    solver.solve();
    expect(aw.value).to.equal(200);
    expect(tw.value).to.equal(100);
    return expect(zoom.value).to.equal(2);
  });
  it('hierarchy', function() {
    var eq1, eq2, eq3, solver, x;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    x = new c.Variable();
    eq1 = new c.Equation(x, 100, c.Strength.strong);
    eq2 = new c.Equation(x, 10, c.Strength.medium);
    eq3 = new c.Equation(x, 1, c.Strength.weak);
    solver.addConstraint(eq1).addConstraint(eq2).addConstraint(eq3);
    solver.solve();
    expect(x.value).to.equal(100);
    solver.removeConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(10);
    solver.removeConstraint(eq2);
    solver.solve();
    return expect(x.value).to.equal(1);
  });
  return it('weights', function() {
    var eq1, eq2, solver, x;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    x = new c.Variable();
    eq1 = new c.Inequality(x, c.GEQ, 100, c.Strength.medium, 0.5);
    eq2 = new c.Inequality(x, c.GEQ, 10, c.Strength.medium, 0.3);
    solver.addConstraint(eq1).addConstraint(eq2);
    solver.solve();
    expect(x.value).to.equal(100);
    solver.removeConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(10);
    solver.addConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(100);
    solver.solve();
    solver.removeConstraint(eq2);
    expect(x.value).to.equal(100);
    solver.solve();
    solver.removeConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(0);
    solver.addConstraint(eq2);
    solver.solve();
    return expect(x.value).to.equal(10);
  });
});



},{}],3:[function(require,module,exports){
var Engine, assert, expect, fixtures, remove, stringify;

Engine = GSS;

assert = chai.assert;

expect = chai.expect;

stringify = function(o) {
  return o;
  return JSON.stringify(o, 1, 1);
};

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

fixtures = document.getElementById('fixtures');

describe('Nested Rules', function() {
  var container, engine;
  container = null;
  engine = null;
  beforeEach(function() {
    var old;
    if (old = (container != null ? container._gss_id : void 0) && GSS(container)) {
      old.destroy();
    }
    container = document.createElement('div');
    container.id = 'container0';
    fixtures.appendChild(container);
    return window.$engine = engine = new GSS(container);
  });
  afterEach(function() {
    return remove(container);
  });
  describe('Basic', function() {
    describe('flat', function() {
      return it('Runs commands from sourceNode', function(done) {
        var rules;
        rules = [['==', ["get", "target-size"], 100]];
        engine.once('solve', function() {
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: ''
                }, ['==', ["get", "target-size"], 100]
              ]
            ]
          ]));
          return done();
        });
        return engine.solve(rules);
      });
    });
    describe('mixed selectors', function() {
      return it('should support mixed selectors', function(done) {
        var rules;
        rules = [['==', ["get", [':get', ['tag', [' ', ['tag', ['!', ['.', ['tag', ['>', ['tag', 'header']], 'h2'], 'gizoogle']], 'section']], 'div'], 'parentNode'], "target-size"], 100]];
        container.innerHTML = "<section id=\"s\">\n  <div id=\"d\">\n    <header id=\"h\">\n      <h2 class='gizoogle' id=\"h2\">\n      </h2>\n    </header>\n  </div>\n</section>";
        GSS.console.log(container.innerHTML);
        GSS.console.info("(header > h2.gizoogle ! section div:get('parentNode'))[target-size] == 100");
        engine.once('solve', function() {
          expect(engine.updated.getProblems()).to.eql([
            [
              [
                {
                  key: "header>h2.gizoogle$h2↑!$s↑section div$d↑:getparentNode"
                }, ['==', ["get", "$s[target-size]"], 100]
              ]
            ]
          ]);
          return done();
        });
        return engine.solve(rules);
      });
    });
    describe('reversed sibling combinators', function() {
      return it('should support mixed selectors', function(done) {
        var all, parent, rules;
        rules = [['==', ["get", ['tag', ['!~', ['tag', ['+', ['tag', 'div']], 'main']], '*'], "width"], 50]];
        container.innerHTML = "<section>\n  <h1 id=\"header0\"></h1>\n  <div id=\"box0\"></div>\n  <main id=\"main0\"></main>\n</section>";
        GSS.console.log(container.innerHTML);
        GSS.console.info("(div + main !~ *)[width] == 50");
        all = container.getElementsByTagName('*');
        parent = all.main0.parentNode;
        engine.once('solve', function() {
          expect(engine.updated.getProblems()).to.eql([
            [
              [
                {
                  key: "div+main$main0↑!~$header0↑*"
                }, ['==', ["get", "$header0[width]"], 50]
              ]
            ], [
              [
                {
                  key: "div+main$main0↑!~$box0↑*"
                }, ['==', ["get", "$box0[width]"], 50]
              ]
            ]
          ]);
          expect(stringify(engine.updated.solution)).to.eql(stringify({
            "$header0[width]": 50,
            "$box0[width]": 50
          }));
          expect(all.header0.style.width).to.eql('50px');
          expect(all.box0.style.width).to.eql('50px');
          GSS.console.error('Mutation: container.removeChild(#main)');
          parent.removeChild(all.main0);
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", "div+main$main0↑!~$header0↑*"], ["remove", "div+main$main0↑!~$header0"], ["remove", "div+main$main0↑!~$box0↑*"], ["remove", "div+main$main0↑!~$box0"], ["remove", "div+main$main0"]], [["remove", "div+main$main0↑!~$header0↑*"]], [["remove", "div+main$main0↑!~$box0↑*"]]]));
            expect(stringify(engine.updated.solution)).to.eql(stringify({
              "$header0[width]": null,
              "$box0[width]": null
            }));
            expect(all.header0.style.width).to.eql('');
            expect(all.box0.style.width).to.eql('');
            return done();
          });
        });
        return engine.solve(rules);
      });
    });
    describe('1 level w/ ::', function() {
      return it('Runs commands from sourceNode', function(done) {
        var rules;
        rules = [['rule', ['.', [' ', ['.', 'vessel']], 'box'], ['==', ["get", ["&"], "x"], 100]]];
        GSS.console.info(".vessel .box { ::[x] == 100 }");
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div class=\"vessel\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div id=\"box3\" class=\"box\"></div>\n<div id=\"box4\" class=\"box\"></div>";
        engine.once('solve', function() {
          expect(engine.updated.getProblems()).to.eql([
            [
              [
                {
                  key: '.vessel .box$box1',
                  scope: '$box1'
                }, ['==', ['get', '$box1[x]'], 100]
              ]
            ], [
              [
                {
                  key: '.vessel .box$box2',
                  scope: '$box2'
                }, ['==', ['get', '$box2[x]'], 100]
              ]
            ]
          ]);
          return done();
        });
        return engine.solve(rules);
      });
    });
    describe('subqueries', function() {
      return it('should observe selector on ::', function(done) {
        var box1, box2, rules, vessel0;
        rules = ["rule", [".", "vessel"], ['==', ["get", [".", [' ', ["&"]], "box"], "x"], 100]];
        GSS.console.info(".vessel { (:: .box)[x] == 100 }");
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div class=\"vessel\" id=\"vessel0\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div id=\"box3\" class=\"box\"></div>\n<div id=\"box4\" class=\"box\"></div>";
        box1 = container.getElementsByClassName('box')[1];
        box2 = container.getElementsByClassName('box')[2];
        vessel0 = container.getElementsByClassName('vessel')[0];
        engine.once('solve', function() {
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: '.vessel$vessel0↓ .box$box1',
                  scope: "$vessel0"
                }, ['==', ['get', '$box1[x]'], 100]
              ]
            ], [
              [
                {
                  key: '.vessel$vessel0↓ .box$box2',
                  scope: "$vessel0"
                }, ['==', ['get', '$box2[x]'], 100]
              ]
            ]
          ]));
          expect(stringify(engine.values)).to.eql(stringify({
            "$box1[x]": 100,
            "$box2[x]": 100
          }));
          expect(box1.style.left).to.eql('100px');
          expect(box2.style.left).to.eql('100px');
          box1.setAttribute('class', '');
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', '.vessel$vessel0↓ .box$box1']], [['remove', '.vessel$vessel0↓ .box$box1']]]));
            expect(stringify(engine.values)).to.eql(stringify({
              "$box2[x]": 100
            }));
            expect(box1.style.left).to.eql('');
            expect(box2.style.left).to.eql('100px');
            box1.setAttribute('class', 'box');
            return engine.once('solve', function() {
              expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                [
                  [
                    {
                      key: '.vessel$vessel0↓ .box$box1',
                      scope: "$vessel0"
                    }, ['==', ['get', '$box1[x]'], 100]
                  ]
                ]
              ]));
              expect(stringify(engine.values)).to.eql(stringify({
                "$box2[x]": 100,
                "$box1[x]": 100
              }));
              expect(box1.style.left).to.eql('100px');
              expect(box2.style.left).to.eql('100px');
              vessel0.setAttribute('class', '');
              return engine.once('solve', function() {
                expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".vessel$vessel0↓ .box$box1"], ["remove", ".vessel$vessel0↓ .box$box2"], ["remove", ".vessel$vessel0"]], [["remove", ".vessel$vessel0↓ .box$box2"]], [["remove", ".vessel$vessel0↓ .box$box1"]]]));
                expect(box1.style.left).to.eql('');
                expect(box2.style.left).to.eql('');
                vessel0.setAttribute('class', 'vessel');
                return engine.once('solve', function() {
                  expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                    [
                      [
                        {
                          key: '.vessel$vessel0↓ .box$box1',
                          scope: '$vessel0'
                        }, ['==', ['get', '$box1[x]'], 100]
                      ]
                    ], [
                      [
                        {
                          key: '.vessel$vessel0↓ .box$box2',
                          scope: '$vessel0'
                        }, ['==', ['get', '$box2[x]'], 100]
                      ]
                    ]
                  ]));
                  expect(stringify(engine.values)).to.eql(stringify({
                    "$box1[x]": 100,
                    "$box2[x]": 100
                  }));
                  expect(box1.style.left).to.eql('100px');
                  expect(box2.style.left).to.eql('100px');
                  return done();
                });
              });
            });
          });
        });
        return engine.solve(rules);
      });
    });
    describe('1 level w/ multiple selectors and &', function() {
      return it('should combine comma separated native selectors', function(done) {
        var box1, box3, rules, vessel0;
        rules = ['rule', [',', ['.', 'vessel'], ['#', 'group1']], ['==', ['get', [':first-child', [' ', ['&']]], 'y'], 100]];
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div class=\"vessel\" id=\"vessel0\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div class=\"group\" id=\"group1\">\n  <div id=\"box3\" class=\"box\"></div>\n  <div id=\"box4\" class=\"box\"></div>\n</div>";
        GSS.console.info(".vessel, #group1 { (:: :first-child)[y] == 100 }");
        vessel0 = container.getElementsByClassName('vessel')[0];
        box1 = container.getElementsByClassName('box')[1];
        box3 = container.getElementsByClassName('box')[3];
        engine.once('solve', function() {
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: '.vessel,#group1$vessel0↓ :first-child$box1',
                  scope: '$vessel0'
                }, ['==', ['get', '$box1[y]'], 100]
              ]
            ], [
              [
                {
                  key: '.vessel,#group1$group1↓ :first-child$box3',
                  scope: "$group1"
                }, ['==', ['get', '$box3[y]'], 100]
              ]
            ]
          ]));
          vessel0.setAttribute('class', '');
          expect(box1.style.top).to.eql('100px');
          expect(box3.style.top).to.eql('100px');
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', ".vessel,#group1$vessel0↓ :first-child$box1"], ['remove', ".vessel,#group1$vessel0"]], [['remove', ".vessel,#group1$vessel0↓ :first-child$box1"]]]));
            expect(box1.style.top).to.eql('');
            expect(box3.style.top).to.eql('100px');
            vessel0.setAttribute('class', 'vessel');
            return engine.once('solve', function() {
              expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                [
                  [
                    {
                      key: '.vessel,#group1$vessel0↓ :first-child$box1',
                      scope: '$vessel0'
                    }, ['==', ['get', '$box1[y]'], 100]
                  ]
                ]
              ]));
              expect(box1.style.top).to.eql('100px');
              expect(box3.style.top).to.eql('100px');
              return done();
            });
          });
        });
        return engine.solve(rules);
      });
    });
    describe('1 level w/ mixed multiple selectors and &', function() {
      return it('should implement comma for non-native selectors', function(done) {
        var box0, box1, box2, box3, box4, group1, rules, vessel0;
        rules = ['rule', [',', ['!>', ['#', 'box1']], ['tag', ['>'], 'div']], ['==', ['get', [':first-child', [' ', ['&']]], 'y'], 100]];
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div class=\"vessel\" id=\"vessel0\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div class=\"group\" id=\"group1\">\n  <div id=\"box3\" class=\"box\"></div>\n  <div id=\"box4\" class=\"box\"></div>\n</div>";
        GSS.console.info("#box1 !>, > div { (& :first-child)[y] == 100 }");
        vessel0 = container.getElementsByClassName('vessel')[0];
        box0 = container.getElementsByClassName('box')[0];
        box1 = container.getElementsByClassName('box')[1];
        box2 = container.getElementsByClassName('box')[2];
        box3 = container.getElementsByClassName('box')[3];
        box4 = container.getElementsByClassName('box')[4];
        group1 = container.getElementsByClassName('group')[0];
        engine.once('solve', function() {
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: '#box1!>,>div$vessel0↓ :first-child$box1',
                  scope: '$vessel0'
                }, ['==', ['get', '$box1[y]'], 100]
              ]
            ], [
              [
                {
                  key: '#box1!>,>div$group1↓ :first-child$box3',
                  scope: '$group1'
                }, ['==', ['get', '$box3[y]'], 100]
              ]
            ]
          ]));
          expect(box1.style.top).to.eql('100px');
          expect(box3.style.top).to.eql('100px');
          expect(engine.queries['#box1!>,>div'].length).to.eql(3);
          expect(engine.queries['#box1!>,>div'].duplicates.length).to.eql(1);
          GSS.console.error('box1.remove()');
          box1.parentNode.removeChild(box1);
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([
              [['remove', "#box1!>,>div$vessel0↓ :first-child$box1"], ['remove', "#box1!>"], ['remove', "#box1"]], [['remove', "#box1!>,>div$vessel0↓ :first-child$box1"]], [
                [
                  {
                    key: '#box1!>,>div$vessel0↓ :first-child$box2',
                    scope: '$vessel0'
                  }, ['==', ['get', '$box2[y]'], 100]
                ]
              ]
            ]));
            expect(box1.style.top).to.eql('');
            expect(box2.style.top).to.eql('100px');
            expect(box3.style.top).to.eql('100px');
            expect(engine.queries['#box1!>,>div'].length).to.eql(3);
            expect(engine.queries['#box1!>,>div'].duplicates.length).to.eql(0);
            expect(engine.queries['#box1']).to.eql(void 0);
            expect(engine.queries['#box1!>']).to.eql(void 0);
            vessel0.insertBefore(box1, vessel0.firstChild);
            GSS.console.error('prepend(box1)');
            return engine.once('solve', function() {
              expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                [['remove', "#box1!>,>div$vessel0↓ :first-child$box2"]], [['remove', '#box1!>,>div$vessel0↓ :first-child$box2']], [
                  [
                    {
                      key: '#box1!>,>div$vessel0↓ :first-child$box1',
                      scope: '$vessel0'
                    }, ['==', ['get', '$box1[y]'], 100]
                  ]
                ]
              ]));
              expect(box1.style.top).to.eql('100px');
              expect(box2.style.top).to.eql('');
              expect(box3.style.top).to.eql('100px');
              vessel0.removeChild(box1);
              GSS.console.error('box1.remove()');
              return engine.once('solve', function() {
                expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                  [['remove', "#box1!>,>div$vessel0↓ :first-child$box1"], ['remove', "#box1!>"], ['remove', "#box1"]], [['remove', "#box1!>,>div$vessel0↓ :first-child$box1"]], [
                    [
                      {
                        key: '#box1!>,>div$vessel0↓ :first-child$box2',
                        scope: '$vessel0'
                      }, ['==', ['get', '$box2[y]'], 100]
                    ]
                  ]
                ]));
                expect(box1.style.top).to.eql('');
                expect(box2.style.top).to.eql('100px');
                expect(box3.style.top).to.eql('100px');
                vessel0.parentNode.removeChild(vessel0);
                return engine.once('solve', function() {
                  expect(engine.queries['>'].length).to.eql(2);
                  expect(engine.queries['#box1!>,>div'].slice()).to.eql([box0, group1]);
                  expect(engine.queries['#box1!>,>div'].slice()).to.eql([box0, group1]);
                  expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', "#box1!>,>div$vessel0↓ :first-child$box2"], ['remove', "#box1!>,>div$vessel0"], ['remove', ">$vessel0↑div"], ['remove', ">$vessel0"]], [['remove', "#box1!>,>div$vessel0↓ :first-child$box2"]]]));
                  expect(box1.style.top).to.eql('');
                  expect(box2.style.top).to.eql('');
                  expect(box3.style.top).to.eql('100px');
                  expect(box4.style.top).to.eql('');
                  box3.parentNode.removeChild(box3);
                  return engine.once('solve', function() {
                    expect(box1.style.top).to.eql('');
                    expect(box2.style.top).to.eql('');
                    expect(box3.style.top).to.eql('');
                    expect(box4.style.top).to.eql('100px');
                    expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                      [['remove', "#box1!>,>div$group1↓ :first-child$box3"]], [['remove', "#box1!>,>div$group1↓ :first-child$box3"]], [
                        [
                          {
                            key: '#box1!>,>div$group1↓ :first-child$box4',
                            scope: '$group1'
                          }, ['==', ['get', '$box4[y]'], 100]
                        ]
                      ]
                    ]));
                    box4.parentNode.removeChild(box4);
                    return engine.once('solve', function() {
                      expect(box1.style.top).to.eql('');
                      expect(box2.style.top).to.eql('');
                      expect(box3.style.top).to.eql('');
                      expect(box4.style.top).to.eql('');
                      expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', "#box1!>,>div$group1↓ :first-child$box4"]], [['remove', "#box1!>,>div$group1↓ :first-child$box4"]]]));
                      expect(engine.queries['>'].slice()).to.eql([box0, group1]);
                      box0.parentNode.removeChild(box0);
                      return engine.once('solve', function() {
                        expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', "#box1!>,>div$box0"], ['remove', ">$box0↑div"], ['remove', ">$box0"]]]));
                        expect(engine.queries['#box1']).to.eql(void 0);
                        expect(engine.queries['#box1!>']).to.eql(void 0);
                        expect(engine.queries['#box1!>,>div'].slice()).to.eql([group1]);
                        expect(engine.queries['>'].slice()).to.eql([group1]);
                        group1.parentNode.removeChild(group1);
                        return engine.once('solve', function() {
                          expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', "#box1!>,>div$group1"], ['remove', ">$group1↑div"], ['remove', ">$group1"]]]));
                          window.zzzz = true;
                          GSS.console.log('append vessel0');
                          engine.scope.appendChild(vessel0);
                          return engine.once('solve', function() {
                            return done();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
        return engine.solve(rules);
      });
    });
    describe('1 level w/ $', function() {
      return it('Runs commands from sourceNode', function(done) {
        var rules;
        rules = [['rule', ['.', [' ', ['.', 'vessel']], 'box'], ["<=", ["get", ["&"], "width"], ["get", ["$"], "width"]]]];
        container.id = 'container0';
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div id=\"vessel1\" class=\"vessel\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div id=\"box3\" class=\"box\"></div>\n<div id=\"box4\" class=\"box\"></div>";
        engine.once('solve', function() {
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: '.vessel .box$box1',
                  scope: "$box1"
                }, ['<=', ['get', '$box1[width]'], ['get', '$container0[width]']]
              ], [
                {
                  key: '.vessel .box$box2',
                  scope: "$box2"
                }, ['<=', ['get', '$box2[width]'], ['get', '$container0[width]']]
              ]
            ]
          ]));
          return done();
        });
        return engine.solve(rules);
      });
    });
    describe('1 level w/ $ and selector', function() {
      return it('should resolve selector on $', function(done) {
        var clone, rules;
        rules = ['rule', ['.', [' ', ['.', 'group']], 'vessel'], ["<=", ["get", [':last-child', ['.', [' ', ['$']], 'box']], 'width'], 100]];
        GSS.console.info('.group .vessel { ($ .box:last-child)[width] == 100 }');
        container.innerHTML = "<div id=\"group1\" class=\"group\">\n  <div id=\"box0\" class=\"box\"></div>\n  <div id=\"vessel1\" class=\"vessel\">\n    <div id=\"box1\" class=\"box\"></div>\n    <div id=\"box2\" class=\"box\"></div>\n  </div>\n  <div id=\"box3\" class=\"box\"></div>\n  <div id=\"box4\" class=\"box\"></div>\n</div>";
        clone = container.cloneNode();
        clone.setAttribute('id', 'container1');
        clone.innerHTML = container.innerHTML.replace(/\d+/g, function(d) {
          return "1" + d;
        });
        engine.once('solve', function() {
          var newLast;
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: ".group .vessel$vessel1↓$ .box:last-child$box2",
                  scope: '$vessel1'
                }, ['<=', ['get', '$box2[width]'], 100]
              ]
            ], [
              [
                {
                  key: ".group .vessel$vessel1↓$ .box:last-child$box4",
                  scope: '$vessel1'
                }, ['<=', ['get', '$box4[width]'], 100]
              ]
            ]
          ]));
          newLast = document.createElement('div');
          newLast.id = 'box5';
          newLast.className = 'box';
          container.firstElementChild.appendChild(newLast);
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([
              [["remove", ".group .vessel$vessel1↓$ .box:last-child$box4"]], [["remove", ".group .vessel$vessel1↓$ .box:last-child$box4"]], [
                [
                  {
                    key: ".group .vessel$vessel1↓$ .box:last-child$box5",
                    scope: '$vessel1'
                  }, ['<=', ['get', '$box5[width]'], 100]
                ]
              ]
            ]));
            container.firstElementChild.setAttribute('class', '');
            return engine.once('solve', function() {
              expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', '.group .vessel$vessel1↓$ .box:last-child$box2'], ['remove', '.group .vessel$vessel1↓$ .box:last-child$box5'], ['remove', '.group .vessel$vessel1↓$'], ['remove', '.group .vessel$vessel1']], [['remove', '.group .vessel$vessel1↓$ .box:last-child$box2']], [['remove', '.group .vessel$vessel1↓$ .box:last-child$box5']]]));
              container.firstElementChild.setAttribute('class', 'group');
              return engine.once('solve', function() {
                expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                  [
                    [
                      {
                        key: ".group .vessel$vessel1↓$ .box:last-child$box2",
                        scope: '$vessel1'
                      }, ['<=', ['get', '$box2[width]'], 100]
                    ]
                  ], [
                    [
                      {
                        key: ".group .vessel$vessel1↓$ .box:last-child$box5",
                        scope: '$vessel1'
                      }, ['<=', ['get', '$box5[width]'], 100]
                    ]
                  ]
                ]));
                container.appendChild(clone);
                return engine.once('solve', function() {
                  expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                    [
                      [
                        {
                          key: '.group .vessel$vessel11↓$ .box:last-child$box2',
                          scope: '$vessel11'
                        }, ['<=', ['get', '$box2[width]'], 100]
                      ]
                    ], [
                      [
                        {
                          key: '.group .vessel$vessel11↓$ .box:last-child$box5',
                          scope: '$vessel11'
                        }, ['<=', ['get', '$box5[width]'], 100]
                      ]
                    ], [
                      [
                        {
                          key: '.group .vessel$vessel11↓$ .box:last-child$box12',
                          scope: '$vessel11'
                        }, ['<=', ['get', '$box12[width]'], 100]
                      ], [
                        {
                          key: '.group .vessel$vessel1↓$ .box:last-child$box12',
                          scope: '$vessel1'
                        }, ['<=', ['get', '$box12[width]'], 100]
                      ]
                    ], [
                      [
                        {
                          key: '.group .vessel$vessel11↓$ .box:last-child$box14',
                          scope: '$vessel11'
                        }, ['<=', ['get', '$box14[width]'], 100]
                      ], [
                        {
                          key: '.group .vessel$vessel1↓$ .box:last-child$box14',
                          scope: '$vessel1'
                        }, ['<=', ['get', '$box14[width]'], 100]
                      ]
                    ]
                  ]));
                  container.replaceChild(container.firstElementChild, container.lastElementChild);
                  return engine.once('solve', function() {
                    var box2;
                    expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".group .vessel$vessel11↓$ .box:last-child$box2"], ["remove", ".group .vessel$vessel11↓$ .box:last-child$box5"], ["remove", ".group .vessel$vessel11↓$ .box:last-child$box12"], ["remove", ".group .vessel$vessel11↓$ .box:last-child$box14"], ["remove", ".group .vessel$vessel11↓$"], ["remove", ".group .vessel$vessel11"], ["remove", ".group .vessel$vessel1↓$ .box:last-child$box12"], ["remove", ".group .vessel$vessel1↓$ .box:last-child$box14"]], [["remove", ".group .vessel$vessel11↓$ .box:last-child$box2"]], [["remove", ".group .vessel$vessel11↓$ .box:last-child$box5"]], [["remove", ".group .vessel$vessel11↓$ .box:last-child$box12", ".group .vessel$vessel1↓$ .box:last-child$box12"]], [["remove", ".group .vessel$vessel11↓$ .box:last-child$box14", ".group .vessel$vessel1↓$ .box:last-child$box14"]]]));
                    box2 = container.getElementsByClassName('box')[2];
                    box2.parentNode.removeChild(box2);
                    return engine.once('solve', function() {
                      var vessel;
                      expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                        [['remove', '.group .vessel$vessel1↓$ .box:last-child$box2']], [['remove', '.group .vessel$vessel1↓$ .box:last-child$box2']], [
                          [
                            {
                              key: ".group .vessel$vessel1↓$ .box:last-child$box1",
                              scope: '$vessel1'
                            }, ['<=', ['get', '$box1[width]'], 100]
                          ]
                        ]
                      ]));
                      vessel = container.getElementsByClassName('vessel')[0];
                      vessel.parentNode.removeChild(vessel);
                      return engine.once('solve', function() {
                        expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', '.group .vessel$vessel1↓$ .box:last-child$box1'], ['remove', ".group .vessel$vessel1↓$ .box:last-child$box5"], ['remove', ".group .vessel$vessel1↓$"], ['remove', ".group .vessel$vessel1"]], [['remove', ".group .vessel$vessel1↓$ .box:last-child$box5"]], [['remove', '.group .vessel$vessel1↓$ .box:last-child$box1']]]));
                        container.innerHTML = "";
                        return done();
                      });
                    });
                  });
                });
              });
            });
          });
        });
        return engine.solve(rules);
      });
    });
    describe('1 level w/ ^', function() {
      it('should resolve selector on ^', function(done) {
        var clone, rules;
        rules = [['rule', ['.', 'group'], ['rule', ['.', 'vessel'], ["<=", ["get", [':last-child', ['.', [' ', ["^"]], 'box']], 'width'], 100]]]];
        container.innerHTML = "<div id=\"group1\" class=\"group\">\n  <div id=\"box0\" class=\"box\"></div>\n  <div id=\"vessel1\" class=\"vessel\">\n    <div id=\"box1\" class=\"box\"></div>\n    <div id=\"box2\" class=\"box\"></div>\n  </div>\n  <div id=\"box3\" class=\"box\"></div>\n  <div id=\"box4\" class=\"box\"></div>\n</div>";
        clone = container.cloneNode();
        clone.setAttribute('id', 'container1');
        clone.innerHTML = container.innerHTML.replace(/\d+/g, function(d) {
          return "1" + d;
        });
        engine.once('solve', function() {
          var newLast;
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2",
                  scope: "$vessel1"
                }, ['<=', ['get', '$box2[width]'], 100]
              ]
            ], [
              [
                {
                  key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box4",
                  scope: "$vessel1"
                }, ['<=', ['get', '$box4[width]'], 100]
              ]
            ]
          ]));
          newLast = document.createElement('div');
          newLast.id = 'box5';
          newLast.className = 'box';
          container.firstElementChild.appendChild(newLast);
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([
              [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box4"]], [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box4"]], [
                [
                  {
                    key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5",
                    scope: "$vessel1"
                  }, ['<=', ['get', '$box5[width]'], 100]
                ]
              ]
            ]));
            container.firstElementChild.setAttribute('class', '');
            return engine.once('solve', function() {
              expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box2'], ['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box5'], ['remove', '.group$group1↓.vessel$vessel1↓^'], ['remove', ".group$group1↓.vessel$vessel1"], ['remove', ".group$group1"]], [['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box2']], [['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box5']]]));
              container.firstElementChild.setAttribute('class', 'group');
              return engine.once('solve', function() {
                expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                  [
                    [
                      {
                        key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2",
                        scope: "$vessel1"
                      }, ['<=', ['get', '$box2[width]'], 100]
                    ]
                  ], [
                    [
                      {
                        key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5",
                        scope: "$vessel1"
                      }, ['<=', ['get', '$box5[width]'], 100]
                    ]
                  ]
                ]));
                container.appendChild(clone);
                return engine.once('solve', function() {
                  expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                    [
                      [
                        {
                          key: ".group$group11↓.vessel$vessel11↓^ .box:last-child$box12",
                          scope: "$vessel11"
                        }, ['<=', ['get', '$box12[width]'], 100]
                      ]
                    ], [
                      [
                        {
                          key: ".group$group11↓.vessel$vessel11↓^ .box:last-child$box14",
                          scope: "$vessel11"
                        }, ['<=', ['get', '$box14[width]'], 100]
                      ]
                    ]
                  ]));
                  container.replaceChild(container.firstElementChild, container.lastElementChild);
                  return engine.once('solve', function() {
                    var box2;
                    expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box12'], ['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box14'], ['remove', '.group$group11↓.vessel$vessel11↓^'], ['remove', ".group$group11↓.vessel$vessel11"], ['remove', ".group$group11"]], [['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box12']], [['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box14']]]));
                    box2 = container.getElementsByClassName('box')[2];
                    box2.parentNode.removeChild(box2);
                    return engine.once('solve', function() {
                      var vessel;
                      expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                        [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2"]], [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2"]], [
                          [
                            {
                              key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box1",
                              scope: "$vessel1"
                            }, ['<=', ['get', '$box1[width]'], 100]
                          ]
                        ]
                      ]));
                      vessel = container.getElementsByClassName('vessel')[0];
                      vessel.parentNode.removeChild(vessel);
                      return engine.once('solve', function() {
                        expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box1'], ['remove', ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5"], ['remove', ".group$group1↓.vessel$vessel1↓^"], ['remove', ".group$group1↓.vessel$vessel1"]], [['remove', ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5"]], [['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box1']]]));
                        container.innerHTML = "";
                        return done();
                      });
                    });
                  });
                });
              });
            });
          });
        });
        return engine.solve(rules);
      });
      it('should handle mix of global and local selector', function(done) {
        var rules;
        rules = [['rule', ['.', [' ', ['.', 'vessel']], 'box'], ["<=", ["get", ["&"], "width"], ["get", ["#", [' ', ['$']], "vessel1"], "width"]]]];
        GSS.console.info('.vessel .box { ::[width] == #vessel1[width] } ');
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div id=\"vessel1\" class=\"vessel\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div id=\"box3\" class=\"box\"></div>\n<div id=\"box4\" class=\"box\"></div>";
        engine.once('solve', function() {
          var vessel1;
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  key: ".vessel .box$box1↓$ #vessel1$vessel1",
                  scope: "$box1"
                }, ["<=", ["get", "$box1[width]"], ["get", "$vessel1[width]"]]
              ], [
                {
                  key: ".vessel .box$box2↓$ #vessel1$vessel1",
                  scope: "$box2"
                }, ["<=", ["get", "$box2[width]"], ["get", "$vessel1[width]"]]
              ]
            ]
          ]));
          vessel1 = engine.id('vessel1');
          vessel1.parentNode.removeChild(vessel1);
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".vessel .box$box1↓$ #vessel1$vessel1"], ["remove", ".vessel .box$box1↓$"], ["remove", ".vessel .box$box1"], ["remove", ".vessel .box$box2↓$ #vessel1$vessel1"], ["remove", ".vessel .box$box2↓$"], ["remove", ".vessel .box$box2"]], [["remove", ".vessel .box$box1↓$ #vessel1$vessel1", ".vessel .box$box2↓$ #vessel1$vessel1"]]]));
            container.appendChild(vessel1);
            return engine.once('solve', function() {
              expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                [
                  [
                    {
                      key: ".vessel .box$box1↓$ #vessel1$vessel1",
                      scope: "$box1"
                    }, ["<=", ["get", "$box1[width]"], ["get", "$vessel1[width]"]]
                  ], [
                    {
                      key: ".vessel .box$box2↓$ #vessel1$vessel1",
                      scope: "$box2"
                    }, ["<=", ["get", "$box2[width]"], ["get", "$vessel1[width]"]]
                  ]
                ]
              ]));
              vessel1.parentNode.removeChild(vessel1);
              return engine.once('solve', function() {
                expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".vessel .box$box1↓$ #vessel1$vessel1"], ["remove", ".vessel .box$box1↓$"], ["remove", ".vessel .box$box1"], ["remove", ".vessel .box$box2↓$ #vessel1$vessel1"], ["remove", ".vessel .box$box2↓$"], ["remove", ".vessel .box$box2"]], [["remove", ".vessel .box$box1↓$ #vessel1$vessel1", ".vessel .box$box2↓$ #vessel1$vessel1"]]]));
                return done();
              });
            });
          });
        });
        return engine.solve(rules);
      });
      return it('Runs commands from sourceNode', function(done) {
        var rules;
        rules = [['rule', ['.', [' ', ['.', 'vessel']], 'box'], ["<=", ["get", ["&"], "width"], ["get", ["^"], "width"]]]];
        GSS.console.info('.vessel .box { ::[width] == ^[width] } ');
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div id=\"vessel1\" class=\"vessel\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div id=\"box3\" class=\"box\"></div>\n<div id=\"box4\" class=\"box\"></div>";
        engine.once('solve', function() {
          expect(engine.updated.getProblems()).to.eql([
            [
              [
                {
                  "key": ".vessel .box$box1",
                  "scope": "$box1"
                }, ["<=", ["get", "$box1[width]"], ["get", "$container0[width]"]]
              ], [
                {
                  "key": ".vessel .box$box2",
                  "scope": "$box2"
                }, ["<=", ["get", "$box2[width]"], ["get", "$container0[width]"]]
              ]
            ]
          ]);
          return done();
        });
        return engine.solve(rules);
      });
    });
    describe('2 level', function() {
      return it('Runs commands from sourceNode', function(done) {
        var box1, rules, vessel0;
        rules = ['rule', ['.', 'vessel'], ['rule', ['.', 'box'], ['<=', ["get", ["&"], "x"], 100]]];
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div class=\"vessel\" id=\"vessel0\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div id=\"box3\" class=\"box\"></div>\n<div id=\"box4\" class=\"box\"></div>";
        box1 = container.getElementsByClassName('box')[1];
        vessel0 = container.getElementsByClassName('vessel')[0];
        engine.once('solve', function() {
          expect(stringify(engine.updated.getProblems())).to.eql(stringify([
            [
              [
                {
                  "key": ".vessel$vessel0↓.box$box1",
                  "scope": "$box1"
                }, ["<=", ["get", "$box1[x]"], 100]
              ]
            ], [
              [
                {
                  "key": ".vessel$vessel0↓.box$box2",
                  "scope": "$box2"
                }, ["<=", ["get", "$box2[x]"], 100]
              ]
            ]
          ]));
          box1.setAttribute('class', '');
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', ".vessel$vessel0↓.box$box1"]], [['remove', ".vessel$vessel0↓.box$box1"]]]));
            box1.setAttribute('class', 'box');
            return engine.once('solve', function() {
              expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                [
                  [
                    {
                      "key": ".vessel$vessel0↓.box$box1",
                      "scope": "$box1"
                    }, ["<=", ["get", "$box1[x]"], 100]
                  ]
                ]
              ]));
              vessel0.setAttribute('class', '');
              return engine.once('solve', function() {
                expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', ".vessel$vessel0↓.box$box1"], ['remove', ".vessel$vessel0↓.box$box2"], ['remove', ".vessel$vessel0"]], [['remove', ".vessel$vessel0↓.box$box2"]], [['remove', ".vessel$vessel0↓.box$box1"]]]));
                vessel0.setAttribute('class', 'vessel');
                return engine.once('solve', function() {
                  expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                    [
                      [
                        {
                          "key": ".vessel$vessel0↓.box$box1",
                          "scope": "$box1"
                        }, ["<=", ["get", "$box1[x]"], 100]
                      ]
                    ], [
                      [
                        {
                          "key": ".vessel$vessel0↓.box$box2",
                          "scope": "$box2"
                        }, ["<=", ["get", "$box2[x]"], 100]
                      ]
                    ]
                  ]));
                  box1.parentNode.removeChild(box1);
                  return engine.once('solve', function() {
                    expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', ".vessel$vessel0↓.box$box1"]], [['remove', ".vessel$vessel0↓.box$box1"]]]));
                    vessel0.insertBefore(box1, vessel0.firstChild);
                    return engine.once('solve', function() {
                      expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                        [
                          [
                            {
                              "key": ".vessel$vessel0↓.box$box1",
                              "scope": "$box1"
                            }, ["<=", ["get", "$box1[x]"], 100]
                          ]
                        ]
                      ]));
                      engine.scope.innerHTML = "";
                      return engine.once('solve', function() {
                        expect(stringify(engine.updated.getProblems())).to.eql(stringify([[['remove', ".vessel$vessel0↓.box$box1"], ['remove', ".vessel$vessel0↓.box$box2"], ['remove', ".vessel$vessel0"]], [['remove', ".vessel$vessel0↓.box$box2"]], [['remove', ".vessel$vessel0↓.box$box1"]]]));
                        engine.scope.innerHTML = "";
                        return done();
                      });
                    });
                  });
                });
              });
            });
          });
        });
        return engine.solve(rules);
      });
    });
    return describe('2 level /w multiple selectors in parent', function(e) {
      return it('Runs commands from sourceNode', function(done) {
        var box2, rules, vessel0;
        rules = ['rule', [',', ['.', 'vessel'], ['#', 'group1']], ['rule', [':last-child', ['.', 'box']], ['==', ["get", ["&"], "x"], 100]]];
        container.innerHTML = "<div id=\"box0\" class=\"box\"></div>\n<div class=\"vessel\" id=\"vessel0\">\n  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n</div>\n<div class=\"group\" id=\"group1\">\n  <div id=\"box3\" class=\"box\"></div>\n  <div id=\"box4\" class=\"box\"></div>\n</div>";
        box2 = container.getElementsByClassName('box')[2];
        vessel0 = container.getElementsByClassName('vessel')[0];
        engine.once('solve', function() {
          expect(engine.updated.getProblems()).to.eql([
            [
              [
                {
                  "key": ".vessel,#group1$vessel0↓.box:last-child$box2",
                  "scope": "$box2"
                }, ["==", ["get", "$box2[x]"], 100]
              ]
            ], [
              [
                {
                  "key": ".vessel,#group1$group1↓.box:last-child$box4",
                  "scope": "$box4"
                }, ["==", ["get", "$box4[x]"], 100]
              ]
            ]
          ]);
          box2.setAttribute('class', '');
          return engine.once('solve', function() {
            expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]], [["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]]]));
            box2.setAttribute('class', 'box');
            return engine.once('solve', function() {
              expect(engine.updated.getProblems()).to.eql([
                [
                  [
                    {
                      "key": ".vessel,#group1$vessel0↓.box:last-child$box2",
                      "scope": "$box2"
                    }, ["==", ["get", "$box2[x]"], 100]
                  ]
                ]
              ]);
              vessel0.setAttribute('class', '');
              return engine.once('solve', function() {
                expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"], ["remove", ".vessel,#group1$vessel0"]], [["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]]]));
                vessel0.setAttribute('class', 'vessel');
                return engine.once('solve', function() {
                  [
                    {
                      "key": ".vessel,#group1$vessel0↓.box:last-child$box2",
                      "scope": "$box2"
                    }, ["==", ["get", "$box2[x]"], 100]
                  ];
                  vessel0.removeChild(box2);
                  return engine.once('solve', function() {
                    expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                      [["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]], [["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]], [
                        [
                          {
                            "key": ".vessel,#group1$vessel0↓.box:last-child$box1",
                            "scope": "$box1"
                          }, ["==", ["get", "$box1[x]"], 100]
                        ]
                      ]
                    ]));
                    vessel0.appendChild(box2);
                    return engine.once('solve', function() {
                      expect(stringify(engine.updated.getProblems())).to.eql(stringify([
                        [["remove", ".vessel,#group1$vessel0↓.box:last-child$box1"]], [["remove", ".vessel,#group1$vessel0↓.box:last-child$box1"]], [
                          [
                            {
                              "key": ".vessel,#group1$vessel0↓.box:last-child$box2",
                              "scope": "$box2"
                            }, ["==", ["get", "$box2[x]"], 100]
                          ]
                        ]
                      ]));
                      engine.scope.innerHTML = "";
                      return engine.once('solve', function() {
                        expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"], ["remove", ".vessel,#group1$vessel0"], ["remove", ".vessel,#group1$group1↓.box:last-child$box4"], ["remove", ".vessel,#group1$group1"]], [["remove", ".vessel,#group1$group1↓.box:last-child$box4"]], [["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]]]));
                        return done();
                      });
                    });
                  });
                });
              });
            });
          });
        });
        return engine.solve(rules);
      });
    });
  });
  return describe('@if @else', function() {
    return describe('basic', function() {
      return it('step 1', function(done) {
        var counter, listener, rules;
        rules = [['==', ['get', 'big'], 500], ['==', ['get', 'med'], 50], ['==', ['get', 'small'], 5], ['==', ['get', 'target-width'], 900], ['rule', ['.', [' ', ['.', 'vessel']], 'box'], ['if', ['>=', ['get', ['^'], 'target-width'], 960], ['==', ["get", ["&"], "width"], ["get", ['^'], "big"]], [['if', ['>=', ['get', ['^'], 'target-width'], 500], ['==', ["get", ["&"], 'width'], ["get", ['^'], "med"]], ['==', ["get", ["&"], 'width'], ["get", ['^'], "small"]]]]]]];
        counter = 0;
        listener = function(e) {
          var k;
          counter++;
          if (counter === 1) {
            return expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 900
            }));
          } else if (counter === 2) {
            expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 900,
              "$box1[width]": 50,
              "$box2[width]": 50
            }));
            return engine.solved.merge({
              'target-width': 1000
            });
          } else if (counter === 3) {
            window.xxx = true;
            expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 1000,
              "$box1[width]": 500,
              "$box2[width]": 500
            }));
            return engine.solved.merge({
              'target-width': 900
            });
          } else if (counter === 4) {
            expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 900,
              "$box1[width]": 50,
              "$box2[width]": 50
            }));
            return engine.solved.merge({
              'target-width': 300
            });
          } else if (counter === 5) {
            expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 300,
              "$box1[width]": 5,
              "$box2[width]": 5
            }));
            window.xxx = true;
            return engine.id('box1').setAttribute('class', '');
          } else if (counter === 6) {
            expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 300,
              "$box2[width]": 5
            }));
            return engine.id('box2').setAttribute('class', '');
          } else if (counter === 7) {
            expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 300
            }));
            engine.solved.merge({
              'target-width': 1000
            });
            return engine.id('box2').setAttribute('class', 'box');
          } else if (counter === 8) {
            return expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 1000
            }));
          } else if (counter === 9) {
            expect(stringify(engine.values)).to.eql(stringify({
              "$box2[width]": 500,
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 1000
            }));
            return container.innerHTML = '';
          } else if (counter === 10) {
            expect(stringify(engine.values)).to.eql(stringify({
              "big": 500,
              "med": 50,
              "small": 5,
              "target-width": 1000
            }));
            expect(Object.keys(engine.values).length).to.eql(4);
            expect(Object.keys(engine.solved.watchers).length).to.eql(0);
            expect(Object.keys(engine.solved.watched).length).to.eql(0);
            expect((k = Object.keys(engine.observers)).length).to.eql(1);
            expect(Object.keys(engine.observers[k[0]]).length).to.eql(9);
            container.removeEventListener('solve', listener);
            return done();
          }
        };
        container.addEventListener('solve', listener);
        engine.solve(rules);
        return container.innerHTML = "<div id=\"container\" >\n  <div class=\"vessel\">\n    <div id=\"box1\" class=\"box\"></div>\n    <div id=\"box2\" class=\"box\"></div>\n  </div>\n</div>\n<div id=\"box3\" class=\"box\"></div>\n<div id=\"box4\" class=\"box\"></div>";
      });
    });
  });
});



},{}],4:[function(require,module,exports){
var Engine, assert, expect, remove, stringify;

Engine = GSS.Engine;

remove = function(el) {
  return el.parentNode.removeChild(el);
};

stringify = JSON.stringify;

stringify = function(o) {
  return o;
};

expect = chai.expect;

assert = chai.assert;

describe('GSS commands', function() {
  var engine, scope;
  scope = null;
  engine = null;
  beforeEach(function() {
    var fixtures;
    fixtures = document.getElementById('fixtures');
    scope = document.createElement('div');
    fixtures.appendChild(scope);
    return engine = new GSS(scope);
  });
  afterEach(function(done) {
    remove(scope);
    engine.destroy();
    return done();
  });
  describe('when initialized', function() {
    return it('should be bound to the DOM scope', function() {
      return chai.expect(engine.scope).to.eql(scope);
    });
  });
  describe('command transformations -', function() {
    it('stay with class & static ids', function() {
      scope.innerHTML = "<div class=\"box\" id=\"12322\">One</div>\n<div class=\"box\" id=\"34222\">One</div>";
      engine.solve([['stay', ['get', ['.', 'box'], 'x']]]);
      return chai.expect(engine.updated.getProblems()).to.eql([
        [
          [
            {
              key: '.box$12322'
            }, ['stay', ['get', '$12322[x]']]
          ]
        ], [
          [
            {
              key: '.box$34222'
            }, ['stay', ['get', '$34222[x]']]
          ]
        ]
      ]);
    });
    it('multiple stays', function() {
      scope.innerHTML = "<div class=\"box block\" id=\"12322\">One</div>\n<div class=\"box block\" id=\"34222\">One</div>";
      engine;
      engine.solve([['stay', ['get', ['.', 'box'], 'x']], ['stay', ['get', ['.', 'box'], 'y']], ['stay', ['get', ['.', 'block'], 'width']]]);
      return chai.expect(engine.updated.getProblems()).to.eql([
        [
          [
            {
              key: '.box$12322'
            }, ['stay', ['get', '$12322[x]']]
          ]
        ], [
          [
            {
              key: '.box$34222'
            }, ['stay', ['get', '$34222[x]']]
          ]
        ], [
          [
            {
              key: '.box$12322'
            }, ['stay', ['get', '$12322[y]']]
          ]
        ], [
          [
            {
              key: '.box$34222'
            }, ['stay', ['get', '$34222[y]']]
          ]
        ], [
          [
            {
              key: '.block$12322'
            }, ['stay', ['get', '$12322[width]']]
          ]
        ], [
          [
            {
              key: '.block$34222'
            }, ['stay', ['get', '$34222[width]']]
          ]
        ]
      ]);
    });
    it('eq with class and tracker', function() {
      scope.innerHTML = "<div class=\"box\" id=\"12322\">One</div>\n<div class=\"box\" id=\"34222\">One</div>";
      engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', 'grid-col']], ['==', 100, ['get', 'grid-col']]], '%');
      return chai.expect(stringify(engine.updated.getProblems())).to.eql(stringify([
        [
          [
            {
              key: '%.box$12322'
            }, ['==', ['get', '$12322[width]'], ['get', 'grid-col']]
          ], [
            {
              key: '%.box$34222'
            }, ['==', ['get', '$34222[width]'], ['get', 'grid-col']]
          ], [
            {
              key: '%'
            }, ['==', 100, ['get', 'grid-col']]
          ]
        ]
      ]));
    });
    it('eq with class', function() {
      scope.innerHTML = "<div class=\"box\" id=\"12322\">One</div>\n<div class=\"box\" id=\"34222\">One</div>";
      engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', 'grid-col']], ['==', 100, ['get', 'grid-col']]]);
      return chai.expect(stringify(engine.updated.getProblems())).to.eql(stringify([
        [
          [
            {
              key: '.box$12322'
            }, ['==', ['get', '$12322[width]'], ['get', 'grid-col']]
          ], [
            {
              key: '.box$34222'
            }, ['==', ['get', '$34222[width]'], ['get', 'grid-col']]
          ], [
            {
              key: ''
            }, ['==', 100, ['get', 'grid-col']]
          ]
        ]
      ]));
    });
    it('lte for class & id selectors', function(done) {
      window.$engine = engine;
      engine.solve([['<=', ['get', ['.', 'box'], 'width'], ['get', ['#', 'box1'], 'width']]], function(solution) {
        var box2;
        expect(engine.updated.getProblems()).to.eql([
          [
            [
              {
                key: '.box$box1→#box1$box1'
              }, ['<=', ['get', '$box1[width]'], ['get', '$box1[width]']]
            ], [
              {
                key: '.box$34222→#box1$box1'
              }, ['<=', ['get', '$34222[width]'], ['get', '$box1[width]']]
            ], [
              {
                key: '.box$35346→#box1$box1'
              }, ['<=', ['get', '$35346[width]'], ['get', '$box1[width]']]
            ]
          ]
        ]);
        box2 = engine.id("34222");
        box2.parentNode.removeChild(box2);
        return engine.then(function(solution) {
          expect(engine.updated.getProblems()).to.eql([[['remove', '.box$34222'], ['remove', '.box$34222→#box1$box1']], [['remove', '.box$34222→#box1$box1']]]);
          scope.appendChild(box2);
          return engine.then(function(solution) {
            var box1;
            expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: '.box$34222→#box1$box1'
                  }, ['<=', ['get', '$34222[width]'], ['get', '$box1[width]']]
                ]
              ]
            ]);
            box1 = engine.id("box1");
            box1.parentNode.removeChild(box1);
            return engine.then(function(solution) {
              expect(engine.updated.getProblems()).to.eql([[['remove', '#box1'], ['remove', '.box$box1'], ['remove', '.box$box1→#box1$box1'], ['remove', '.box$35346→#box1$box1'], ['remove', '.box$34222→#box1$box1']], [['remove', '.box$box1→#box1$box1', '.box$35346→#box1$box1', '.box$34222→#box1$box1']]]);
              scope.appendChild(box1);
              return engine.then(function(solution) {
                expect(engine.updated.getProblems()).to.eql([
                  [
                    [
                      {
                        key: '.box$35346→#box1$box1'
                      }, ['<=', ['get', '$35346[width]'], ['get', '$box1[width]']]
                    ], [
                      {
                        key: '.box$34222→#box1$box1'
                      }, ['<=', ['get', '$34222[width]'], ['get', '$box1[width]']]
                    ], [
                      {
                        key: '.box$box1→#box1$box1'
                      }, ['<=', ['get', '$box1[width]'], ['get', '$box1[width]']]
                    ]
                  ]
                ]);
                return done();
              });
            });
          });
        });
      });
      return scope.innerHTML = "<div class=\"box\" id=\"box1\">One</div>\n<div class=\"box\" id=\"34222\">One</div>\n<div class=\"box\" id=\"35346\">One</div>";
    });
    it('intrinsic-width with class', function(done) {
      engine.once('solve', function(solution) {});
      engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', ['.', 'box'], 'intrinsic-width']]], function(solution) {
        var box0;
        chai.expect(stringify(engine.updated.getProblems())).to.eql(stringify([
          [['get', '$12322[intrinsic-width]'], ['get', '$34222[intrinsic-width]'], ['get', '$35346[intrinsic-width]']], [
            [
              {
                key: '.box$12322',
                values: {
                  '$12322[intrinsic-width]': 111
                }
              }, ['==', ['get', '$12322[width]'], ['get', '$12322[intrinsic-width]']]
            ]
          ], [
            [
              {
                key: '.box$34222',
                values: {
                  '$34222[intrinsic-width]': 222
                }
              }, ['==', ['get', '$34222[width]'], ['get', '$34222[intrinsic-width]']]
            ]
          ], [
            [
              {
                key: '.box$35346',
                values: {
                  '$35346[intrinsic-width]': 333
                }
              }, ['==', ['get', '$35346[width]'], ['get', '$35346[intrinsic-width]']]
            ]
          ]
        ]));
        expect(solution).to.eql({
          "$12322[intrinsic-width]": 111,
          "$12322[width]": 111,
          "$12322[width]": 111,
          "$34222[intrinsic-width]": 222,
          "$34222[width]": 222,
          "$34222[width]": 222,
          "$35346[intrinsic-width]": 333,
          "$35346[width]": 333,
          "$35346[width]": 333
        });
        box0 = scope.getElementsByClassName('box')[0];
        box0.parentNode.removeChild(box0);
        return engine.once('solve', function() {
          chai.expect(stringify(engine.updated.getProblems())).to.eql(stringify([[["remove", ".box$12322"]], [["remove", ".box$12322"]]]));
          return done();
        });
      });
      return scope.innerHTML = "<div style=\"width:111px;\" class=\"box\" id=\"12322\">One</div>\n<div style=\"width:222px;\" class=\"box\" id=\"34222\">One</div>\n<div style=\"width:333px;\" class=\"box\" id=\"35346\">One</div>";
    });
    it('.box[width] == ::window[width]', function(done) {
      engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', ['::window'], 'width']]]);
      engine.then(function() {
        chai.expect(stringify(engine.updated.getProblems())).to.eql(stringify([
          [['get', '::window[width]']], [
            [
              {
                key: '.box$12322',
                values: {
                  '::window[width]': document.documentElement.clientWidth
                }
              }, ['==', ['get', '$12322[width]'], ['get', '::window[width]']]
            ]
          ]
        ]));
        return done();
      });
      return scope.innerHTML = "<div style=\"width:111px;\" class=\"box\" id=\"12322\">One</div>";
    });
    return it('::window props', function() {
      scope.innerHTML = "";
      engine.solve([['==', ['get', 'xxx'], ['get', ['::window'], 'x']], ['<=', ['get', 'yyy'], ['get', ['::window'], 'y']], ['<=', ['get', 'yay'], ['get', ['::window'], 'y']], ['>=', ['get', 'hhh'], ['get', ['::window'], 'height']], ['>=', ['get', 'hah'], ['get', ['::window'], 'height']], ['<=', ['get', 'www'], ['get', ['::window'], 'width']]]);
      return chai.expect(stringify(engine.updated.getProblems())).to.eql(stringify([
        [["get", "::window[x]"], ["get", "::window[y]"], ["get", "::window[y]"], ["get", "::window[height]"], ["get", "::window[height]"], ["get", "::window[width]"]], [
          [
            {
              key: '',
              values: {
                '::window[x]': 0
              }
            }, ['==', ['get', 'xxx'], ['get', '::window[x]']]
          ]
        ], [
          [
            {
              key: '',
              values: {
                '::window[y]': 0
              }
            }, ['<=', ['get', 'yyy'], ['get', '::window[y]']]
          ]
        ], [
          [
            {
              key: '',
              values: {
                '::window[y]': 0
              }
            }, ['<=', ['get', 'yay'], ['get', '::window[y]']]
          ]
        ], [
          [
            {
              key: '',
              values: {
                '::window[height]': Math.min(window.innerHeight, document.documentElement.clientHeight)
              }
            }, ['>=', ['get', 'hhh'], ['get', '::window[height]']]
          ]
        ], [
          [
            {
              key: '',
              values: {
                '::window[height]': Math.min(window.innerHeight, document.documentElement.clientHeight)
              }
            }, ['>=', ['get', 'hah'], ['get', '::window[height]']]
          ]
        ], [
          [
            {
              key: '',
              values: {
                '::window[width]': document.documentElement.clientWidth
              }
            }, ['<=', ['get', 'www'], ['get', '::window[width]']]
          ]
        ]
      ]));
    });
  });
  return describe('live command spawning -', function() {
    describe('adds & removes -', function() {
      it('add to class', function(done) {
        var count, listener;
        count = 0;
        listener = function(e) {
          count++;
          if (count === 1) {
            expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: '.box$12322'
                  }, ['==', ['get', '$12322[x]'], 100]
                ]
              ], [
                [
                  {
                    key: '.box$34222'
                  }, ['==', ['get', '$34222[x]'], 100]
                ]
              ]
            ]);
            return scope.insertAdjacentHTML('beforeend', '<div class="box" id="35346">One</div>');
          } else if (count === 2) {
            expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: '.box$35346'
                  }, ['==', ['get', '$35346[x]'], 100]
                ]
              ]
            ]);
            engine.removeEventListener('solve', listener);
            return done();
          }
        };
        engine.addEventListener('solve', listener);
        engine.solve([['==', ['get', ['.', 'box'], 'x'], 100]]);
        return scope.innerHTML = "<div class=\"box\" id=\"12322\">One</div>\n<div class=\"box\" id=\"34222\">One</div>";
      });
      it('removed from dom', function(done) {
        var count, listener;
        count = 0;
        listener = function(e) {
          var res;
          count++;
          if (count === 1) {
            chai.expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: '.box$12322'
                  }, ['==', ['get', '$12322[x]'], 100]
                ]
              ], [
                [
                  {
                    key: '.box$34222'
                  }, ['==', ['get', '$34222[x]'], 100]
                ]
              ]
            ]);
            res = engine.id('34222');
            return res.parentNode.removeChild(res);
          } else if (count === 2) {
            chai.expect(engine.updated.getProblems()).to.eql([[['remove', '.box$34222']], [['remove', '.box$34222']]]);
            engine.removeEventListener('solve', listener);
            return done();
          }
        };
        engine.addEventListener('solve', listener);
        engine.solve([['==', ['get', ['.', 'box'], 'x'], 100]]);
        return scope.innerHTML = "<div class=\"box\" id=\"12322\">One</div>\n<div class=\"box\" id=\"34222\">One</div>";
      });
      return it('removed from selector', function(done) {
        var count, listener;
        count = 0;
        listener = function(e) {
          var el;
          count++;
          if (count === 1) {
            chai.expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: '.box$12322'
                  }, ['==', ['get', '$12322[x]'], 100]
                ]
              ], [
                [
                  {
                    key: '.box$34222'
                  }, ['==', ['get', '$34222[x]'], 100]
                ]
              ]
            ]);
            el = engine.id('34222');
            return el.setAttribute('class', '');
          } else if (count === 2) {
            chai.expect(engine.updated.getProblems()).to.eql([[['remove', '.box$34222']], [['remove', '.box$34222']]]);
            engine.removeEventListener('solve', listener);
            return done();
          }
        };
        engine.addEventListener('solve', listener);
        engine.solve([['==', ['get', ['.', 'box'], 'x'], 100]]);
        return scope.innerHTML = "<div class=\"box\" id=\"12322\">One</div>\n<div class=\"box\" id=\"34222\">One</div>";
      });
    });
    describe('resizing -', function() {
      it('element resized by style change', function(done) {
        var count, el, listener;
        count = 0;
        el = null;
        listener = function(e) {
          count++;
          if (count === 1) {
            el = engine.id('box1');
            return el.setAttribute('style', "width:1110px");
          } else if (count === 2) {
            chai.expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: ".box$box1→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 1110
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 1110
                    }
                  }, ["==", ["get", "$box2[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ]
            ]);
            chai.expect(engine.values['$box2[height]']).to.equal(1110);
            engine.removeEventListener('solve', listener);
            return done();
          }
        };
        engine.addEventListener('solve', listener);
        engine.solve([['==', ['get', ['.', 'box'], 'height'], ['get', ['#', 'box1'], 'intrinsic-width']]]);
        return scope.innerHTML = "<div style=\"width:111px;\" id=\"box1\" class=\"box\" >One</div>\n<div style=\"width:222px;\" id=\"box2\" class=\"box\" >One</div>";
      });
      it('element resized by inserting child', function(done) {
        var count, listener;
        count = 0;
        listener = function(e) {
          count++;
          if (count === 1) {
            return engine.id('box1').innerHTML = "<div style=\"width:111px;\"></div>";
          } else if (count === 2) {
            chai.expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: ".box$box1→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 111
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 111
                    }
                  }, ["==", ["get", "$box2[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ]
            ]);
            engine.removeEventListener('solve', listener);
            return done();
          }
        };
        engine.addEventListener('solve', listener);
        engine.solve([['==', ['get', ['.', 'box'], 'height'], ['get', ['#', 'box1'], 'intrinsic-width']]]);
        return scope.innerHTML = "<div style=\"display:inline-block;\" id=\"box1\" class=\"box\">One</div>\n<div style=\"width:222px;\" id=\"box2\" class=\"box\">One</div>";
      });
      return it('element resized by changing text', function(done) {
        var count, el, listener;
        count = 0;
        el = null;
        listener = function(e) {
          count++;
          if (count === 1) {
            el = engine.id('box1');
            return el.innerHTML = "<div style=\"width:111px;\"></div>";
          } else if (count === 2) {
            chai.expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: ".box$box1→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 111
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 111
                    }
                  }, ["==", ["get", "$box2[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ]
            ]);
            return el.innerHTML = "";
          } else if (count === 3) {
            chai.expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: ".box$box1→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 0
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1$box1",
                    values: {
                      "$box1[intrinsic-width]": 0
                    }
                  }, ["==", ["get", "$box2[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ]
            ]);
            engine.removeEventListener('solve', listener);
            return done();
          }
        };
        engine.addEventListener('solve', listener);
        engine.solve([['==', ['get', ['.', 'box'], 'height'], ['get', ['#', 'box1'], 'intrinsic-width']]]);
        return scope.innerHTML = "<div style=\"display:inline-block\" id=\"box1\" class=\"box\" >One</div>\n<div style=\"width:222px;\" id=\"box2\" class=\"box\" >One</div>";
      });
    });
    describe("text measuring", function() {
      return it('text measuring', function(done) {
        var count, el, listener;
        count = 0;
        el = null;
        listener = function(e) {
          count++;
          if (count === 1) {
            expect(engine.id("p-text").style.height).to.eql("");
            expect(engine.values["$p-text[width]"]).to.eql(100);
            expect(engine.values["$p-text[x-height]"] > 400).to.eql(true);
            expect(engine.values["$p-text[x-height]"] % 16).to.eql(0);
            expect(engine.values["$p-text[x-height]"] % 16).to.eql(0);
            return engine.id("p-text").innerHTML = "Booyaka";
          } else if (count === 2) {
            expect(engine.values["$p-text[width]"]).to.eql(100);
            expect(engine.values["$p-text[x-height]"]).to.eql(16);
            expect(engine.values["$p-text[x-height]"]).to.eql(16);
            engine.removeEventListener('solve', listener);
            return done();
          }
        };
        engine.addEventListener('solve', listener);
        engine.solve([['==', ['get', ['#', 'p-text'], 'width'], 100], ['==', ['get', ['#', 'p-text'], 'x-height'], ['get', ['#', 'p-text'], 'intrinsic-height']]]);
        return scope.innerHTML = "<p id=\"p-text\" style=\"font-size:16px; line-height:16px; font-family:Helvetica;\">Among the sectors most profoundly affected by digitization is the creative sector, which, by the definition of this study, encompasses the industries of book publishing, print publishing, film and television, music, and gaming. The objective of this report is to provide a comprehensive view of the impact digitization has had on the creative sector as a whole, with analyses of its effect on consumers, creators, distributors, and publishers</p>";
      });
    });
    return describe("Chain", function() {
      it('@chain .box width(+[hgap]*2)', function(done) {
        var el;
        el = null;
        window.$engine = engine;
        engine.solve([['==', ['get', 'hgap'], 20], ['==', ['get', ['#', 'thing1'], 'width'], 100], ['rule', ['.', 'thing'], ['==', ['get', ['&'], 'width'], ['+', ['get', [':previous'], 'width'], ['*', ['get', ['^'], 'hgap'], 2]]]]]);
        engine.once('solve', function() {
          chai.expect(engine.values["$thing1[width]"]).to.eql(100);
          chai.expect(engine.values["$thing2[width]"]).to.eql(140);
          chai.expect(engine.values["$thing3[width]"]).to.eql(180);
          return done();
        });
        return scope.innerHTML = "<div id=\"thing1\" class=\"thing\"></div>\n<div id=\"thing2\" class=\"thing\"></div>\n<div id=\"thing3\" class=\"thing\"></div>";
      });
      return it('@chain .thing right()left', function(done) {
        var el;
        engine.once('solve', function() {
          chai.expect(engine.values["$thing1[width]"]).to.eql(100);
          return done();
        });
        engine.solve([['==', ['get', ['#', 'thing1'], 'x'], 10], ['==', ['get', ['#', 'thing2'], 'x'], 110], ['rule', ['.', 'thing'], ['==', ['get', [':previous', ['&']], 'right'], ['get', ['&'], 'x']]]]);
        scope.innerHTML = "<div id=\"thing1\" class=\"thing\"></div>\n<div id=\"thing2\" class=\"thing\"></div>";
        return el = null;
      });
    });
  });
});



},{}],5:[function(require,module,exports){
var Engine, assert, expect, fixtures, remove;

Engine = GSS;

assert = chai.assert;

expect = chai.expect;

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

fixtures = document.getElementById('fixtures');

xdescribe('Conditions', function() {
  describe('conditions that use', function() {
    describe('single selector', function() {
      return it('should initialize condition once', function() {
        var container, engine, solution;
        container = document.createElement('div');
        container.innerHTML = "<div id=\"div1\"></div>\n<div id=\"div2\"></div>";
        window.engine = engine = new GSS(container, {
          A: 100
        });
        solution = engine.solve([['==', ['get', ['tag', 'div'], 'x'], ['get', 'A']], ['if', ['>', ['get', ['tag', 'div'], 'x'], 50], ['==', ['get', 'b'], 1]], ['unless', ['>', ['get', ['#', 'div1'], 'x'], 50], ['==', ['get', 'c'], 2], ['==', ['get', 'c'], 3]], ['if', ['>', ['get', ['#', 'div1'], 'x'], 50], ['==', ['get', 'd'], 2], ['==', ['get', 'd'], 3]]]);
        expect(solution).to.eql({
          b: 1,
          c: 3,
          d: 2,
          '$div1[x]': 100,
          '$div2[x]': 100
        });
        solution = engine.solve({
          A: 50
        });
        expect(solution).to.eql({
          A: 50,
          b: null,
          c: 2,
          d: 3,
          '$div1[x]': 50,
          '$div2[x]': 50
        });
        solution = engine.solve({
          A: 100
        });
        expect(solution).to.eql({
          A: 100,
          b: 1,
          c: 3,
          d: 2,
          '$div1[x]': 100,
          '$div2[x]': 100
        });
        solution = engine.solve({
          A: null
        });
        return expect(solution).to.eql({
          A: null,
          b: null,
          c: null
        });
      });
    });
    return describe('multiple selectors', function() {});
  });
  describe('multiple conditions that observe the same condition', function() {
    return it('should reuse observers', function() {
      var engine, solution;
      window.engine = engine = new GSS({
        A: 100
      });
      solution = engine.solve([['if', ['>', ['get', 'A'], 50], ['==', ['get', 'b'], 1]], ['if', ['>', ['get', 'A'], 50], ['==', ['get', 'c'], 3], ['==', ['get', 'c'], 2]]]);
      expect(solution).to.eql({
        b: 1,
        c: 3
      });
      solution = engine.solve({
        A: 50
      });
      expect(solution).to.eql({
        A: 50,
        b: null,
        c: 2
      });
      solution = engine.solve({
        A: 100
      });
      expect(solution).to.eql({
        A: 100,
        b: 1,
        c: 3
      });
      solution = engine.solve({
        A: null
      });
      return expect(solution).to.eql({
        A: null,
        b: null,
        c: null
      });
    });
  });
  return describe('Else', function() {
    return it('should attach to a condition', function() {
      var engine, solution;
      window.engine = engine = new GSS({
        A: 100
      });
      solution = engine.solve([['if', ['>', ['get', 'A'], 75], ['==', ['get', 'b'], 1]], ['elseif', ['>', ['get', 'A'], 50], ['==', ['get', 'c'], 2]], ['else', ['==', ['get', 'd'], 3]]]);
      return expect(solution).to.eql({
        b: 1
      });
    });
  });
});



},{}],6:[function(require,module,exports){
var assert, expect;

assert = chai.assert;

expect = chai.expect;

describe('Domain', function() {
  var engine;
  engine = null;
  afterEach(function() {
    if (engine) {
      return engine.destroy();
    }
  });
  describe('single solving domain', function() {
    it('should find solutions', function() {
      engine = new GSS.Engine();
      return expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], 1]]])).to.eql({
        result: 0,
        a: -1
      });
    });
    return it('should find solutions when using nested simple expressions', function() {
      engine = new GSS.Engine();
      return expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], ['+', ['*', 1, 2], 3]]]])).to.eql({
        result: 0,
        a: -5
      });
    });
  });
  describe('solving and assumed domains together', function() {
    it('should calculate simplified expression', function() {
      window.$engine = engine = new GSS({
        a: 666
      });
      return expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], 1]]])).to.eql({
        result: 667
      });
    });
    it('should calculate simplified variable', function() {
      engine = new GSS({
        a: 666
      });
      expect(engine.solve([['==', ['get', 'result'], ['get', 'a']]])).to.eql({
        result: 666
      });
      return expect(engine.solve({
        a: null
      })).to.eql({
        a: 0,
        result: 0
      });
    });
    it('should simplify partially', function() {
      window.$engine = engine = new GSS({
        a: 555
      });
      expect(engine.solve([['==', ['get', 'b'], 10], ['==', ['get', 'result'], ['+', ['*', 2, ['get', 'a']], ['get', 'b']]]])).to.eql({
        result: 555 * 2 + 10,
        b: 10
      });
      return expect(engine.solve({
        a: -555
      })).to.eql({
        result: -1100,
        a: -555
      });
    });
    it('should simplify multiple variables partially', function() {
      engine = new GSS({
        a: 555,
        A: 2
      });
      expect(engine.solve([['==', ['get', 'b'], 10], ['==', ['get', 'result'], ['+', ['*', ['get', 'A'], ['get', 'a']], ['get', 'b']]]])).to.eql({
        result: 555 * 2 + 10,
        b: 10
      });
      GSS.console.info('a=-555, was 555');
      expect(engine.solve({
        a: -555
      })).to.eql({
        result: -1100,
        a: -555
      });
      GSS.console.info('A=1, was 2');
      return expect(engine.solve({
        A: 1
      })).to.eql({
        A: 1,
        result: -545
      });
    });
    it('should change variable domain after the fact', function() {
      engine = new GSS;
      expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], 1]]])).to.eql({
        result: 0,
        a: -1
      });
      GSS.console.error('A=666');
      expect(engine.solve({
        a: 666
      })).to.eql({
        a: 666,
        result: 667
      });
      GSS.console.error('A=null');
      return expect(engine.solve({
        a: null
      })).to.eql({
        result: 0,
        a: -1
      });
    });
    return it('should use intrinsic values as known values', function() {
      var el;
      el = document.createElement('div');
      el.innerHTML = "<div id=\"box0\" style=\"width: 50px\"></div>\n<div id=\"box1\" style=\"width: 50px\"></div>";
      document.body.appendChild(el);
      engine = new GSS(el);
      return engine.solve([['==', ['get', 'a'], ['+', ['get', ['#', 'box0'], 'z'], ['get', ['#', 'box1'], 'intrinsic-width']]]], function(solution) {
        expect(solution).to.eql({
          "a": 0,
          "$box0[z]": -50,
          "$box1[intrinsic-width]": 50
        });
        return document.body.removeChild(el);
      });
    });
  });
  describe('solvers in worker', function() {
    it('should receieve measurements from document to make substitutions', function(done) {
      debugger;
      var problem, root;
      root = document.createElement('div');
      root.innerHTML = "<div id=\"box0\" style=\"width: 20px\"></div>";
      document.body.appendChild(root);
      engine = new GSS(root, true);
      problem = [['==', ['get', 'result'], ['-', ['+', ['get', ['#', 'box0'], 'intrinsic-width'], 1], ['get', 'x']]]];
      return engine.solve(problem, 'my_funny_tracker_path', function(solution) {
        expect(solution).to.eql({
          "$box0[intrinsic-width]": 20,
          result: 0,
          x: 21
        });
        return engine.solve({
          x: 2
        }, function(solution) {
          expect(solution).to.eql({
            result: 19,
            x: 2
          });
          return engine.solve({
            "x": 3
          }, function(solution) {
            expect(solution).to.eql({
              result: 18,
              x: 3
            });
            return engine.solve({
              "x": null
            }, function(solution) {
              GSS.console.info(solution);
              expect(solution).to.eql({
                result: 0,
                x: 21
              });
              root.removeChild(engine.id('box0'));
              return engine.then(function(solution) {
                GSS.console.info(solution);
                expect(solution).to.eql({
                  "$box0[intrinsic-width]": null,
                  "x": null,
                  "result": null
                });
                return done();
              });
            });
          });
        });
      });
    });
    return it('should receive commands from document', function(done) {
      var problem;
      engine = new GSS(true);
      problem = [['==', ['get', 'result'], ['+', ['get', 'a'], 1]], ['==', ['get', 'b'], ['+', 1000, 1]]];
      return engine.solve(problem, function(solution) {
        expect(solution).to.eql({
          a: -1,
          result: 0,
          b: 1001
        });
        return done();
      });
    });
  });
  xdescribe('framed domains', function(done) {
    it('should not merge expressions of a framed domain in worker', function() {
      var problem;
      window.$engine = engine = new GSS(true);
      problem = [['framed', ['>=', ['get', 'a'], 1]], ['==', ['get', 'b'], 2], ['==', ['get', 'b'], ['get', 'a'], 'strong']];
      return engine.solve(problem, function(solution) {
        expect(solution).to.eql({
          a: 1,
          b: 1
        });
        return engine.solve(['>=', ['get', 'a', '', 'something'], 3], function(solution) {
          expect(solution).to.eql({
            a: 3,
            b: 3
          });
          return engine.solve(['>=', ['get', 'b'], 4], function(solution) {
            expect(solution).to.eql({});
            return engine.solve(['>=', ['get', 'c'], ['*', 2, ['get', 'b']]], function(solution) {
              expect(solution).to.eql({
                c: 6
              });
              return engine.solve(['remove', 'something'], function(solution) {
                expect(solution).to.eql({
                  a: 1,
                  b: 1,
                  c: 2
                });
                return done();
              });
            });
          });
        });
      });
    });
    it('should not merge expressions of a framed domain', function() {
      var problem;
      window.$engine = engine = new GSS;
      problem = [['framed', ['>=', ['get', 'a'], 1]], ['==', ['get', 'b'], 2], ['==', ['get', 'b'], ['get', 'a'], 'strong']];
      expect(engine.solve(problem)).to.eql({
        a: 1,
        b: 1
      });
      expect(engine.domains[2].constraints.length).to.eql(1);
      expect(engine.domains[3].constraints.length).to.eql(2);
      expect(engine.solve(['>=', ['get', 'a', '', 'something'], 3])).to.eql({
        a: 3,
        b: 3
      });
      expect(engine.domains[2].constraints.length).to.eql(2);
      expect(engine.domains[3].constraints.length).to.eql(2);
      expect(engine.solve(['>=', ['get', 'b'], 4])).to.eql({});
      expect(engine.domains[2].constraints.length).to.eql(2);
      expect(engine.domains[3].constraints.length).to.eql(3);
      expect(engine.solve(['>=', ['get', 'c'], ['*', 2, ['get', 'b']]])).to.eql({
        c: 6
      });
      expect(engine.domains[2].constraints.length).to.eql(2);
      expect(engine.domains[3].constraints.length).to.eql(4);
      expect(engine.solve(['remove', 'something'])).to.eql({
        a: 1,
        b: 1,
        c: 2
      });
      expect(engine.domains[2].constraints.length).to.eql(1);
      return expect(engine.domains[3].constraints.length).to.eql(4);
    });
    return it('should be able to export multiple framed variables into one domain', function() {
      var A, B, C, problem;
      window.$engine = engine = new GSS;
      problem = [['framed', ['>=', ['get', 'a'], 1]], ['framed', ['>=', ['get', 'b'], 2]], ['==', ['get', 'c'], ['+', ['get', 'a'], ['get', 'b']]]];
      expect(engine.solve(problem)).to.eql({
        a: 1,
        b: 2,
        c: 3
      });
      A = engine.domains[2];
      B = engine.domains[3];
      C = engine.domains[4];
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(1);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['==', ['get', 'a', '', 'aa'], -1])).to.eql({
        a: -1,
        c: 1
      });
      expect(A.constraints.length).to.eql(2);
      expect(B.constraints.length).to.eql(1);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['==', ['get', 'b', '', 'bb'], -2])).to.eql({
        b: -2,
        c: -3
      });
      expect(A.constraints.length).to.eql(2);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['==', ['get', 'c', '', 'cc'], 10])).to.eql({
        c: 10
      });
      expect(A.constraints.length).to.eql(2);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(2);
      expect(engine.solve(['remove', 'aa'])).to.eql({
        a: 1
      });
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(2);
      expect(engine.solve(['remove', 'cc'])).to.eql({
        c: -1
      });
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['remove', 'bb'])).to.eql({
        c: 3,
        b: 2
      });
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(1);
      return expect(C.constraints.length).to.eql(1);
    });
  });
  return describe('variable graphs', function() {
    it('should unmerge multiple domains', function() {
      var problem;
      engine = new GSS;
      problem = [['==', ['get', 'a'], 1], ['==', ['get', 'b'], ['get', 'c']]];
      expect(engine.solve(problem)).to.eql({
        a: 1,
        b: 0,
        c: 0
      });
      expect(engine.solve([['==', ['get', 'c'], ['*', 2, ['get', 'a']]]], 'my_tracker_path')).to.eql({
        b: 2,
        c: 2
      });
      GSS.console.log(1);
      return expect(engine.solve([['remove', 'my_tracker_path']])).to.eql({
        b: 0,
        c: 0
      });
    });
    return it('should merge multiple domains', function() {
      var problem;
      engine = new GSS;
      problem = [['==', ['get', 'result'], ['+', ['get', 'a'], 1]], ['<=', ['get', 'b'], 4], ['>=', ['get', 'b'], 2]];
      expect(engine.solve(problem)).to.eql({
        result: 0,
        a: -1,
        b: 4
      });
      expect(engine.solve([['>=', ['get', 'a'], 5]])).to.eql({
        result: 6,
        a: 5
      });
      expect(engine.solve([['>=', ['get', 'c'], ['+', ['get', 'b'], 6]]])).to.eql({
        c: 10
      });
      expect(engine.solve([['==', ['get', 'b'], 3]])).to.eql({
        c: 9,
        b: 3
      });
      return expect(engine.solve([['<=', ['get', 'c'], ['get', 'result']]])).to.eql({
        a: 8,
        result: 9
      });
    });
  });
});



},{}],7:[function(require,module,exports){
var assert, expect, remove, stringify;

assert = chai.assert;

expect = chai.expect;

stringify = function(o) {
  return o;
  return JSON.stringify(o, 1, 1);
};

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

describe('End - to - End', function() {
  var container, engine;
  engine = null;
  container = null;
  beforeEach(function() {
    container = document.createElement('div');
    document.getElementById('fixtures').appendChild(container);
    return window.$engine = engine = new GSS(container);
  });
  afterEach(function() {
    return remove(container);
  });
  xdescribe('config', function() {
    describe('defaultStrength: strong', function() {
      return it('should compute', function(done) {
        var listen, oldDefault;
        oldDefault = GSS.config.defaultStrength;
        GSS.config.defaultStrength = "strong";
        listen = function(e) {
          expect(engine.vars).to.eql({
            "m": 2
          });
          GSS.config.defaultStrength = oldDefault;
          return done();
        };
        engine.once('solve', listen);
        return container.innerHTML = "<style type=\"text/gss\">\n[m] == 1;\n[m] == 2;\n[m] == 3;\n</style>";
      });
    });
    return describe('fractionalPixels: false', function() {
      return it('should compute', function(done) {
        var listen, old;
        old = GSS.config.fractionalPixels;
        GSS.config.fractionalPixels = false;
        listen = function(e) {
          var el;
          el = document.getElementById("nofractional");
          expect(el.style.height).to.equal("10px");
          GSS.config.fractionalPixels = true;
          return done();
        };
        engine.once('solve', listen);
        return container.innerHTML = "<div id=\"nofractional\"></div>\n<style type=\"text/gss\">\n  #nofractional[x] == 99.999999999999;\n  #nofractional[height] == 9.999999999999;\n</style>";
      });
    });
  });
  describe('Vanilla CSS', function() {
    var getSource;
    getSource = function(style) {
      return Array.prototype.slice.call(style.sheet.rules).map(function(rule) {
        return rule.cssText.replace(/^\s+|\s+$|\n|\t|\s*({|}|:|;)\s*|(\s+)/g, '$1$2');
      }).join('\n');
    };
    describe('just CSS', function() {
      engine = null;
      return it('should dump and clean', function(done) {
        container.innerHTML = "<style type=\"text/gss\" scoped>\n  #css-only-dump {\n    height: 100px;\n  }\n</style>\n<div id=\"css-only-dump\"></div>";
        return engine.once('solve', function(e) {
          var dumper;
          expect(getSource(engine.tag('style')[1])).to.equal("#css-only-dump{height:100px;}");
          dumper = engine.id('css-only-dump');
          dumper.parentNode.removeChild(dumper);
          return engine.once('solve', function(e) {
            expect(getSource(engine.tag('style')[1])).to.equal("");
            return done();
          });
        });
      });
    });
    describe('CSS + CCSS', function() {
      engine = null;
      return it('should dump', function(done) {
        container.innerHTML = "<div class=\"css-simple-dump\"></div>\n<style type=\"text/gss\" scoped>\n  .css-simple-dump {\n    width: == 100;\n    height: 100px;\n  }\n</style>";
        return engine.once('solve', function(e) {
          var clone, dump;
          expect(getSource(engine.tag('style')[1])).to.equal(".css-simple-dump{height:100px;}");
          dump = engine["class"]('css-simple-dump')[0];
          clone = dump.cloneNode();
          dump.parentNode.appendChild(clone);
          return engine.once('solve', function(e) {
            expect(getSource(engine.tag('style')[1])).to.equal(".css-simple-dump{height:100px;}");
            dump.parentNode.removeChild(dump);
            return engine.once('solve', function(e) {
              expect(getSource(engine.tag('style')[1])).to.equal(".css-simple-dump{height:100px;}");
              clone.parentNode.removeChild(clone);
              return engine.once('solve', function(e) {
                expect(getSource(engine.tag('style')[1])).to.equal("");
                return done();
              });
            });
          });
        });
      });
    });
    describe('nested', function() {
      engine = null;
      return it('should dump', function(done) {
        container.innerHTML = "<div class=\"outer\">\n  <div class=\"innie-outie\">\n    <div id=\"css-inner-dump-1\"></div>\n  </div>\n</div>\n<div class=\"outie\">\n  <div class=\"innie-outie\">\n    <div id=\"css-inner-dump-2\"></div>\n  </div>\n</div>\n<style type=\"text/gss\" scoped>\n  .outer, .outie {\n    #css-inner-dump-1 {\n      width: == 100;\n      height: 100px;\n      z-index: 5;\n    }\n    .innie-outie {\n      #css-inner-dump-2 {\n        height: 200px;\n      }\n    }\n  }\n</style>";
        return engine.once('solve', function() {
          var el;
          expect(getSource(engine.tag('style')[1])).to.equal(".outer #css-inner-dump-1, .outie #css-inner-dump-1{height:100px;z-index:5;}\n.outer .innie-outie #css-inner-dump-2, .outie .innie-outie #css-inner-dump-2{height:200px;}");
          el = engine["class"]("innie-outie")[1];
          el.setAttribute('class', 'innie-outie-zzz');
          return engine.once('solve', function() {
            expect(getSource(engine.tag('style')[1])).to.equal(".outer #css-inner-dump-1, .outie #css-inner-dump-1{height:100px;z-index:5;}");
            el.setAttribute('class', 'innie-outie');
            return engine.once('solve', function() {
              expect(getSource(engine.tag('style')[1])).to.equal(".outer #css-inner-dump-1, .outie #css-inner-dump-1{height:100px;z-index:5;}\n.outer .innie-outie #css-inner-dump-2, .outie .innie-outie #css-inner-dump-2{height:200px;}");
              return done();
            });
          });
        });
      });
    });
    describe('custom selectors', function() {
      return it('should dump', function(done) {
        container.innerHTML = "<div class=\"outer\">\n  <div class=\"innie-outie\">\n    <div id=\"css-inner-dump-1\"></div>\n  </div>\n</div>\n<div class=\"outie\">\n  <div class=\"innie-outie\">\n    <div id=\"css-inner-dump-2\"></div>\n  </div>\n</div>\n<style type=\"text/gss\" scoped>\n    .innie-outie {\n      !> * {\n        height: 200px;\n\n        #css-inner-dump-2 {\n          z-index: -1;\n        }\n      }\n    }\n</style>";
        return engine.once('solve', function() {
          var A, B;
          expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".innie-outie↓!>*\"]{height:200px;}\n[matches~=\".innie-outie↓!>*\"] #css-inner-dump-2{z-index:-1;}");
          A = engine["class"]("innie-outie")[0];
          B = engine["class"]("innie-outie")[1];
          B.setAttribute('class', 'innie-outie-zzz');
          return engine.once('solve', function() {
            expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".innie-outie↓!>*\"]{height:200px;}");
            B.setAttribute('class', 'innie-outie');
            return engine.once('solve', function() {
              expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".innie-outie↓!>*\"]{height:200px;}\n[matches~=\".innie-outie↓!>*\"] #css-inner-dump-2{z-index:-1;}");
              A.setAttribute('class', 'innie-outie-zzz');
              return engine.once('solve', function() {
                expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".innie-outie↓!>*\"]{height:200px;}\n[matches~=\".innie-outie↓!>*\"] #css-inner-dump-2{z-index:-1;}");
                B.setAttribute('class', 'innie-outie-zzz');
                return engine.once('solve', function() {
                  expect(getSource(engine.tag('style')[1])).to.equal("");
                  A.setAttribute('class', 'innie-outie');
                  return engine.once('solve', function() {
                    expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".innie-outie↓!>*\"]{height:200px;}");
                    B.setAttribute('class', 'innie-outie');
                    return engine.once('solve', function() {
                      expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".innie-outie↓!>*\"]{height:200px;}\n[matches~=\".innie-outie↓!>*\"] #css-inner-dump-2{z-index:-1;}");
                      return done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    describe('conditional', function() {
      return it('should dump', function(done) {
        container.innerHTML = "<div class=\"outer\">\n  <div class=\"innie-outie\">\n    <div id=\"css-inner-dump-1\"></div>\n  </div>\n</div>\n<div class=\"outie\">\n  <div class=\"innie-outie\">\n    <div id=\"css-inner-dump-2\"></div>\n  </div>\n</div>\n<style type=\"text/gss\" scoped>\n  .outer, .outie {\n    @if $A > 0 {\n      .innie-outie {\n        #css-inner-dump-2 {\n          width: 100px;\n        }\n      }\n    }\n    \n    #css-inner-dump-1 {\n      z-index: 5;\n\n      @if $B > 0 {\n        height: 200px;\n      }\n    }\n  }\n</style>";
        return engine.once('solve', function() {
          expect(getSource(engine.tag('style')[1])).to.equal(".outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}");
          return engine.solve({
            A: 1
          }, function() {
            expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2\"]{width:100px;}\n.outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}");
            return engine.solve({
              B: 1
            }, function() {
              expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2\"]{width:100px;}\n.outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;height:200px;}");
              return done();
            });
          });
        });
      });
    });
    return xdescribe('imported', function() {
      return it('should dump', function(done) {
        container.innerHTML = "<div class=\"outer\">\n  <button></button>\n  <button></button>\n</div>\n<div class=\"outie\">\n  <button></button>\n  <button></button>\n</div>\n<style type=\"text/gss\" scoped>\n  .outer, .outie {\n    @import fixtures/external-file-css1.gss;\n  }\n</style>";
        return engine.once('solve', function() {
          var el, _i, _len, _ref;
          expect(getSource(engine.tag('style')[1])).to.equal(".outer button, .outie button{z-index:1;}");
          _ref = engine.tag('div');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            el = _ref[_i];
            el.className = '';
          }
          return engine.then(function() {
            expect(getSource(engine.tag('style')[1])).to.equal("");
            engine.tag('div')[0].className = 'outer';
            return engine.then(function() {
              expect(getSource(engine.tag('style')[1])).to.equal(".outer button, .outie button{z-index:1;}");
              return done();
            });
          });
        });
      });
    });
  });
  describe("CCSS", function() {
    describe('expression chain', function() {
      return it('should compute values', function(done) {
        engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "c": 10,
            "x": 0,
            "y": 500,
            "z": 510
          });
          return done();
        });
        return container.innerHTML = "<style type=\"text/gss\" scoped>              \n  [c] == 10 !require;\n  0 <= [x] <= 500;\n  500 == [y] == 500;\n  \n  0 <= [z] == [c] + [y] !strong100;\n</style>";
      });
    });
    describe('expression chain w/ queryBound connector', function() {
      return it('should be ok', function(done) {
        container.innerHTML = "<div id=\"billy\"></div>\n<style type=\"text/gss\" scoped>              \n  [grid] == 36;\n  0 <= #billy[x] == [grid];\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "grid": 36,
            "$billy[x]": 36
          });
          return done();
        });
      });
    });
    describe('non-pixel props', function() {
      return it('should be ok', function(done) {
        container.innerHTML = "<div id=\"non-pixel\"></div>\n<style type=\"text/gss\">              \n  #non-pixel {\n    z-index: == 10;\n    opacity: == .5;\n  }\n</style>";
        return engine.once('solve', function(e) {
          var style;
          style = document.getElementById('non-pixel').style;
          assert((Number(style['z-index']) === 10) || (Number(style['zIndex']) === 10), 'correct z-index');
          assert(Number(style['opacity']) === .5, 'correct opacity');
          return done();
        });
      });
    });
    describe('order of operations', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<style type=\"text/gss\" scoped>              \n  [w] == 100 !require;\n  [igap] == 3 !require;\n  [ogap] == 10 !require;\n  \n  [md] * 4 == [w] - [ogap] * 2 !require;\n  \n  [span3] == [md] * 3 + [igap] * 2;\n  \n  [blah] == [w] - 10 - 10 - 10;\n  \n  [blah2] == [w] - [ogap] - [ogap] - [ogap];\n  \n  [md2] == ([w] - [ogap] - [ogap] - [igap] * 3) / 4 !require;\n\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "w": 100,
            "igap": 3,
            "ogap": 10,
            "md": 20,
            "span3": 66,
            "blah": 70,
            "blah2": 70,
            "md2": 71 / 4
          });
          return done();
        });
      });
    });
    describe('scoped order dependent selectors', function() {
      return it('should deliver', function(done) {
        container = document.createElement('div');
        container.style.left = 0;
        container.style.top = 0;
        container.style.position = 'absolute';
        window.$engine = engine = new GSS(container);
        document.body.appendChild(container);
        container.innerHTML = "<article id=\"article1\">\n  <section id=\"section11\">\n    <p id=\"p111\"></p>\n    <p id=\"p112\"></p>\n  </section>\n  <section id=\"section12\">\n    <p id=\"p121\"></p>\n    <p id=\"p122\"></p>\n  </section>\n</article>\n<article id=\"article2\">\n  <section id=\"section21\">\n    <p id=\"p211\"></p>\n    <p id=\"p212\"></p>\n  </section>\n  <section id=\"section22\">\n    <p id=\"p221\"></p>\n    <p id=\"p222\"></p>\n  </section>\n</article>\n\n<style type=\"text/gss\">\n  p {\n    height: == 50;\n    width: == 50;\n  }\n\n  article {\n    @h |(& section)-...| in(::);\n\n    section {\n      @h |(& p)...| in(::);\n    }\n  }\n</style>";
        return engine.then(function() {
          return done();
        });
      });
    });
    describe('simpliest order dependent selectors', function() {
      it('should work in global scope', function(done) {
        container.innerHTML = "<style type=\"text/gss\">             \n  (.a:first)[left] == 111;              \n  (.a:last)[left] == 222;\n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div> \n<div id=\"a3\" class=\"a\"></div> ";
        return engine.once('solve', function() {
          expect(engine.values).to.eql({
            "$a1[x]": 111,
            "$a3[x]": 222
          });
          container.appendChild(engine.id('a1'));
          return engine.once('solve', function() {
            expect(engine.values).to.eql({
              "$a2[x]": 111,
              "$a1[x]": 222
            });
            container.innerHTML = "";
            return engine.once('solve', function() {
              expect(engine.values).to.eql({});
              return done();
            });
          });
        });
      });
      return it('should work in a css rule', function(done) {
        container.innerHTML = "<style type=\"text/gss\">                            \n  .a {\n    (&:next)[left] == 666;\n    (&:previous)[left] == 111;\n  }       \n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div> ";
        return engine.once('solve', function() {
          expect(engine.values).to.eql({
            "$a1[x]": 111,
            "$a2[x]": 666
          });
          container.appendChild(engine.id('a1'));
          return engine.once('solve', function() {
            expect(engine.values).to.eql({
              "$a1[x]": 666,
              "$a2[x]": 111
            });
            container.innerHTML = "";
            return engine.once('solve', function() {
              expect(engine.values).to.eql({});
              return done();
            });
          });
        });
      });
    });
    describe('simple order dependent selectors', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<style type=\"text/gss\">                            \n  .a {\n    (&:first)[left] == 0;\n    &[width] == 100;\n    (&:previous)[right] == &[left];\n  }       \n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div> ";
        engine;
        return engine.once('solve', function() {
          var a3;
          expect(engine.values).to.eql({
            "$a1[width]": 100,
            "$a2[width]": 100,
            "$a3[width]": 100,
            "$a1[x]": 0,
            "$a2[x]": 100,
            "$a3[x]": 200
          });
          a3 = engine.id('a3');
          a3.parentNode.removeChild(a3);
          return engine.once('solve', function() {
            expect(engine.values).to.eql({
              "$a1[width]": 100,
              "$a2[width]": 100,
              "$a1[x]": 0,
              "$a2[x]": 100
            });
            engine.scope.appendChild(a3);
            return engine.once('solve', function() {
              var a1;
              expect(engine.values).to.eql({
                "$a1[width]": 100,
                "$a2[width]": 100,
                "$a3[width]": 100,
                "$a1[x]": 0,
                "$a2[x]": 100,
                "$a3[x]": 200
              });
              a1 = engine.id('a1');
              a1.parentNode.removeChild(a1);
              return engine.once('solve', function() {
                expect(engine.values).to.eql({
                  "$a2[width]": 100,
                  "$a3[width]": 100,
                  "$a2[x]": 0,
                  "$a3[x]": 100
                });
                engine.scope.appendChild(a1);
                return engine.once('solve', function() {
                  expect(engine.values).to.eql({
                    "$a1[width]": 100,
                    "$a2[width]": 100,
                    "$a3[width]": 100,
                    "$a2[x]": 0,
                    "$a3[x]": 100,
                    "$a1[x]": 200
                  });
                  a3 = engine.id('a3');
                  a3.parentNode.removeChild(a3);
                  return engine.once('solve', function() {
                    var divs;
                    expect(engine.values).to.eql({
                      "$a1[width]": 100,
                      "$a2[width]": 100,
                      "$a2[x]": 0,
                      "$a1[x]": 100
                    });
                    divs = engine.tag('div');
                    while (divs[0]) {
                      divs[0].parentNode.removeChild(divs[0]);
                    }
                    return engine.once('solve', function() {
                      expect(engine.values).to.eql({});
                      return done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    describe('intrinsic properties', function() {
      return it('should bind to scrolling', function(done) {
        engine.once('solve', function(e) {
          expect(stringify(engine.values)).to.eql(stringify({
            "$scroller[scroll-top]": 0,
            "$floater[x]": 0
          }));
          engine.once('solve', function(e) {
            expect(stringify(engine.values)).to.eql(stringify({
              "$scroller[scroll-top]": 20,
              "$floater[x]": 20
            }));
            return done();
          });
          return engine.id('scroller').scrollTop = 20;
        });
        return container.innerHTML = "<style>\n  #scroller {\n    height: 50px;\n    overflow: scroll;\n    font-size: 100px;\n  }\n</style>\n<style type=\"text/gss\"> \n  #floater[x] == #scroller[scroll-top]\n</style>\n<div class=\"a\" id=\"scroller\">content</div>\n<div class=\"b\" id=\"floater\"></div>";
      });
    });
    describe('css binding', function() {
      return describe('simple', function() {
        describe('numerical properties', function() {
          it('should compute value when there is no regular value set', function(done) {
            engine.once('solve', function(e) {
              expect(stringify(engine.values)).to.eql(stringify({
                "$b1[z-index]": 3,
                "$a1[intrinsic-z-index]": 2
              }));
              return done();
            });
            return container.innerHTML = "<style>\n  #a1 {\n    position: relative;\n    z-index: 2;\n  }\n</style>\n<style type=\"text/gss\"> \n  #b1[z-index] == #a1[intrinsic-z-index] + 1;\n</style>\n<div class=\"a\" id=\"a1\"></div>\n<div class=\"b\" id=\"b1\"></div>";
          });
          return it('should use inline value', function(done) {
            engine.once('solve', function(e) {
              expect(stringify(engine.values)).to.eql(stringify({
                "$b1[z-index]": 3,
                "$a1[intrinsic-z-index]": 2
              }));
              return done();
            });
            return container.innerHTML = "<style type=\"text/gss\"> \n  #b1[z-index] == #a1[intrinsic-z-index] + 1;\n</style>\n<div class=\"a\" id=\"a1\" style=\"z-index: 2\"></div>\n<div class=\"b\" id=\"b1\"></div>";
          });
        });
        return describe('length properties', function() {
          it('should compute linear equasions', function(done) {
            engine.once('solve', function(e) {
              expect(stringify(engine.values)).to.eql(stringify({
                "$b1[border-left-width]": -2,
                "$a1[intrinsic-border-top-width]": 2
              }));
              return done();
            });
            return container.innerHTML = "<style>\n  #a1 {\n    border: 2px solid #000;\n  }\n</style>\n<style type=\"text/gss\"> \n  #b1[border-left-width] == -1 * #a1[intrinsic-border-top-width];\n</style>\n<div class=\"a\" id=\"a1\"></div>\n<div class=\"b\" id=\"b1\"></div>";
          });
          xit('should simplify non-linear equasions to linear', function(done) {
            var count, listener;
            count = 0;
            listener = function(e) {
              if (++count === 1) {
                expect(stringify(engine.values)).to.eql(stringify({
                  "multiplier": 2,
                  "$b1[border-left-width]": 4
                }));
                return engine.solve({
                  multiplier: 3
                });
              } else if (count === 2) {
                expect(stringify(engine.values)).to.eql(stringify({
                  "multiplier": 3,
                  "$b1[border-left-width]": 6
                }));
                return engine.id('a1').style.border = '3px solid #000';
              } else if (count === 3) {
                expect(stringify(engine.values)).to.eql(stringify({
                  "multiplier": 3,
                  "$b1[border-left-width]": 9
                }));
                engine.removeEventListener('solve', listener);
                return done();
              }
            };
            engine.addEventListener('solve', listener);
            return container.innerHTML = "<style>\n  #a1 {\n    border: 2px solid #000;\n  }\n</style>\n<style type=\"text/gss\"> \n  [multiplier] == 2;\n  #b1[border-left-width] == [multiplier] * #a1[intrinsic-border-top-width];\n</style>\n<div class=\"a\" id=\"a1\"></div>\n<div class=\"b\" id=\"b1\"></div>";
          });
          return xit('should detect non-linearity deep in expression', function(done) {
            var count, listener;
            count = 0;
            listener = function(e) {
              if (++count === 1) {
                expect(stringify(engine.values)).to.eql(stringify({
                  "$a1[intrinsic-border-top-width]": 2,
                  "multiplier": 2,
                  "$b1[border-left-width]": 6
                }));
                return engine.values.suggest('multiplier', 3);
              } else if (count === 2) {
                expect(stringify(engine.values)).to.eql(stringify({
                  "$a1[intrinsic-border-top-width]": 2,
                  "multiplier": 3,
                  "$b1[border-left-width]": 9
                }));
                return engine.id('a1').style.border = '3px solid #000';
              } else if (count === 3) {
                expect(stringify(engine.values)).to.eql(stringify({
                  "$a1[intrinsic-border-top-width]": 3,
                  "multiplier": 3,
                  "$b1[border-left-width]": 12
                }));
                engine.removeEventListener('solve', listener);
                return done();
              }
            };
            engine.addEventListener('solve', listener);
            return container.innerHTML = "<style>\n  #a1 {\n    border: 2px solid #000;\n  }\n</style>\n<style type=\"text/gss\"> \n  [multiplier] == 2;\n  #b1[border-left-width] == [multiplier] * (1 + #a1[intrinsic-border-top-width]);\n</style>\n<div class=\"a\" id=\"a1\"></div>\n<div class=\"b\" id=\"b1\"></div>";
          });
        });
      });
    });
    describe('temporary bound to intrinsics', function() {
      return it('should bind elements with itself', function(done) {
        container.innerHTML = "<style type=\"text/gss\">\n  .a {\n    ::[width] == ::[intrinsic-width];\n  } \n</style>\n<div id=\"a1\" class=\"a\" style=\" display: inline-block;\"><span style=\"width: 100px; display: inline-block;\">3</span></div>\n<div id=\"a2\" class=\"a\" style=\" display: inline-block;\"><span style=\"width: 100px; display: inline-block;\">3</span></div>\n<div id=\"a3\" class=\"a\" style=\" display: inline-block;\"><span style=\"width: 100px; display: inline-block;\">3</span></div>";
        return engine.once('solve', function(e) {
          var a1;
          expect(engine.values).to.eql({
            "$a1[intrinsic-width]": 100,
            "$a2[intrinsic-width]": 100,
            "$a3[intrinsic-width]": 100,
            "$a1[width]": 100,
            "$a2[width]": 100,
            "$a3[width]": 100
          });
          a1 = engine.id('a1');
          a1.parentNode.removeChild(a1);
          return engine.once('solve', function(e) {
            expect(engine.updated.solution).to.eql({
              "$a1[intrinsic-width]": null,
              "$a1[width]": null
            });
            return done();
          });
        });
      });
    });
    describe('equal simple selector on the both sides', function() {
      return it('should bind elements with itself', function(done) {
        container.innerHTML = "<style type=\"text/gss\" scoped>                            \n  [x] == 100;\n  .a {\n    ::[x] == 10;\n  } \n  .a[y] == .a[x];\n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div>";
        return engine.once('solve', function(e) {
          var b3;
          expect(engine.values).to.eql({
            "x": 100,
            "$a1[x]": 10,
            "$a2[x]": 10,
            "$a3[x]": 10,
            "$a1[y]": 10,
            "$a2[y]": 10,
            "$a3[y]": 10
          });
          b3 = engine.id('b3');
          return done();
        });
      });
    });
    describe('complex plural selectors on the left', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<style type=\"text/gss\" scoped>                            \n  [x] == 100;\n  (.a !+ .a)[x] == .b[x] == [x];          \n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div>            \n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>\n<div id=\"b3\" class=\"b\"></div>";
        return engine.once('solve', function(e) {
          var b3;
          expect(engine.values).to.eql({
            "x": 100,
            "$a1[x]": 100,
            "$a2[x]": 100,
            "$b1[x]": 100,
            "$b2[x]": 100,
            "$b3[x]": 100
          });
          b3 = engine.id('b3');
          b3.parentNode.removeChild(b3);
          return engine.once('solve', function(e) {
            var b2;
            expect(engine.values).to.eql({
              "x": 100,
              "$a1[x]": 100,
              "$a2[x]": 100,
              "$b1[x]": 100,
              "$b2[x]": 100
            });
            b2 = engine.id('b2');
            b2.parentNode.removeChild(b2);
            return engine.once('solve', function(e) {
              expect(engine.values).to.eql({
                "x": 100,
                "$a1[x]": 100,
                "$b1[x]": 100
              });
              engine.scope.appendChild(b2);
              return engine.once('solve', function(e) {
                var a1;
                expect(engine.values).to.eql({
                  "x": 100,
                  "$a1[x]": 100,
                  "$a2[x]": 100,
                  "$b1[x]": 100,
                  "$b2[x]": 100
                });
                a1 = engine.id('a1');
                a1.parentNode.removeChild(a1);
                return engine.once('solve', function(e) {
                  expect(engine.values).to.eql({
                    "x": 100,
                    "$a2[x]": 100,
                    "$b1[x]": 100,
                    "$b2[x]": 100
                  });
                  b2 = engine.id('b2');
                  b2.parentNode.removeChild(b2);
                  return engine.once('solve', function(e) {
                    expect(engine.values).to.eql({
                      "x": 100,
                      "$a2[x]": 100,
                      "$b1[x]": 100
                    });
                    engine.scope.insertBefore(a1, engine.id('b1'));
                    engine.scope.appendChild(b2);
                    return engine.once('solve', function(e) {
                      var divs;
                      return expect(engine.values).to.eql({
                        "x": 100,
                        "$b1[x]": 100,
                        "$b2[x]": 100,
                        "$a2[x]": 100,
                        "$a3[x]": 100
                      }, divs = engine.tag('div'), (function() {
                        var _results;
                        _results = [];
                        while (divs[0]) {
                          _results.push(divs[0].parentNode.removeChild(divs[0]));
                        }
                        return _results;
                      })(), window.zz = true, engine.once('solve', function(e) {
                        expect(engine.values).to.eql({
                          "x": 100
                        });
                        engine.scope.innerHTML = "";
                        return engine.once('solve', function(e) {
                          expect(engine.values).to.eql({});
                          return done();
                        });
                      }));
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    describe('order dependent complex selectors', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<style type=\"text/gss\" id=\"style\">                            \n  #style !> > .a {\n    (&:first)[left] == 0;\n    &[width] == 100;\n    (&:previous)[right] == &[left];\n  }       \n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div> ";
        engine;
        return engine.once('solve', function() {
          var a3;
          expect(engine.values).to.eql({
            "$a1[width]": 100,
            "$a2[width]": 100,
            "$a3[width]": 100,
            "$a1[x]": 0,
            "$a2[x]": 100,
            "$a3[x]": 200
          });
          a3 = engine.id('a3');
          a3.parentNode.removeChild(a3);
          return engine.once('solve', function() {
            expect(engine.values).to.eql({
              "$a1[width]": 100,
              "$a2[width]": 100,
              "$a1[x]": 0,
              "$a2[x]": 100
            });
            engine.scope.appendChild(a3);
            return engine.once('solve', function() {
              var a1;
              expect(engine.values).to.eql({
                "$a1[width]": 100,
                "$a2[width]": 100,
                "$a3[width]": 100,
                "$a1[x]": 0,
                "$a2[x]": 100,
                "$a3[x]": 200
              });
              a1 = engine.id('a1');
              a1.parentNode.removeChild(a1);
              return engine.once('solve', function() {
                expect(engine.values).to.eql({
                  "$a2[width]": 100,
                  "$a3[width]": 100,
                  "$a2[x]": 0,
                  "$a3[x]": 100
                });
                engine.scope.appendChild(a1);
                return engine.once('solve', function() {
                  expect(engine.values).to.eql({
                    "$a1[width]": 100,
                    "$a2[width]": 100,
                    "$a3[width]": 100,
                    "$a2[x]": 0,
                    "$a3[x]": 100,
                    "$a1[x]": 200
                  });
                  a3 = engine.id('a3');
                  a3.parentNode.removeChild(a3);
                  return engine.once('solve', function() {
                    var divs;
                    expect(engine.values).to.eql({
                      "$a1[width]": 100,
                      "$a2[width]": 100,
                      "$a2[x]": 0,
                      "$a1[x]": 100
                    });
                    divs = engine.tag('div');
                    while (divs[0]) {
                      divs[0].parentNode.removeChild(divs[0]);
                    }
                    return engine.once('solve', function() {
                      expect(engine.values).to.eql({});
                      return done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    describe('order dependent selectors with comma', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<style type=\"text/gss\" id=\"style\">                            \n  #a2 ++ .a, #style ~~ .a {\n    (&:first)[left] == 0;\n    &[width] == 100;\n    (&:previous)[right] == &[left];\n  }       \n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div> ";
        engine;
        return engine.once('solve', function() {
          var a3;
          expect(engine.values).to.eql({
            "$a1[width]": 100,
            "$a2[width]": 100,
            "$a3[width]": 100,
            "$a1[x]": 0,
            "$a2[x]": 100,
            "$a3[x]": 200
          });
          a3 = engine.id('a3');
          a3.parentNode.removeChild(a3);
          return engine.once('solve', function() {
            expect(engine.values).to.eql({
              "$a1[width]": 100,
              "$a2[width]": 100,
              "$a1[x]": 0,
              "$a2[x]": 100
            });
            engine.scope.appendChild(a3);
            return engine.once('solve', function() {
              var a1;
              expect(engine.values).to.eql({
                "$a1[width]": 100,
                "$a2[width]": 100,
                "$a3[width]": 100,
                "$a1[x]": 0,
                "$a2[x]": 100,
                "$a3[x]": 200
              });
              a1 = engine.id('a1');
              a1.parentNode.removeChild(a1);
              return engine.once('solve', function() {
                expect(engine.values).to.eql({
                  "$a2[width]": 100,
                  "$a3[width]": 100,
                  "$a2[x]": 0,
                  "$a3[x]": 100
                });
                engine.scope.appendChild(a1);
                return engine.once('solve', function() {
                  expect(engine.values).to.eql({
                    "$a1[width]": 100,
                    "$a2[width]": 100,
                    "$a3[width]": 100,
                    "$a2[x]": 0,
                    "$a3[x]": 100,
                    "$a1[x]": 200
                  });
                  a3 = engine.id('a3');
                  a3.parentNode.removeChild(a3);
                  return engine.once('solve', function() {
                    var divs;
                    expect(engine.values).to.eql({
                      "$a1[width]": 100,
                      "$a2[width]": 100,
                      "$a2[x]": 0,
                      "$a1[x]": 100
                    });
                    divs = engine.tag('div');
                    while (divs[0]) {
                      divs[0].parentNode.removeChild(divs[0]);
                    }
                    return engine.once('solve', function() {
                      expect(engine.values).to.eql({});
                      return done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    describe('complex plural selectors on the right', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<style type=\"text/gss\" scoped>                            \n  [x] == 100;\n  .a[x] == (.b !+ .b)[x] == [x];          \n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div>            \n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>\n<div id=\"b3\" class=\"b\"></div>";
        engine;
        return engine.once('solve', function(e) {
          var b3;
          expect(engine.values).to.eql({
            "x": 100,
            "$a1[x]": 100,
            "$a2[x]": 100,
            "$b1[x]": 100,
            "$b2[x]": 100
          });
          b3 = engine.id('b3');
          b3.parentNode.removeChild(b3);
          return engine.once('solve', function(e) {
            expect(engine.values).to.eql({
              "x": 100,
              "$a1[x]": 100,
              "$b1[x]": 100
            });
            engine.scope.appendChild(b3);
            return engine.once('solve', function(e) {
              var divs;
              expect(engine.values).to.eql({
                "x": 100,
                "$a1[x]": 100,
                "$a2[x]": 100,
                "$b1[x]": 100,
                "$b2[x]": 100
              });
              divs = engine.tag('div');
              while (divs[0]) {
                divs[0].parentNode.removeChild(divs[0]);
              }
              return engine.once('solve', function(e) {
                expect(engine.values).to.eql({
                  "x": 100
                });
                engine.scope.innerHTML = "";
                return engine.once('solve', function(e) {
                  expect(engine.values).to.eql({});
                  return done();
                });
              });
            });
          });
        });
      });
    });
    describe('complex plural selectors on both sides', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<style type=\"text/gss\" scoped>                            \n  [x] == 100;\n  (.a !+ .a)[x] == (.b !+ .b)[x] == [x];          \n</style>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div>            \n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>\n<div id=\"b3\" class=\"b\"></div>";
        engine;
        return engine.once('solve', function(e) {
          var b3;
          expect(engine.values).to.eql({
            "x": 100,
            "$a1[x]": 100,
            "$a2[x]": 100,
            "$b1[x]": 100,
            "$b2[x]": 100
          });
          b3 = engine.id('b3');
          b3.parentNode.removeChild(b3);
          return engine.once('solve', function(e) {
            expect(engine.values).to.eql({
              "x": 100,
              "$a1[x]": 100,
              "$b1[x]": 100
            });
            engine.scope.appendChild(b3);
            return engine.once('solve', function(e) {
              var a1;
              expect(engine.values).to.eql({
                "x": 100,
                "$a1[x]": 100,
                "$a2[x]": 100,
                "$b1[x]": 100,
                "$b2[x]": 100
              });
              a1 = engine.id('a1');
              a1.parentNode.removeChild(a1);
              return engine.once('solve', function(e) {
                var divs;
                expect(engine.values).to.eql({
                  "x": 100,
                  "$a2[x]": 100,
                  "$b1[x]": 100,
                  "$b2[x]": 100
                });
                divs = engine.tag('div');
                while (divs[0]) {
                  divs[0].parentNode.removeChild(divs[0]);
                }
                return engine.once('solve', function(e) {
                  expect(engine.values).to.eql({
                    "x": 100
                  });
                  engine.scope.innerHTML = "";
                  return engine.once('solve', function(e) {
                    expect(engine.values).to.eql({});
                    return done();
                  });
                });
              });
            });
          });
        });
      });
    });
    describe('balanced plural selectors', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div>            \n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>\n<div id=\"b3\" class=\"b\"></div>\n<style type=\"text/gss\" scoped>                            \n  [x] == 100;\n  .a[x] == .b[x] == [x];              \n</style>";
        return engine.once('solve', function(e) {
          var a3;
          expect(engine.values).to.eql({
            "x": 100,
            "$a1[x]": 100,
            "$a2[x]": 100,
            "$a3[x]": 100,
            "$b1[x]": 100,
            "$b2[x]": 100,
            "$b3[x]": 100
          });
          a3 = engine.id('a3');
          a3.parentNode.removeChild(a3);
          return engine.once('solve', function(e) {
            var b1;
            expect(engine.values).to.eql({
              "x": 100,
              "$a1[x]": 100,
              "$a2[x]": 100,
              "$b1[x]": 100,
              "$b2[x]": 100,
              "$b3[x]": 100
            });
            b1 = engine.id('b1');
            b1.parentNode.removeChild(b1);
            window.zzzz = true;
            return engine.once('solve', function(e) {
              expect(engine.values).to.eql({
                "x": 100,
                "$a1[x]": 100,
                "$a2[x]": 100,
                "$b2[x]": 100,
                "$b3[x]": 100
              });
              return done();
            });
          });
        });
      });
    });
    describe('WARN: unbalanced plural selectors', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"a3\" class=\"a\"></div>            \n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>\n<div id=\"b3\" class=\"b\"></div>\n<div id=\"b4\" class=\"b\"></div>\n<style type=\"text/gss\" scoped>                            \n  [x] == 100;\n  .a[x] == .b[x] == [x];              \n</style>";
        engine;
        return engine.once('solve', function(e) {
          var a3, a4;
          expect(engine.values).to.eql({
            "x": 100,
            "$a1[x]": 100,
            "$a2[x]": 100,
            "$a3[x]": 100,
            "$b1[x]": 100,
            "$b2[x]": 100,
            "$b3[x]": 100,
            "$b4[x]": 100
          });
          a3 = engine.id('a3');
          a4 = a3.cloneNode();
          a4.id = 'a4';
          a3.parentNode.appendChild(a4);
          return engine.once('solve', function(e) {
            var a1;
            expect(engine.values).to.eql({
              "x": 100,
              "$a1[x]": 100,
              "$a2[x]": 100,
              "$a3[x]": 100,
              "$a4[x]": 100,
              "$b1[x]": 100,
              "$b2[x]": 100,
              "$b3[x]": 100,
              "$b4[x]": 100
            });
            a1 = engine.id('a1');
            a1.parentNode.removeChild(a1);
            return engine.once('solve', function(e) {
              var b4;
              expect(engine.values).to.eql({
                "x": 100,
                "$a2[x]": 100,
                "$a3[x]": 100,
                "$a4[x]": 100,
                "$b1[x]": 100,
                "$b2[x]": 100,
                "$b3[x]": 100,
                "$b4[x]": 100
              });
              b4 = engine.id('b4');
              b4.parentNode.removeChild(b4);
              return engine.once('solve', function(e) {
                var b3;
                expect(engine.values).to.eql({
                  "x": 100,
                  "$a2[x]": 100,
                  "$a3[x]": 100,
                  "$a4[x]": 100,
                  "$b1[x]": 100,
                  "$b2[x]": 100,
                  "$b3[x]": 100
                });
                b3 = engine.id('b3');
                b3.parentNode.removeChild(b3);
                return engine.once('solve', function(e) {
                  var a2;
                  expect(engine.values).to.eql({
                    "x": 100,
                    "$a2[x]": 100,
                    "$a3[x]": 100,
                    "$b1[x]": 100,
                    "$b2[x]": 100
                  });
                  a2 = engine.id('a2');
                  a2.parentNode.removeChild(a2);
                  return engine.once('solve', function(e) {
                    var divs;
                    expect(engine.values).to.eql({
                      "x": 100,
                      "$a3[x]": 100,
                      "$a4[x]": 100,
                      "$b1[x]": 100,
                      "$b2[x]": 100
                    });
                    divs = engine.tag('div');
                    while (divs[0]) {
                      divs[0].parentNode.removeChild(divs[0]);
                    }
                    return engine.once('solve', function(e) {
                      expect(engine.values).to.eql({
                        "x": 100
                      });
                      return done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    xdescribe(':not selector', function() {
      return xit('should compute values', function(done) {
        container.innerHTML = "<section class=\"section\">\n  <div id=\"a1\" class=\"a\"></div>\n  <div id=\"a2\" class=\"a\"></div>\n  <div id=\"a3\" class=\"a\"></div>            \n  <div id=\"b1\" class=\"b\"></div>\n  <div id=\"b2\" class=\"b\"></div>\n  <div id=\"b3\" class=\"b\"></div>\n</section>\n<style type=\"text/gss\">                            \n  [x] == 100;\n  (section.section div:not(.b))[x] == (section.section div:not(.a))[x] == [x];              \n</style>";
        return engine.once('display', function(e) {
          expect(engine.vars).to.eql({
            "x": 100,
            "$a1[x]": 100,
            "$a2[x]": 100,
            "$a3[x]": 100,
            "$b1[x]": 100,
            "$b2[x]": 100,
            "$b3[x]": 100
          });
          return done();
        });
      });
    });
    describe('2D sugar', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"sugar1\"></div>\n<div id=\"sugar2\"></div>\n<style type=\"text/gss\">                            \n  #sugar1 {\n    width: 10px;\n    height: 10px;\n    x: == 5;\n    y: == 5;\n  }\n  #sugar2 {\n    size: == ($ #sugar1)[intrinsic-size];\n  }\n  #sugar1[position] == #sugar2[center];              \n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$sugar1[x]": 5,
            "$sugar1[y]": 5,
            "$sugar1[intrinsic-width]": 10,
            "$sugar1[intrinsic-height]": 10,
            "$sugar2[width]": 10,
            "$sugar2[height]": 10,
            "$sugar2[x]": 0,
            "$sugar2[y]": 0
          });
          return done();
        });
      });
    });
    describe('intrinsic & measurable css in same gss block', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"sync1\" class=\"sync\"></div>\n<style type=\"text/gss\">                            \n  .sync, .async {\n    width: 100px;\n    height: == ::[intrinsic-width];\n  }\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$sync1[height]": 100,
            "$sync1[intrinsic-width]": 100
          });
          return done();
        });
      });
    });
    describe('intrinsic & measure-impacting css in same gss block', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"sync1\" class=\"sync\"></div>\n<style type=\"text/gss\" id=\"style999\">                            \n  .sync, .async {\n    width: 100px;\n    padding-left: 20px;\n    height: == ::[intrinsic-width];\n  }\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$sync1[height]": 120,
            "$sync1[intrinsic-width]": 120
          });
          return done();
        });
      });
    });
    return describe('async added elements w/ intrinsics', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"sync1\" class=\"sync\"></div>\n<style type=\"text/gss\" id=\"style555\">                            \n  .sync, .async {\n    width: 100px;\n    height: == ::[intrinsic-width];\n    test: == 0;\n  }\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$sync1[height]": 100,
            "$sync1[intrinsic-width]": 100,
            "$sync1[test]": 0
          });
          container.insertAdjacentHTML('beforeend', '<div id="async1" class="sync"></div>');
          return engine.once('solve', function(e) {
            expect(engine.values).to.eql({
              "$sync1[height]": 100,
              "$sync1[test]": 0,
              "$sync1[intrinsic-width]": 100,
              "$async1[height]": 100,
              "$async1[test]": 0,
              "$async1[intrinsic-width]": 100
            });
            return done();
          });
        });
      });
    });
  });
  describe("::window", function() {
    describe('center values', function() {
      return it('should compute values', function(done) {
        engine.once('solve', function(e) {
          var cx, cy, h, w;
          w = document.documentElement.clientWidth;
          cx = w / 2;
          h = Math.min(window.innerHeight, document.documentElement.clientHeight);
          cy = h / 2;
          expect(engine.values["center-x"]).to.eql(cx);
          expect(engine.values["center-y"]).to.eql(cy);
          return done();
        });
        return container.innerHTML = "<style type=\"text/gss\" scoped>              \n  [center-x] == ::window[center-x];\n  [center-y] == ::window[center-y];\n</style>";
      });
    });
    return describe('position values', function() {
      return it('should compute values', function(done) {
        engine.once('solve', function(e) {
          var h, w;
          w = document.documentElement.clientWidth;
          h = Math.min(window.innerHeight, document.documentElement.clientHeight);
          expect(engine.values["top"]).to.eql(0);
          expect(engine.values["right"]).to.eql(w);
          expect(engine.values["bottom"]).to.eql(h);
          expect(engine.values["left"]).to.eql(0);
          return done();
        });
        return container.innerHTML = "<style type=\"text/gss\" scoped>\n  [top] == ::window[top];\n  [right] == ::window[right];\n  [bottom] == ::window[bottom];\n  [left] == ::window[left];\n</style>";
      });
    });
  });
  describe('External .gss files', function() {
    describe("single file", function() {
      return it('should compute', function(done) {
        var counter, listen;
        counter = 0;
        listen = function(e) {
          counter++;
          if (counter === 1) {
            expect(engine.values).to.eql({
              "external-file": 1000
            });
            return container.innerHTML = "";
          } else {
            expect(engine.values).to.eql({});
            engine.removeEventListener('solve', listen);
            return done();
          }
        };
        engine.addEventListener('solve', listen);
        return container.innerHTML = "<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file.gss\" scoped></link>";
      });
    });
    describe("multiple files", function() {
      return it('should compute', function(done) {
        var counter, listen;
        counter = 0;
        listen = function(e) {
          counter++;
          if (counter === 1) {
            expect(engine.values).to.eql({
              "external-file": 1000,
              "external-file-2": 2000,
              "external-file-3": 3000
            });
            return container.innerHTML = "";
          } else {
            expect(engine.values).to.eql({});
            engine.removeEventListener('solve', listen);
            return done();
          }
        };
        engine.addEventListener('solve', listen);
        return container.innerHTML = "<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file.gss\" scoped></link>\n<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file-2.gss\" scoped></link>\n<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file-3.gss\" scoped></link>";
      });
    });
    return describe("nested files", function() {
      return it('should compute', function(done) {
        var counter, external, inline, listen;
        counter = 0;
        inline = null;
        external = null;
        listen = function(e) {
          counter++;
          if (counter === 1) {
            expect(engine.values).to.eql({
              "external-file": 1000,
              "external-file-2": 2000,
              "external-file-3": 3000
            });
            inline = engine.id('inline');
            return inline.parentNode.removeChild(inline);
          } else if (counter === 2) {
            expect(engine.values).to.eql({
              "external-file-2": 2000,
              "external-file-3": 3000
            });
            return engine.scope.appendChild(inline);
          } else if (counter === 3) {
            expect(engine.values).to.eql({
              "external-file": 1000,
              "external-file-2": 2000,
              "external-file-3": 3000
            });
            external = engine.id('external');
            return external.parentNode.removeChild(external);
          } else if (counter === 4) {
            expect(engine.values).to.eql({
              "external-file": 1000
            });
            return engine.scope.appendChild(external);
          } else if (counter === 5) {
            expect(engine.values).to.eql({
              "external-file": 1000,
              "external-file-2": 2000,
              "external-file-3": 3000
            });
            return engine.scope.innerHTML = '';
          } else {
            expect(engine.values).to.eql({});
            engine.removeEventListener('solve', listen);
            return done();
          }
        };
        engine.addEventListener('solve', listen);
        return container.innerHTML = "<style type=\"text/gss\" scoped id=\"inline\">\n  @import ./fixtures/external-file.gss;\n</style>\n<link rel=\"stylesheet\" id=\"external\" type=\"text/gss\" href=\"./fixtures/external-file-2-3.gss\" scoped></link>";
      });
    });
  });
  describe('Virtual Elements', function() {
    describe('basic', function() {
      engine = null;
      it('in regular stylesheet', function(done) {
        engine = GSS(container);
        container.innerHTML = "<div id=\"ship\"></div>\n<style type=\"text/gss\" id=\"gss\">\n  #ship {\n    \"mast\"[top] == 0;\n    \"mast\"[bottom] == 100;\n    \"mast\"[left] == 10;\n    \"mast\"[right] == 20;\n    &\"mast\"[z] == 1;\n  }\n  #ship[height] == \"mast\"[height];\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            '$gss"mast"[height]': 100,
            '$gss"mast"[x]': 10,
            '$gss"mast"[width]': 10,
            '$gss"mast"[y]': 0,
            '$ship[height]': 100,
            '$ship"mast"[z]': 1
          });
          return done();
        });
      });
      it('in scoped stylesheet', function(done) {
        engine = GSS(container);
        container.innerHTML = "<div id=\"ship\"></div>\n<style scoped type=\"text/gss\" id=\"gss\">\n  #ship {\n    \"mast\"[top] == 0;\n    \"mast\"[bottom] == 100;\n    \"mast\"[left] == 10;\n    \"mast\"[right] == 20;\n    &\"mast\"[z] == 1;\n  }\n  #ship[height] == \"mast\"[height];\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            '"mast"[height]': 100,
            '"mast"[x]': 10,
            '"mast"[width]': 10,
            '"mast"[y]': 0,
            '$ship[height]': 100,
            '$ship"mast"[z]': 1
          });
          return done();
        });
      });
      return it('in mixed stylesheets', function(done) {
        engine = GSS(container);
        container.innerHTML = "<div id=\"ship\"></div>\n<style type=\"text/gss\" id=\"gss1\">\n  [b] == 10; // &\n\n  ^ {\n    \"mast\" {\n      x: == [b]; // ^^\n    }\n  }\n  ^\"mast\" {\n    d: == 100; // &\n    bottom: == [d]; // &\n  } \n</style>\n<style scoped type=\"text/gss\" id=\"gss2\">\n  [e] == 1; // $\n  #ship {\n    [c] == 20; // &\n    \"mast\"[top] == 0; // $\n    \"mast\"[right] == [c]; // $, &\n    &\"mast\"[z] == [e]; // &\n  }\n  #ship[height] == \"mast\"[height]; // $\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            '"mast"[height]': 100,
            '"mast"[x]': 10,
            '"mast"[width]': 10,
            '"mast"[y]': 0,
            '"mast"[d]': 100,
            '$ship[height]': 100,
            '$ship"mast"[z]': 1,
            '$ship[c]': 20,
            '$gss1[b]': 10,
            'e': 1
          });
          return done();
        });
      });
    });
    it('in VFL', function(done) {
      engine = window.$engine = GSS(container);
      container.style.width = '400px';
      container.style.height = '100px';
      container.innerHTML = "\n    <button id=\"box\" class=\"box foo\" onclick=\"this.setAttribute('class', this.className.indexOf('bar') > -1 ? 'box foo' : 'box bar')\"></button>\n\n    <style type=\"text/gss\">\n      [col-gap] == 16;\n      $[size] == $[intrinsic-size];\n      $[left] == 0;\n    \n      @h |($\"col-1...8\")-[col-gap]-...| in($) !require {\n        width: == $[col-width] !require;\n      }\n      \n      .box {          \n        @v |(&)| in(::window);\n        &.bar {\n          @h |(&)| in($\"col-6\");\n        }\n        &.foo {\n          @h |(&)| in($\"col-3\");\n        }\n      }\n    </style>\n    ";
      return engine.then(function(solution) {
        expect(Math.floor(solution["col-width"])).to.eql((400 - 16 * 7) / 8);
        expect(Math.floor(solution["$box[width]"])).to.eql((400 - 16 * 7) / 8);
        expect(Math.floor(solution["$box[x]"])).to.eql((((400 - 16 * 7) / 8) + 16) * 2);
        engine.id('box').click();
        return engine.then(function(solution) {
          expect(Math.floor(solution["$box[width]"])).to.eql((400 - 16 * 7) / 8);
          expect(Math.floor(solution["$box[x]"])).to.eql((((400 - 16 * 7) / 8) + 16) * 5);
          return done();
        });
      });
    });
    return it('in comma', function(done) {
      engine = window.$engine = GSS(container);
      container.style.width = '400px';
      container.style.height = '100px';
      container.innerHTML = "<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>\n<style type=\"text/gss\" scoped>\n  \"c\", .a, \"z\", .b {\n    &:next[x] == 10;\n  }\n</style>";
      return engine.then(function(solution) {
        var item, lefts;
        expect(solution).to.eql({
          "$a1[x]": 10,
          "$a2[x]": 10,
          "\"z\"[x]": 10,
          "$b1[x]": 10,
          "$b2[x]": 10
        });
        lefts = (function() {
          var _i, _ref, _results;
          _ref = engine["class"]('a');
          _results = [];
          for (_i = _ref.length - 1; _i >= 0; _i += -1) {
            item = _ref[_i];
            item.parentNode.removeChild(item);
            _results.push(item);
          }
          return _results;
        })();
        return engine.then(function(solution) {
          var _i;
          expect(solution).to.eql({
            '$a1[x]': null,
            "$a2[x]": null
          });
          for (_i = lefts.length - 1; _i >= 0; _i += -1) {
            item = lefts[_i];
            engine.scope.insertBefore(item, engine.id('b2'));
          }
          return engine.then(function(solution) {
            var items;
            expect(solution).to.eql({
              '$a1[x]': 10,
              "$a2[x]": 10
            });
            items = (function() {
              var _j, _ref, _results;
              _ref = engine.tag('div');
              _results = [];
              for (_j = _ref.length - 1; _j >= 0; _j += -1) {
                item = _ref[_j];
                item.parentNode.removeChild(item);
                _results.push(item);
              }
              return _results;
            })();
            return engine.then(function(solution) {
              return expect(solution).to.eql({
                '$b1[x]': null,
                "$b2[x]": null,
                '$a1[x]': null,
                "$a2[x]": null
              }, done());
            });
          });
        });
      });
    });
  });
  describe('Edge cases', function() {
    return it('should handle identical constraints', function(done) {
      engine.then(function() {
        expect(engine.domains.length).to.eql(1);
        expect(engine.domains[0].constraints.length).to.eql(1);
        expect(engine.domains[0].constraints[0].operations.length).to.eql(3);
        return done();
      });
      return container.innerHTML = "<style type=\"text/gss\">\n  button {\n    $[b] == 1;\n  }\n</style>\n<button id=\"button1\"></button>\n<button id=\"button2\"></button>\n<button id=\"button3\"></button>";
    });
  });
  describe('VGL', function() {
    xdescribe('grid-template', function() {
      engine = null;
      return it('vars', function(done) {
        var listener;
        listener = function(e) {
          var key, target, val;
          target = {
            '$layout[x]': 0,
            '$layout[y]': 0,
            '$layout[width]': 100,
            '$layout[height]': 10,
            '$layout[a-md-width]': 50,
            '$layout[a-md-height]': 10,
            '$layout"a-1"[width]': 50,
            '$layout"a-2"[width]': 50,
            '$layout"a-1"[height]': 10,
            '$layout"a-2"[height]': 10,
            '$layout"a-1"[x]': 0,
            '$layout"a-2"[x]': 50,
            '$layout"a-1"[y]': 0,
            '$layout"a-2"[y]': 0
          };
          for (key in target) {
            val = target[key];
            assert(engine.values[key] === val, "" + engine.vars[key] + " should be " + val);
          }
          return done();
        };
        engine.once('solve', listener);
        return container.innerHTML = "<div id=\"layout\"></div>\n<style type=\"text/gss\" scoped>\n  #layout {\n    x: == 0;\n    y: == 0;\n    width: == 100;\n    height: == 10;\n    @grid-template a\n      \"12\";\n  }\n</style>";
      });
    });
    return xdescribe('grid-rows & grid cols', function() {
      var target;
      engine = null;
      target = {
        '$item[x]': 55,
        '$item[y]': 5,
        '$item[width]': 45,
        '$item[height]': 5,
        '$layout[x]': 0,
        '$layout[y]': 0,
        '$layout[width]': 100,
        '$layout[height]': 10,
        '$layout"r1"[width]': 100,
        '$layout"r1"[height]': 5,
        '$layout"r1"[x]': 0,
        '$layout"r1"[y]': 0,
        '$layout"r2"[width]': 100,
        '$layout"r2"[height]': 5,
        '$layout"r2"[x]': 0,
        '$layout"r2"[y]': 5,
        '$layout"c1"[width]': 45,
        '$layout"c1"[height]': 10,
        '$layout"c1"[x]': 0,
        '$layout"c1"[y]': 0,
        '$layout"c2"[width]': 45,
        '$layout"c2"[height]': 10,
        '$layout"c2"[x]': 55,
        '$layout"c2"[y]': 0
      };
      xdescribe('flat', function() {
        return it(' vars', function(done) {
          var listener;
          engine = GSS(container);
          container.innerHTML = "<div id=\"layout\"></div>\n<div id=\"item\"></div>\n<style type=\"text/gss\" scoped>\n  #layout {\n    x: == 0;\n    y: == 0;\n    width: == 100;\n    height: == 10;\n    @grid-rows \"r1 r2\";\n    @grid-cols \"c1-c2\" gap(10);\n    @h |[#item]| in(\"c2\");\n    @v |[#item]| in(\"r2\");\n  }\n</style>";
          listener = function(e) {
            var key, val;
            for (key in target) {
              val = target[key];
              assert(engine.vars[key] === val, "" + key + " is " + engine.vars[key]);
            }
            return done();
          };
          return engine.once('solve', listener);
        });
      });
      return xdescribe('cross-sheet', function() {
        return it(' vars', function(done) {
          var listener;
          engine = GSS(container);
          container.innerHTML = "<div id=\"layout\"></div>\n<div id=\"item\"></div>\n\n<style type=\"text/gss\" scoped>\n  #layout {\n    @h |[#item]| in(\"c2\");\n    @v |[#item]| in(\"r2\");\n  }\n</style>\n<style type=\"text/gss\" scoped>\n  #layout {\n    x: == 0;\n    y: == 0;\n    width: == 100;\n    height: == 10;\n    @grid-rows \"r1 r2\";\n    @grid-cols \"c1-c2\" gap(10);\n  }\n</style>";
          listener = function(e) {
            var key, val;
            for (key in target) {
              val = target[key];
              assert(engine.vars[key] === val, "" + key + " is " + engine.vars[key]);
            }
            return done();
          };
          return engine.once('solve', listener);
        });
      });

      /*
      describe 'nested', ->
        it 'vars', (done) ->
          engine = GSS(container)
          container.innerHTML =  """
            <div id="layout"></div>
            <div id="item"></div>
            <style type="text/gss" scoped>
               *layout {
                x: == 0;
                y: == 0;
                width: == 100;
                height: == 10;
                @grid-rows "r1 r2";
                @grid-cols "c1-c2" gap(10);
                 *item {
                  @h |[::]| in("c2");
                  @v |[::]| in("r2");
                }
              }
            </style>
            """
          listener = (e) ->        
            GSS.console.log engine.vars
            for key, val of target
              assert engine.vars[key] is val, "#{key} is #{engine.vars[key]}"
            done()
          engine.once 'solve', listener
       */
    });
  });
  describe("@if @else", function() {
    describe('|| and :: in condition', function() {
      return it('should compute values', function(done) {
        engine.assumed.merge({
          '$button1[t]': 500,
          '$button2[t]': 400
        });
        engine.once('solve', function() {
          expect(engine.values).to.eql({
            "$button1[x]": 96,
            "$button2[x]": 1,
            "$button1[t]": 500,
            "$button2[t]": 400
          });
          engine.once('solve', function() {
            expect(engine.values).to.eql({
              "$button1[x]": 1,
              "$button2[x]": 96,
              "$button1[t]": 400,
              "$button2[t]": 100
            });
            engine.once('solve', function() {
              expect(engine.values).to.eql({
                "$button1[x]": 1,
                "$button2[x]": 1,
                "$button1[t]": 400,
                "$button2[t]": 400
              });
              return done();
            });
            return engine.assumed.merge({
              '$button2[t]': 400
            });
          });
          return engine.assumed.merge({
            '$button1[t]': 400,
            '$button2[t]': 100
          });
        });
        return container.innerHTML = "<style type=\"text/gss\">\n  button {\n    @if &[t] >= 450 || &[t] < 250 {          \n      &[x] == 96;\n    }\n\n    @else {  \n      &[x] == 1;  \n    }\n  }\n</style>\n<button id=\"button1\"></button>\n<button id=\"button2\"></button>";
      });
    });
    describe('|| over two variables', function() {
      return it('should compute values', function(done) {
        engine.assumed.merge({
          A: 200,
          B: 200
        });
        engine.once('solve', function() {
          expect(engine.values).to.eql({
            "A": 200,
            "B": 200,
            "a": 200,
            "b": 200,
            "x": 1
          });
          engine.once('solve', function() {
            expect(engine.values).to.eql({
              "A": 500,
              "B": 200,
              "a": 500,
              "b": 200,
              "x": 96
            });
            engine.once('solve', function() {
              expect(engine.values).to.eql({
                "A": 200,
                "B": 200,
                "a": 200,
                "b": 200,
                "x": 1
              });
              engine.once('solve', function() {
                expect(engine.values).to.eql({
                  "A": 200,
                  "B": 500,
                  "a": 200,
                  "b": 500,
                  "x": 96
                });
                engine.once('solve', function() {
                  expect(engine.values).to.eql({
                    "A": 200,
                    "B": 200,
                    "a": 200,
                    "b": 200,
                    "x": 1
                  });
                  engine.once('solve', function() {
                    expect(engine.values).to.eql({
                      "A": 500,
                      "B": 500,
                      "a": 500,
                      "b": 500,
                      "x": 96
                    });
                    engine.once('solve', function() {
                      expect(engine.values).to.eql({
                        "A": 200,
                        "B": 200,
                        "a": 200,
                        "b": 200,
                        "x": 1
                      });
                      return done();
                    });
                    return engine.assumed.merge({
                      A: 200,
                      B: 200
                    });
                  });
                  return engine.assumed.merge({
                    A: 500,
                    B: 500
                  });
                });
                return engine.assumed.merge({
                  B: 200
                });
              });
              return engine.assumed.merge({
                B: 500
              });
            });
            return engine.assumed.merge({
              A: 200
            });
          });
          return engine.assumed.merge({
            A: 500
          });
        });
        return container.innerHTML = "    <style type=\"text/gss\" scoped>\n    [a] == [A];\n    [b] == [B];\n\n    @if [a] >= 400 || [b] >= 400 {          \n      [x] == 96;\n    }\n\n    @else {  \n      [x] == 1;  \n    }\n    </style>";
      });
    });
    describe('&& over two variables', function() {
      return it('should compute values', function(done) {
        engine.assumed.merge({
          input: 200
        });
        engine.once('solve', function() {
          expect(engine.values).to.eql({
            "input": 200,
            "t": 500,
            "x": 96,
            "z": 200
          });
          engine.once('solve', function() {
            expect(engine.values).to.eql({
              "input": 500,
              "t": 500,
              "x": 1,
              "z": 500
            });
            engine.once('solve', function() {
              expect(engine.values).to.eql({
                "input": 200,
                "t": 500,
                "x": 96,
                "z": 200
              });
              return done();
            });
            return engine.assumed.merge({
              input: 200
            });
          });
          return engine.assumed.merge({
            input: 500
          });
        });
        return container.innerHTML = "    <style type=\"text/gss\" scoped>\n    [t] == 500;\n    [z] == [input];\n\n    @if [t] >= 400 && [z] < 450 {          \n      [x] == 96;\n    }\n\n    @else {  \n      [x] == 1;  \n    }\n    </style>";
      });
    });
    describe('flat @if @else w/o queries', function() {
      return it('should compute values', function(done) {
        var listen;
        listen = function(e) {
          expect(engine.values).to.eql({
            "t": 500,
            "x": 1
          });
          return done();
        };
        engine.once('solve', listen);
        return container.innerHTML = "    <style type=\"text/gss\" scoped>\n    [t] == 500;\n\n    @if [t] >= 960 {          \n      [x] == 96;\n    }\n\n    @else {  \n      [x] == 1;  \n    }\n    </style>";
      });
    });
    describe('top level @if @else w/ queries', function() {
      return it('should compute values', function(done) {
        var listen;
        listen = function(e) {
          expect(engine.values).to.eql({
            "t": 500,
            "$b[width]": 1
          });
          return done();
        };
        container.innerHTML = "          <div id=\"b\"></div>\n          <style type=\"text/gss\" scoped>\n          [t] == 500;\n      \n          @if [t] >= 960 {\n        \n            #b {\n              width: == 100;\n            }\n\n          }\n\n          @else {\n\n            #b {\n              width: == 1;\n            }\n\n          }\n          </style>";
        return engine.once('solve', listen);
      });
    });
    describe('contextual @if @else', function() {
      return it('should compute values', function(done) {
        var listen;
        listen = function(e) {
          expect(engine.values).to.eql({
            "$box1[width]": 9,
            "$box2[width]": 19,
            "$box1[height]": 10,
            "$box2[height]": 20
          });
          return done();
        };
        container.innerHTML = "  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n  <style type=\"text/gss\">\n\n  #box1[width] == 9;\n  #box2[width] == 19;\n\n  .box {\n    @if ::[width] < 10 {\n      height: == 10;\n    }\n    @else {\n      height: == 20;\n    }\n  }\n\n  </style>";
        return engine.once('solve', listen);
      });
    });
    describe('and / or @if @else', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n  <div id=\"box3\" class=\"box\"></div>\n  <style type=\"text/gss\">\n\n  #box1[width] == 9;\n  #box2[width] == 11;\n  #box3[width] == 10;\n  #box1[height] == 9;\n  #box2[height] == 11;\n  #box3[height] == 10;\n\n  .box {\n    @if ::[width] < 10 and ::[height] < 10 {\n      state: == 1;\n    } @else {\n      @if ::[width] > 10 and ::[height] > 10 {\n        state: == 2;\n      } @else { \n        @if ::[width] == 10 or ::[height] == 10 {\n          state: == 3;\n        }\n      }\n    }\n  }\n\n  </style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$box1[width]": 9,
            "$box2[width]": 11,
            "$box3[width]": 10,
            "$box1[height]": 9,
            "$box2[height]": 11,
            "$box3[height]": 10,
            "$box1[state]": 1,
            "$box2[state]": 2,
            "$box3[state]": 3
          });
          return done();
        });
      });
    });
    describe('arithmetic @if @else', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n  <div id=\"box3\" class=\"box\"></div>\n  <style type=\"text/gss\">\n\n  #box1[width] == 9;\n  #box2[width] == 11;\n  #box3[width] == 10;\n  #box1[height] == 9;\n  #box2[height] == 11;\n  #box3[height] == 10;\n\n  .box {\n    @if ::[width] + ::[height] < 20 {\n      state: == 1;\n    } @else {\n      @if ::[width] + ::[height] == 22 {\n        state: == 2;\n      } @else {\n        @if ::[width] * ::[height] >= 99 {\n          state: == 3;\n        }\n      }\n    } \n  }\n\n  </style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$box1[width]": 9,
            "$box2[width]": 11,
            "$box3[width]": 10,
            "$box1[height]": 9,
            "$box2[height]": 11,
            "$box3[height]": 10,
            "$box1[state]": 1,
            "$box2[state]": 2,
            "$box3[state]": 3
          });
          return done();
        });
      });
    });
    describe('parans + arithmetic @if @else', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n  <div id=\"box3\" class=\"box\"></div>\n  <style type=\"text/gss\">\n\n  #box1[width] == 9;\n  #box2[width] == 11;\n  #box3[width] == 10;\n  #box1[height] == 9;\n  #box2[height] == 11;\n  #box3[height] == 10;\n\n  .box {\n    @if (::[width] + ::[height] < 20) and (::[width] == 9) {\n      state: == 1;\n    } @else {\n      @if (::[width] + ::[height] == 22) and (::[width] == 11) {\n        state: == 2;\n      } @else {\n        @if (::[width] * ::[height] >= 99) and (::[width] == 999999) {\n          state: == 4;\n        } @else {\n          @if (::[width] * ::[height] >= 99) and (::[width] == 10) {\n            state: == 3;\n          }\n        }\n      }\n    }\n  }\n\n  </style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$box1[width]": 9,
            "$box2[width]": 11,
            "$box3[width]": 10,
            "$box1[height]": 9,
            "$box2[height]": 11,
            "$box3[height]": 10,
            "$box1[state]": 1,
            "$box2[state]": 2,
            "$box3[state]": 3
          });
          return done();
        });
      });
    });
    describe('TODO!!!! contextual @if @else with vanilla CSS', function() {
      return it('should compute values', function(done) {
        var listen;
        listen = function(e) {
          expect(engine.id('box1').style.width).to.eql('9px');
          expect(engine.id('box2').style.width).to.eql('19px');
          expect(window.getComputedStyle(engine.id("box1"), null).getPropertyValue("z-index")).to.equal("auto");
          expect(window.getComputedStyle(engine.id("box2"), null).getPropertyValue("z-index")).to.equal("auto");
          expect(window.getComputedStyle(engine.id("box1"), null).getPropertyValue("margin-top")).to.equal("0px");
          expect(window.getComputedStyle(engine.id("box2"), null).getPropertyValue("margin-top")).to.equal("0px");
          expect(window.getComputedStyle(engine.id("box1"), null).getPropertyValue("padding-top")).to.equal("1px");
          expect(window.getComputedStyle(engine.id("box2"), null).getPropertyValue("padding-top")).to.equal("1px");
          expect(engine.id("box1").style.paddingTop).to.eql('');
          expect(engine.id("box2").style.paddingTop).to.eql('');
          expect(engine.id("box1").style.marginTop).to.eql('');
          expect(engine.id("box2").style.marginTop).to.eql('');
          expect(engine.id("box1").style.zIndex).to.eql('1');
          expect(engine.id("box2").style.zIndex).to.eql('2');
          return done();
        };
        container.innerHTML = "  <div id=\"box1\" class=\"box\"></div>\n  <div id=\"box2\" class=\"box\"></div>\n  <style type=\"text/gss\">\n\n    #box1[width] == 9;\n    #box2[width] == 19;\n\n    .box {\n      @if $[intrinsic-width] < 10 {\n        margin-top: 1px;\n      }\n      @if $[intrinsic-width] > 10 {\n        padding-top: 1px;\n      }\n      @if ::[width] < 10 {\n        z-index: 1;\n      }\n      @else {\n        z-index: 2;\n      }\n    }\n\n  </style>";
        return engine.once('solve', listen);
      });
    });
    describe('contextual @if @else inner nesting', function() {
      return it('should compute values', function(done) {
        var listen;
        listen = function(e) {
          expect(engine.values).to.eql({
            "$box1[width]": 9,
            "$box2[width]": 19,
            "$inside2[height]": 20
          });
          return done();
        };
        container.innerHTML = "  <div id=\"box1\" class=\"box\">\n    <div id=\"inside1\" class=\"inside\"></div>\n  </div>\n  <div id=\"container\">\n    <div id=\"box2\" class=\"box\">\n      <div id=\"inside2\" class=\"inside\"></div>\n    </div>\n  </div>\n  <style type=\"text/gss\">\n  \n  #box1[width] == 9;\n  #box2[width] == 19;\n  \n  #container {\n    \n    .box {\n      @if ::[width] < 10 {\n        .inside {\n          height: == 10;\n        }\n      }\n      @else {\n        .inside {\n          height: == 20;\n        }\n      }\n    }            \n  }\n\n  </style>";
        return engine.once('solve', listen);
      });
    });
    describe('top level @if @else w/ complex queries', function() {
      return it('should be ok', function(done) {
        var listen;
        listen = function(e) {
          expect(engine.values).to.eql({
            '$section1[height]': 20,
            '$section1[intrinsic-height]': 20,
            '$section1[width]': document.documentElement.clientWidth - 200,
            '$section1[x]': 100,
            '$section1[y]': 0,
            '$section2[height]': 10,
            '$section2[intrinsic-height]': 10,
            '$section2[width]': document.documentElement.clientWidth - 200,
            '$section2[x]': 100,
            '$section2[y]': 0,
            '::window[width]': document.documentElement.clientWidth,
            '::window[x]': 0,
            '::window[y]': 0,
            'Wwin': 1000
          });
          return done();
        };
        container.innerHTML = "          <div class=\"section\" id=\"section1\" style=\"height: 20px\"></div>\n          <div class=\"section\" id=\"section2\" style=\"height: 10px\"></div>\n          <style type=\"text/gss\" scoped>\n          [Wwin] == 1000;\n\n          @if [Wwin] > 960 {\n\n            .section {\n              height: == ::[intrinsic-height];\n              right: == ::window[right] - 100;\n              left: == ::window[left] + 100;\n              top:>= ::window[top];\n            }\n\n          }\n\n          @else {\n\n            .section {\n              height: == ::[intrinsic-height];\n              right: == ::window[right] - 10;\n              left: == ::window[left] + 10;\n              top:>= ::window[top];\n            }\n\n          }\n          </style>";
        return engine.once('solve', listen);
      });
    });
    describe('top level @if @else w/ nested VFLs', function() {
      return it('should compute values', function(done) {
        var listen;
        listen = function(e) {
          expect(engine.values).to.eql({
            "Wwin": 100,
            "$s1[x]": 50,
            "$s1[width]": 1,
            "$s2[width]": 1,
            "$s2[x]": 56
          });
          return done();
        };
        container.innerHTML = "          <div id=\"s1\"></div>\n          <div id=\"s2\"></div>\n          <style type=\"text/gss\" scoped>\n          [Wwin] == 100;          \n        \n          @if [Wwin] > 960 {\n                      \n            #s1[x] == 100;\n            @horizontal (#s1(==10))-(#s2(==10)) gap(100);\n\n          }\n\n          @else {\n\n            #s1[x] == 50;\n            @horizontal (#s1(==1))-(#s2(==1)) gap(5);\n\n          }\n          </style>";
        return engine.once('solve', listen);
      });
    });
    return describe('@if @else w/ dynamic VFLs', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"s1\" class=\"section\"></div>\n<div id=\"s2\" class=\"section\"></div>\n<div id=\"container\"></div>\n<style type=\"text/gss\">\n  #container {\n    width: == 100;\n  }\n  .section {\n    height: == 100;\n    width: == 100;\n    x: >= 0;\n    y: >= 0;\n  }                 \n  @if #container[width] > 960 {            \n    @vertical (.section)...;     \n  } @else {\n    @horizontal (.section)...;     \n  }\n</style>";
        return engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$container[width]": 100,
            "$s1[height]": 100,
            "$s2[height]": 100,
            "$s1[width]": 100,
            "$s2[width]": 100,
            "$s1[x]": 0,
            "$s2[x]": 100,
            "$s1[y]": 0,
            "$s2[y]": 0
          });
          return done();
        });
      });
    });
  });
  return describe("VFL", function() {
    describe('simple VFL', function() {
      return it('should compute values', function(done) {
        var listen;
        listen = function(solution) {
          expect(solution).to.eql({
            "$s1[x]": 100,
            "$s1[width]": 10,
            "$s2[width]": 10,
            "$s2[x]": 210
          });
          return done();
        };
        container.innerHTML = "  <div id=\"s1\"></div>\n  <div id=\"s2\"></div>\n  <style type=\"text/gss\">\n\n  #s1[x] == 100;\n  @horizontal (#s1(==10))-(#s2(==10)) gap(100);\n\n  </style>";
        return engine.once('solve', listen);
      });
    });
    describe('[::] VFLs', function() {
      it('should compute', function(done) {
        var listen;
        listen = function(solution) {
          expect(solution).to.eql({
            "$s1[x]": 20,
            "$container[x]": 10,
            "$s2[x]": 20,
            "$container[width]": 100,
            "$s1[width]": 80,
            "$s2[width]": 80
          });
          return done();
        };
        container.innerHTML = "          <div id=\"s1\" class=\"section\"></div>\n          <div id=\"s2\" class=\"section\"></div>\n          <div id=\"container\"></div>\n          <style type=\"text/gss\">                        \n                    \n            .section {\n              @horizontal |-(&)-| gap(10) in($ #container);\n            }\n          \n            #container {\n              x: == 10;\n              width: == 100;\n            }                        \n\n          </style>";
        return engine.once('solve', listen);
      });
      return describe('with selector', function() {
        return it('should compute', function(done) {
          engine.then(function(solution) {
            var p12;
            expect(solution).to.eql({
              "$container[x]": 10,
              "$container[width]": 100,
              "$p12[x]": 20,
              "$p13[x]": 20,
              "$p22[x]": 20,
              "$p23[x]": 20,
              "$h1[x]": 20,
              "$p12[width]": 80,
              "$p13[width]": 80,
              "$p22[width]": 80,
              "$p23[width]": 80,
              "$h1[width]": 80
            });
            p12 = engine.id('p12');
            p12.parentNode.removeChild(p12);
            return engine.then(function(solution) {
              var h1;
              expect(solution).to.eql({
                "$p12[x]": null,
                "$p12[width]": null
              });
              h1 = engine.id('h1');
              h1.parentNode.removeChild(h1);
              return engine.then(function(solution) {
                expect(solution).to.eql({
                  "$h1[x]": null,
                  "$h1[width]": null
                });
                return done();
              });
            });
          });
          return container.innerHTML = "<div id=\"s1\" class=\"section\">\n  <p id=\"p11\"><p id=\"p12\"><p id=\"p13\">\n</div>\n<div id=\"s2\" class=\"section\">\n  <p id=\"p21\"><p id=\"p22\"><p id=\"p23\">\n</div>\n<h1 id=\"h1\"></h1>\n<div id=\"container\"></div>\n<style type=\"text/gss\">                        \n          \n  .section {\n    @h |-(p + p, $ #h1)-| gap(10) in($ #container);\n  }\n\n  #container {\n    x: == 10;\n    width: == 100;\n  }\n</style>       ";
        });
      });
    });
    describe('plural selectors I', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"cont1\" class=\"cont\"></div>\n<div id=\"cont2\" class=\"cont\"></div>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>            \n<style type=\"text/gss\">                            \n  .cont {\n    width: == 100;\n    x: == 0;\n  }\n  @h |(.a)(.b)| in(.cont) {\n    &[width] == &:next[width];\n  }            \n</style>";
        return engine.once('solve', function(solution) {
          expect(solution).to.eql({
            "$cont1[width]": 100,
            "$cont2[width]": 100,
            "$cont1[x]": 0,
            "$cont2[x]": 0,
            "$a1[x]": 0,
            "$a2[x]": 0,
            "$b1[x]": 50,
            "$a1[width]": 50,
            "$b2[x]": 50,
            "$a2[width]": 50,
            "$b1[width]": 50,
            "$b2[width]": 50
          });
          return done();
        });
      });
    });
    describe('plural selectors & in(::)', function() {
      return it('should compute values', function(done) {
        container.innerHTML = "<div id=\"cont1\" class=\"cont\"></div>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>            \n<style type=\"text/gss\">                            \n  .cont {\n    width: == 100;\n    \n    @h |($ .a)($ .b)| in(::) {\n      x: >= 0;\n      &[width] == :next[width];\n    }\n  }                           \n</style>";
        return engine.once('solved', function(solution) {
          expect(solution).to.eql({
            "$cont1[width]": 100,
            "$cont1[x]": 0,
            "$a1[x]": 0,
            "$a2[x]": 0,
            "$b1[x]": 50,
            "$a1[width]": 50,
            "$b2[x]": 50,
            "$a2[width]": 50,
            "$b1[width]": 50,
            "$b2[width]": 50
          });
          return done();
        });
      });
    });
    describe('Implicit VFL', function() {
      return it('should compute', function(done) {
        engine.once('solve', function(solution) {
          expect(solution).to.eql({
            "$s1[x]": 0,
            "$s2[x]": 60,
            "$s1[width]": 50,
            "$s2[width]": 50
          });
          return done();
        });
        return container.innerHTML = "          <div id=\"s1\" class=\"implicit\"></div>\n          <div id=\"s2\" class=\"implicit\"></div>\n          <div id=\"container\"></div>\n          <style type=\"text/gss\">                                                          \n          \n            .implicit {\n              x: >= 0;\n              width: == 50;\n            }                        \n            \n            @h (.implicit)-10-...;\n\n          </style>";
      });
    });
    describe('Implicit VFL w/ containment', function() {
      return it('should compute', function(done) {
        engine.once('solve', function(e) {
          expect(engine.values).to.eql({
            "$s1[x]": 10,
            "$container[x]": 0,
            "$s2[x]": 50,
            "$container[width]": 90,
            "$s1[width]": 30,
            "$s2[width]": 30
          });
          return done();
        });
        return container.innerHTML = "          <div id=\"s1\" class=\"implicit\"></div>\n          <div id=\"s2\" class=\"implicit\"></div>\n          <div id=\"container\"></div>\n          <style type=\"text/gss\">                        \n                    \n            @h |-(.implicit)-10-...-| outer-gap(10) in(#container) {\n              &[width] == &:next[width];\n            }\n          \n            #container {\n              x: == 0;\n              width: == 90;\n            }                        \n\n          </style>";
      });
    });
    describe('order specific selectors on the left within rules', function() {
      return it('should do it', function(done) {
        container.innerHTML = "<style type=\"text/gss\">\n  article {\n    width: == 50;\n    height: == 50;\n    x: >= 0;\n  }\n  #p1[width] == 50;\n  @h (article)... {\n    (:next p)[width] == (p)[width];\n  }\n</style>\n<article id=\"article1\">\n  <p id=\"p1\"></p>\n</article>\n<article id=\"article2\">\n  <p id=\"p2\"></p>\n</article>";
        return engine.then(function(solution) {
          expect(solution['$p1[width]']).to.eql(solution['$p2[width]']);
          return done();
        });
      });
    });
    describe('order specific selectors on the right within rules', function() {
      return it('should do it', function(done) {
        container.innerHTML = "<style type=\"text/gss\">\n  article {\n    width: == 50;\n    height: == 50;\n    x: >= 0;\n  }\n  #p1[width] == 50;\n  @h (article)... {\n    (& p)[width] == (&:next p)[width];\n  }\n</style>\n<article id=\"article1\">\n  <p id=\"p1\"></p>\n</article>\n<article id=\"article2\">\n  <p id=\"p2\"></p>\n</article>";
        return engine.then(function(solution) {
          expect(solution['$p1[width]']).to.eql(solution['$p2[width]']);
          return done();
        });
      });
    });
    describe("context-specific VFL", function() {
      return it('should work', function(done) {
        container.innerHTML = "<style>\n  article *{\n    padding: 0;\n    margin: 0\n  }\n</style>\n<article id=\"article1\">\n  <div class=\"media\"></div>\n  <h2 class=\"title\" id=\"title1\"><span style=\"display:block; height: 20px; width: 10px\"></span></h2>\n  <p class=\"desc\" id=\"desc1\"><span style=\"display:block; height: 40px; width: 10px\"></span></p>\n</article>\n<article id=\"article2\">\n  <div class=\"media\"></div>\n  <h2 class=\"title\" id=\"title2\"><span style=\"display:block; height: 10px; width: 10px\"></span></h2>\n  <p class=\"desc\" id=\"desc2\"><span style=\"display:block; height: 30px; width: 10px\"></span></p>\n</article>\n\n<style type=\"text/gss\">\n  $[width] == 300;\n  $[left] == 0;\n  $[top] == 0;\n\n  @v |(article)... in($) {\n    height: >= 0;\n  }\n\n  article {\n    @v |\n        -1-\n        (.title)\n        -2-\n        (.desc)\n        -3-\n        | \n        in(&) {\n          height: == ::[intrinsic-height];\n    }\n  }\n\n</style>";
        return engine.then(function(solution) {
          var article, expectation, prop, value;
          expectation = {
            "$article1[height]": 66,
            "$article1[y]": 0,
            "$desc1[height]": 40,
            "$title1[height]": 20,
            "$title1[y]": 1,
            "$desc1[y]": 23,
            "$article2[height]": 46,
            "$article2[y]": 66,
            "$desc2[height]": 30,
            "$desc2[y]": 13 + 66,
            "$title2[height]": 10,
            "$title2[y]": 1 + 66
          };
          for (prop in expectation) {
            value = expectation[prop];
            expect(solution[prop]).to.eql(value);
          }
          article = engine.id('article1');
          engine.scope.appendChild(article);
          return engine.then(function(solution) {
            expect(solution).to.eql({
              "$title1[y]": 1 + 46,
              "$desc1[y]": 23 + 46,
              "$article2[y]": 0,
              "$article1[y]": 46,
              "$desc2[y]": 13,
              "$title2[y]": 1
            });
            article = engine.id('article2');
            engine.scope.appendChild(article);
            return engine.then(function(solution) {
              var title1;
              expect(solution).to.eql({
                "$article1[y]": 0,
                "$title1[y]": 1,
                "$desc1[y]": 23,
                "$article2[y]": 66,
                "$desc2[y]": 13 + 66,
                "$title2[y]": 1 + 66
              });
              title1 = engine.id('title1');
              title1.parentNode.removeChild(title1);
              return engine.then(function(solution) {
                expect(solution['']);
                expect(solution).to.eql({
                  "$article1[height]": 0,
                  "$article2[y]": 0,
                  "$desc1[y]": -43,
                  "$desc2[y]": 13,
                  "$title1[height]": null,
                  "$title1[intrinsic-height]": null,
                  "$title1[y]": null,
                  "$title2[y]": 1
                });
                engine.scope.innerHTML = "";
                return engine.then(function() {
                  expect(engine.values).to.eql({});
                  return done();
                });
              });
            });
          });
        });
      });
    });
    describe("new VFL input", function() {
      return it('should work', function(done) {
        container.innerHTML = "       <div id=\"boxA\" class=\"box\"></div>\n       <div id=\"boxB\" class=\"box\"></div>\n       <div id=\"box2\" class=\"box\"></div>\n       <div id=\"box3\"></div>\n       <div id=\"container\"></div>\n\n       <style type=\"text/gss\" scoped>\n         #container[width] == 300;\n         #container[left] == 0;\n         [gap] >= 0;\n\n         @h |- (.box)-10-... - (#box2) (#box3)-| gap([gap]) in(#container) {\n\n           width: == &:next[width]; // replacement for chain-width()\n          \n           top: == ::window[top]; // replacement for chain-top(::window[top])\n         }\n       </style>";
        return engine.once('solve', function(solution) {
          expect(solution).to.eql({
            "::window[y]": 0,
            "$box2[width]": 70,
            "$box2[x]": 160,
            "$box2[y]": 0,
            "$box3[width]": 70,
            "$box3[x]": 230,
            "$box3[y]": 0,
            "$boxA[width]": 70,
            "$boxA[x]": 0,
            "$boxA[y]": 0,
            "$boxB[width]": 70,
            "$boxB[x]": 80,
            "$boxB[y]": 0,
            "$container[width]": 300,
            "$container[x]": 0,
            "gap": 0
          });
          return done();
        });
      });
    });
    describe("new VFL output", function() {
      return it('should work', function(done) {
        container.innerHTML = "<div id=\"boxA\" class=\"box\"></div>\n<div id=\"boxB\" class=\"box\"></div>\n<div id=\"box2\" class=\"box\"></div>\n<div id=\"box3\"></div>\n<div id=\"container\"></div>\n\n<style type=\"text/gss\">\n  #container[width] == 300;\n  #container[left] == 0;\n  $gap >= 0;\n\n  .box, #box2, #box3 {\n    width: == :next[width];\n    top: == ::window[top];\n  }\n  \n  #container[left] + $gap == (.box:first)[left];\n   \n  .box {\n    &[right] + 10 == :next[left];\n  }\n\n  (.box:last)[right] + $gap == (#box2)[left];\n   \n  #box2[right] == #box3[left];\n  #box3[right] + $gap == #container[right];\n   \n</style>";
        return engine.once('solve', function(solution) {
          expect(solution).to.eql({
            "::window[y]": 0,
            "$box2[width]": 70,
            "$box2[x]": 160,
            "$box2[y]": 0,
            "$box3[width]": 70,
            "$box3[x]": 230,
            "$box3[y]": 0,
            "$boxA[width]": 70,
            "$boxA[x]": 0,
            "$boxA[y]": 0,
            "$boxB[width]": 70,
            "$boxB[x]": 80,
            "$boxB[y]": 0,
            "$container[width]": 300,
            "$container[x]": 0,
            "gap": 0
          });
          return done();
        });
      });
    });
    describe('[::] VFLs II', function() {
      return it('should compute', function(done) {
        engine.once('solve', function(solution) {
          expect(solution).to.eql({
            "$s1[x]": 20,
            "$container[x]": 10,
            "$s2[x]": 20,
            "$container[width]": 100,
            "$s1[width]": 80,
            "$s2[width]": 80
          });
          return done();
        });
        return container.innerHTML = "          <div id=\"s1\" class=\"section\"></div>\n          <div id=\"s2\" class=\"section\"></div>\n          <div id=\"container\"></div>\n          <style type=\"text/gss\">                        \n          \n            #container {\n              x: == 10;\n              width: == 100;\n            } \n                   \n            .section {\n              @horizontal |-(&)-| gap(10) in($ #container);\n            }                                           \n\n          </style>";
      });
    });
    describe('<points>', function() {
      return it('should compute', function(done) {
        engine.once('solve', function(solution) {
          expect(solution).to.eql({
            "$container[x]": 10,
            "$container[width]": 100,
            "right-edge": 200,
            "$s1[x]": 70,
            "$s1[width]": 120,
            "$s2[x]": 200,
            "$s2[width]": 801
          });
          return done();
        });
        return container.innerHTML = "          <div id=\"s1\"></div>\n          <div id=\"s2\"></div>\n          <div id=\"container\"></div>\n          <style type=\"text/gss\" scoped>                        \n          \n            #container {\n              x: == 10;\n              width: == 100;\n            }\n            \n            [right-edge] == 200;\n            \n            @h <#container[center-x]>-(#s1)-<[right-edge]> (#s2) < 1000 + 1 > gap(10);     \n\n          </style>";
      });
    });
    return describe('VFLs w/ missing elements', function() {
      return it('should compute', function(done) {
        container.innerHTML = "<div id=\"here\"></div>\n<div id=\"container\"></div>\n<style type=\"text/gss\">                        \n  @h |-10-(#here)-(#gone)-(#gone2)-(#gone3)-10-|\n    in(#container)\n    chain-height([but_height] !strong)\n    chain-center-y(#top-nav[center-y]) \n    !require;                                    \n</style>";
        return engine.once('solve', function(e) {
          assert(true);
          return done();
        });
      });

      /*
      .dot[width] == 2 == .dot[height];
      .dot[border-radius] == 1;
      .dot {
        background-color: hsla(190,100%,70%,.4)
      }
      @horizontal .dot-row1 gap([plan-width]-2);
      @horizontal .dot-row2 gap([plan-width]-2);
      @horizontal .dot-row3 gap([plan-width]-2);
      @horizontal .dot-row4 gap([plan-width]-2);
      @horizontal .dot-row5 gap([plan-width]-2);
      @horizontal .dot-row6 gap([plan-width]-2);
      .dot-first[center-x] == #p1[left];
      .dot-row1[center-y] == #p-r1[top];
      .dot-row2[center-y] == #p-r2[top];
      .dot-row3[center-y] == #p-r3[top];
      .dot-row4[center-y] == #p-r4[top];
      .dot-row5[center-y] == #p-r5[top];
      .dot-row6[center-y] == #p-r5[bottom];
      
      .asterisk {
        color:   hsl(190,100%,50%);
        margin-right: 9px;
      }
       */
    });
  });
});



},{}],8:[function(require,module,exports){
var Engine, assert, expect, fixtures, remove;

Engine = GSS.Engine;

assert = chai.assert;

expect = chai.expect;

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

fixtures = null;

it("fixtures", function() {
  fixtures = document.getElementById('fixtures');
  return assert(!!fixtures, "fixtures are there");
});

describe('GSS engine', function() {
  var container, engine;
  container = null;
  engine = null;
  describe('when initialized', function() {
    before(function() {
      container = document.createElement('div');
      document.getElementById('fixtures').appendChild(container);
      return engine = new GSS(container);
    });
    after(function(done) {
      remove(container);
      return done();
    });
    return it('should be bound to the DOM scope', function() {
      return expect(engine.scope).to.eql(container);
    });
  });
  describe('new GSS(url) - scopeless with web worker', function() {
    var e;
    e = null;
    it('should initialize', function() {
      return e = new GSS(true);
    });
    it('should run commands', function(done) {
      e.once('solved', function() {
        var val;
        val = e.values['x'];
        assert(val === 222, "engine has wrong [x] value: " + val);
        e.once('solved', function() {
          val = e.values['x'];
          assert(val === void 0, "engine has wrong [x] value: " + val);
          return done();
        });
        return e.solve(['remove', 'tracker']);
      });
      return e.solve([['==', ['get', 'x'], 222]], 'tracker');
    });
    return it('should destroy', function(done) {
      e.destroy();
      return done();
    });
  });
  describe('GSS() - scopeless & no web workers', function() {
    var e;
    e = null;
    it('should initialize', function() {
      return e = new GSS();
    });
    it('should run commands', function(done) {
      e.once('solved', function() {
        var val;
        val = e.values['x'];
        assert(val === 222, "engine has wrong [x] value: " + val);
        e.once('solved', function() {
          val = e.values['x'];
          assert(val === void 0, "engine has wrong [x] value: " + val);
          return done();
        });
        return e.solve(['remove', 'tracker']);
      });
      return e.solve([['==', ['get', 'x'], 222]], 'tracker');
    });
    return it('should destroy', function(done) {
      e.destroy();
      return done();
    });
  });
  describe('with rule #button1[width] == #button2[width]', function() {
    var test;
    test = function(useWorker) {
      var button1, button2;
      engine = null;
      container = null;
      button1 = null;
      button2 = null;
      return describe("useWorker: " + useWorker, function() {
        var ast;
        before(function() {
          container = document.createElement('div');
          document.getElementById('fixtures').appendChild(container);
          container.innerHTML = "<button id=\"button1\">One</button>\n<button id=\"button2\">Second</button>\n<button id=\"button3\">Three</button>\n<button id=\"button4\">4</button>";
          engine = new GSS(container, useWorker || void 0);
          return engine.compile();
        });
        after(function(done) {
          remove(container);
          engine.destroy();
          return done();
        });
        ast = [['==', ['get', ['#', 'button1'], 'width'], ['get', ['#', 'button2'], 'width']], ['==', ['get', ['#', 'button1'], 'width'], 100]];
        it('before solving the second button should be wider', function() {
          button1 = engine.id('button1');
          button2 = engine.id('button2');
          return expect(button2.getBoundingClientRect().width).to.be.above(button1.getBoundingClientRect().width);
        });
        return it('after solving the buttons should be of equal width', function(done) {
          var onSolved;
          onSolved = function(values) {
            expect(values).to.be.an('object');
            expect(values['$button1']);
            expect(Math.round(button1.getBoundingClientRect().width)).to.equal(100);
            expect(Math.round(button2.getBoundingClientRect().width)).to.equal(100);
            engine.removeEventListener('solved', onSolved);
            return done();
          };
          engine.addEventListener('solved', onSolved);
          return engine.solve(ast);
        });
      });
    };
    test(true);
    return test(false);
  });
  describe('with rule h1[line-height] == h1[font-size] == 42', function() {
    var test;
    test = function(useWorker) {
      var text1, text2;
      engine = null;
      container = null;
      text1 = null;
      text2 = null;
      return describe("useWorker: " + useWorker, function() {
        var ast;
        before(function() {
          container = document.createElement('div');
          document.getElementById('fixtures').appendChild(container);
          container.innerHTML = "<h1 id=\"text1\" style=\"line-height:12px;font-size:12px;\">One</h1>\n<h1 id=\"text2\" style=\"line-height:12px;font-size:12px;\">Two</h1>";
          return engine = new GSS(container, useWorker || void 0);
        });
        after(function(done) {
          remove(container);
          engine.destroy();
          return done();
        });
        ast = [['==', ['get', ['tag', 'h1'], 'line-height'], ['get', ['tag', 'h1'], 'font-size']], ['==', ['get', ['tag', 'h1'], 'line-height'], 42]];
        it('before solving', function() {
          text1 = container.getElementsByTagName('h1')[0];
          text2 = container.getElementsByTagName('h1')[1];
          assert(text1.style['lineHeight'] === "12px");
          assert(text2.style['lineHeight'] === "12px");
          assert(text1.style['fontSize'] === "12px");
          return assert(text2.style['fontSize'] === "12px");
        });
        return it('after solving', function(done) {
          var onSolved;
          onSolved = function(e) {
            assert(text1.style['lineHeight'] === "42px");
            assert(text2.style['lineHeight'] === "42px");
            assert(text1.style['fontSize'] === "42px");
            assert(text2.style['fontSize'] === "42px");
            assert(e.detail['$text1[line-height]'] === 42);
            assert(e.detail['$text2[line-height]'] === 42);
            assert(e.detail['$text1[font-size]'] === 42);
            assert(e.detail['$text2[font-size]'] === 42);
            container.removeEventListener('solved', onSolved);
            return done();
          };
          container.addEventListener('solved', onSolved);
          return engine.solve(ast);
        });
      });
    };
    return test(true);
  });
  describe('Before IDs exist', function() {
    var ast, button1, button2;
    engine = null;
    container = null;
    button1 = null;
    button2 = null;
    before(function() {
      container = document.createElement('div');
      document.getElementById('fixtures').appendChild(container);
      engine = new GSS(container);
      return container.innerHTML = "";
    });
    after(function(done) {
      remove(container);
      engine.destroy();
      return done();
    });
    ast = [['==', ['get', ['#', 'button2'], 'width'], 222], ['==', ['get', ['#', 'button1'], 'width'], 111]];
    it('before solving buttons dont exist', function() {
      engine.solve(ast);
      button1 = engine.id('button1');
      button2 = engine.id('button2');
      assert(!button1, "button1 doesn't exist");
      return assert(!button2, "button2 doesn't exist");
    });
    it('engine remains idle', function() {
      return assert(engine.updated === void 0);
    });
    return it('after solving the buttons should have right', function(done) {
      var onSolved;
      onSolved = function(e) {
        var w;
        w = Math.round(button1.getBoundingClientRect().width);
        assert(w === 111, "button1 width: " + w);
        w = Math.round(button2.getBoundingClientRect().width);
        assert(w === 222, "button2 width: " + w);
        container.removeEventListener('solved', onSolved);
        return done();
      };
      container.addEventListener('solved', onSolved);
      container.innerHTML = "<div>        \n  <button id=\"button2\">Second</button>\n  <button id=\"button1\">One</button>        \n</div>";
      button1 = engine.id('button1');
      return button2 = engine.id('button2');
    });
  });
  describe('Before IDs exist - advanced', function() {
    var ast;
    engine = null;
    container = null;
    before(function() {
      container = document.createElement('div');
      document.getElementById('fixtures').appendChild(container);
      engine = new GSS(container);
      return container.innerHTML = "<div id=\"w\">        \n</div>";
    });
    after(function(done) {
      remove(container);
      engine.destroy();
      return done();
    });
    ast = [['==', ["get", ["#", "b1"], "right"], ["get", ["#", "b2"], "x"]], ['==', ["get", ["#", "w"], "width"], 200], ['==', ["get", ["#", "w"], "x"], ["get", 'target']], ['==', ["get", ["#", "b2"], "right"], ["get", ["#", "w"], "right"]], ['==', ["get", ["#", "b1"], "x"], ["get", "target"]], ['==', ["get", ["#", "b1"], "width"], ["get", ["#", "b2"], "width"]], ['==', ["get", "target"], 0]];
    return it('after solving should have right size', function(done) {
      var onSolved;
      onSolved = function(e) {
        var w;
        w = Math.round(engine.id("w").getBoundingClientRect().width);
        assert(w === 200, "w width: " + w);
        w = Math.round(engine.id('b1').getBoundingClientRect().width);
        assert(w === 100, "button1 width: " + w);
        w = Math.round(engine.id('b2').getBoundingClientRect().width);
        assert(w === 100, "button2 width: " + w);
        container.removeEventListener('solved', onSolved);
        return done();
      };
      document.getElementById('w').innerHTML = "<div>        \n     <div id=\"b1\"></div>\n     <div id=\"b2\"></div>\n</div>";
      container.addEventListener('solved', onSolved);
      return engine.solve(ast);
    });
  });
  describe('Math', function() {
    before(function() {
      container = document.createElement('div');
      document.getElementById('fixtures').appendChild(container);
      return engine = new GSS(container);
    });
    after(function(done) {
      remove(container);
      return done();
    });
    return it('var == var * (num / num)', function(done) {
      var onSolved;
      onSolved = function(e) {
        expect(e.detail).to.eql({
          'y': 10,
          'x': 5,
          engine: engine
        });
        container.removeEventListener('solved', onSolved);
        return done();
      };
      container.addEventListener('solved', onSolved);
      return engine.solve([['==', ['get', 'y'], 10], ['==', ['get', 'x'], ['*', ['get', 'y'], 0.5]]]);
    });
  });
  describe('Engine::vars', function() {
    engine = null;
    container = null;
    beforeEach(function() {
      container = document.createElement('div');
      document.getElementById('fixtures').appendChild(container);
      return engine = new GSS(container);
    });
    afterEach(function(done) {
      remove(container);
      return done();
    });
    return it('engine.vars are set', function(done) {
      var onSolved;
      onSolved = function(e) {
        var values;
        values = e.detail;
        expect(values).to.eql({
          'col-width': 100,
          'row-height': 50,
          engine: engine
        });
        container.removeEventListener('solved', onSolved);
        return done();
      };
      container.addEventListener('solved', onSolved);
      return engine.solve([['==', ['get', 'col-width'], 100], ['==', ['get', 'row-height'], 50]]);
    });
  });
  describe("Display pre-computed constraint values", function() {
    engine = null;
    container = null;
    beforeEach(function() {
      container = document.createElement('div');
      container.innerHTML = "<div id=\"d1\"></div>\n<div id=\"d2\"></div>\n<div id=\"d3\"></div>";
      document.getElementById('fixtures').appendChild(container);
      return engine = new GSS(container);
    });
    afterEach(function(done) {
      remove(container);
      return done();
    });
    return it("force display on un-queried views", function() {
      var w;
      engine.solve({
        "$d1[width]": 1,
        "$d2[width]": 2,
        "$d3[width]": 3
      });
      w = Math.round(document.getElementById('d1').getBoundingClientRect().width);
      assert(w === 1, "d1 width: " + w);
      w = Math.round(document.getElementById('d2').getBoundingClientRect().width);
      assert(w === 2, "d2 width: " + w);
      w = Math.round(document.getElementById('d3').getBoundingClientRect().width);
      return assert(w === 3, "d3 width: " + w);
    });
  });
  describe('GSS Engine with styleNode', function() {
    container = null;
    engine = null;
    before(function() {
      container = document.createElement('div');
      return document.getElementById('fixtures').appendChild(container);
    });
    after(function() {
      return remove(container);
    });
    return describe('Engine::styleNode', function() {
      return it('Runs commands from sourceNode', function(done) {
        var listener;
        listener = function(e) {
          expect(engine.updated.getProblems()).to.eql([
            [
              [
                {
                  key: 'style[type*="gss"]$style1↓.box$box1'
                }, ['==', ['get', '$box1[x]'], 100]
              ]
            ], [
              [
                {
                  key: 'style[type*="gss"]$style1↓.box$box2'
                }, ['==', ['get', '$box2[x]'], 100]
              ]
            ]
          ]);
          container.removeEventListener('solved', listener);
          return done();
        };
        container.addEventListener('solved', listener);
        engine = new GSS(container);
        return container.innerHTML = "<style type=\"text/gss-ast\" scoped id=\"style1\">\n  [\"==\", [\"get\",[\".\", \"box\"],\"x\"], 100]\n</style>\n<div id=\"box1\" class=\"box\"></div>\n<div id=\"box2\" class=\"box\"></div>";
      });
    });
  });
  describe('GSS Engine Life Cycle', function() {
    container = null;
    before(function() {
      container = document.createElement('div');
      new GSS(container);
      return document.getElementById('fixtures').appendChild(container);
    });
    after(function() {
      return remove(container);
    });
    return describe('Asynchronous existentialism (one engine for life of container)', function() {
      var engine1;
      engine1 = null;
      it('without GSS rules style tag', function() {
        window.$engine = engine1 = GSS(container);
        return expect(engine1.scope).to.be.equal(container);
      });
      it('after receives GSS style tag', function(done) {
        engine1 = GSS(container);
        container.innerHTML = "<style id=\"gssa\" type=\"text/gss-ast\" scoped>\n  [\n    [\"==\", [\"get\", \"col-width-1\"], 111]\n  ]\n</style>";
        return engine1.then(function() {
          expect(engine1.values['col-width-1']).to.equal(111);
          return done();
        });
      });
      it('after modified GSS style tag', function(done) {
        var styleNode;
        engine = GSS(container);
        styleNode = engine.id('gssa');
        styleNode.textContent = "[\n    [\"==\", [\"get\", \"col-width-11\"], 1111]\n]  ";
        return engine.then(function() {
          var engine2;
          engine2 = GSS(container);
          expect(engine1).to.equal(engine2);
          expect(engine1.values['col-width-1']).to.equal(void 0);
          expect(engine1.values['col-width-11']).to.equal(1111);
          return done();
        });
      });
      it('after replaced GSS style tag', function(done) {
        var engine2;
        engine2 = GSS(container);
        container.innerHTML = "<style id=\"gssb\" type=\"text/gss-ast\" scoped>\n[\n    [\"==\", [\"get\", \"col-width-2\"], 222]\n]  \n</style>\n<div id=\"box1\" class=\"box\" data-gss-id=\"12322\"></div>";
        return engine2.then(function() {
          assert(engine1 === engine2, "engine is maintained");
          assert(engine2.values['col-width-1'] == null, "engine1.vars['col-width-1'] removed");
          expect(engine2.values['col-width-11']).to.equal(void 0);
          expect(engine2.values['col-width-2']).to.equal(222);
          return done();
        });
      });
      it('Engine after container replaced multiple GSS style tags', function(done) {
        var engine2;
        engine2 = GSS(container);
        container.innerHTML = "<style id=\"gssc\" type=\"text/gss-ast\" scoped>\n[\n   [\"==\", [\"get\", \"col-width-3\"], 333]\n]  \n</style>\n<style id=\"gssd\" type=\"text/gss-ast\" scoped>\n[\n   [\"==\", [\"get\", \"col-width-4\"], 444]\n]  \n</style>\n<div id=\"box1\" class=\"box\" data-gss-id=\"12322\"></div>";
        return engine2.then(function() {
          engine2 = GSS(container);
          expect(engine1).to.equal(engine2);
          expect(engine1.values['col-width-1']).to.equal(void 0);
          expect(engine1.values['col-width-2']).to.equal(void 0);
          expect(engine1.values['col-width-3']).to.equal(333);
          expect(engine1.values['col-width-4']).to.equal(444);
          return done();
        });
      });
      xit('Engine after container removed', function(done) {
        var wait;
        remove(container);
        wait = function() {
          expect(engine1.is_destroyed).to.equal(true);
          expect(GSS.engines.byId[GSS.getId(container)] != null).to.equal(false);
          return done();
        };
        return setTimeout(wait, 1);
      });
      return xit('new Engine after container re-added', function() {
        var engine3;
        document.getElementById('fixtures').appendChild(container);
        engine3 = GSS(container);
        return expect(engine1).to.not.equal(engine3);
      });
    });
  });
  xdescribe('Nested Engine', function() {
    var containerEngine, wrap, wrapEngine;
    container = null;
    containerEngine = null;
    wrap = null;
    wrapEngine = null;
    before(function() {
      container = document.createElement('div');
      document.getElementById('fixtures').appendChild(container);
      container.innerHTML = "<section>\n  <div id=\"wrap\" style=\"width:100px;\" data-gss-id=\"999\">\n    <style type=\"text/gss-ast\" scoped>\n    [{\n      \"type\":\"constraint\",\n      \"commands\": [\n        ['==', [\"get$\",\"width\",[\"#\",\"boo\"]], [\"number\",100]]\n      ]\n    }]\n    </style>\n    <div id=\"boo\" data-gss-id=\"boo\"></div>\n  </div>\n</section>";
      containerEngine = GSS(container);
      wrap = document.getElementById('wrap');
      return wrapEngine = GSS(wrap);
    });
    after(function() {
      return remove(container);
    });
    it('engines are attached to correct element', function() {
      expect(wrapEngine).to.not.equal(containerEngine);
      expect(wrapEngine.scope).to.equal(wrap);
      return expect(containerEngine.scope).to.equal(container);
    });
    return it('correct values', function(done) {
      var listener;
      listener = function(e) {
        expect(wrapEngine.vars).to.eql({
          "$boo[width]": 100
        });
        wrap.removeEventListener('solved', listener);
        return done();
      };
      return wrap.addEventListener('solved', listener);
    });
  });
  xdescribe('Engine Hierarchy', function() {
    var body;
    body = document.getElementsByTagName('body')[0];
    describe('root engine', function() {
      var root;
      root = null;
      it('is initialized', function() {
        root = GSS.engines.root;
        return expect(root).to.exist;
      });
      it('is root element', function() {
        return expect(root.scope).to.equal(GSS.Getter.getRootScope());
      });
      return it('gss style tags direct descendants of <body> are run in root engine', function() {
        var scope, style;
        document.body.insertAdjacentHTML('afterbegin', "<style id=\"root-styles\" type=\"text/gss-ast\" scoped>\n</style>");
        style = document.getElementById("root-styles");
        scope = GSS.get.scopeFor(style);
        expect(scope).to.equal(body);
        return remove(style);
      });
    });
    describe('nesting', function() {
      var engine1, engine2, engine3, scope1, scope2, scope3, style1, style2, style3;
      style1 = null;
      style2 = null;
      style3 = null;
      scope1 = null;
      scope2 = null;
      scope3 = null;
      engine1 = null;
      engine2 = null;
      engine3 = null;
      before(function() {
        return document.body.insertAdjacentHTML('afterbegin', "<style id=\"root-styles-1\" type=\"text/gss-ast\" scoped>\n</style>\n<section id=\"scope2\">\n  <style id=\"root-styles-2\" type=\"text/gss-ast\" scoped>\n  </style>\n  <div>\n    <div id=\"scope3\">\n      <style id=\"root-styles-3\" type=\"text/gss-ast\" scoped>\n      </style>\n    </div>\n  </div>\n</section>");
      });
      it('nested style tags have correct scope', function() {
        style1 = document.getElementById("root-styles-1");
        scope1 = GSS.get.scopeFor(style1);
        expect(scope1).to.equal(body);
        style2 = document.getElementById("root-styles-2");
        scope2 = GSS.get.scopeFor(style2);
        expect(scope2).to.equal(document.getElementById("scope2"));
        style3 = document.getElementById("root-styles-3");
        scope3 = GSS.get.scopeFor(style3);
        return expect(scope3).to.equal(document.getElementById("scope3"));
      });
      it('correct parent-child engine relationships', function() {
        engine1 = GSS({
          scope: scope1
        });
        engine2 = GSS({
          scope: scope2
        });
        engine3 = GSS({
          scope: scope3
        });
        expect(GSS.engines.root).to.equal(engine1);
        expect(engine2.parentEngine).to.equal(engine1);
        expect(engine3.parentEngine).to.equal(engine2);
        expect(engine1.childEngines.indexOf(engine2) > -1).to.be["true"];
        return expect(engine2.childEngines.indexOf(engine3) > -1).to.be["true"];
      });
      return it('parent-child engine relationships update even w/o styles', function(done) {
        remove(style1);
        remove(style2);
        remove(style3);
        remove(scope3);
        return GSS._.defer(function() {
          expect(engine3.is_destroyed).to.be["true"];
          expect(engine3.parentEngine).to.not.exist;
          expect(engine2.childEngines.indexOf(engine3)).to.equal(-1);
          remove(scope2);
          return GSS._.defer(function() {
            expect(engine2.is_destroyed).to.be["true"];
            expect(engine2.parentEngine).to.not.exist;
            expect(engine1.childEngines.indexOf(engine2)).to.equal(-1);
            return done();
          });
        });
      });
    });
    return describe('nesting round 2', function() {
      var engine1, engine2, engine3, scope1, scope2, scope3, style2, style3;
      style2 = null;
      style3 = null;
      scope1 = null;
      scope2 = null;
      scope3 = null;
      engine1 = null;
      engine2 = null;
      engine3 = null;
      before(function() {
        document.body.insertAdjacentHTML('afterbegin', "<section id=\"scope2\">\n  <style id=\"root-styles-2\" type=\"text/gss-ast\" scoped>\n  </style>\n  <div>\n    <div id=\"scope3\">\n      <style id=\"root-styles-3\" type=\"text/gss-ast\" scoped>\n      </style>\n    </div>\n  </div>\n</section>");
        style2 = document.getElementById("root-styles-2");
        scope2 = GSS.get.scopeFor(style2);
        style3 = document.getElementById("root-styles-3");
        scope3 = GSS.get.scopeFor(style3);
        engine1 = GSS.engines.root;
        engine2 = GSS({
          scope: scope2
        });
        return engine3 = GSS({
          scope: scope3
        });
      });
      after(function() {
        return remove(scope2);
      });
      it('correct parent-child engine relationships', function() {
        expect(GSS.engines.root).to.equal(engine1);
        expect(engine2.parentEngine).to.equal(engine1);
        expect(engine3.parentEngine).to.equal(engine2);
        expect(engine1.childEngines.indexOf(engine2) > -1).to.be["true"];
        return expect(engine2.childEngines.indexOf(engine3) > -1).to.be["true"];
      });
      return it('engine destruction cascades', function(done) {
        remove(scope2);
        return GSS._.defer(function() {
          expect(engine3.is_destroyed).to.be["true"];
          expect(engine3.parentEngine).to.not.exist;
          expect(engine2.childEngines.indexOf(engine3)).to.equal(-1);
          expect(engine2.is_destroyed).to.be["true"];
          expect(engine2.parentEngine).to.not.exist;
          expect(engine1.childEngines.indexOf(engine2)).to.equal(-1);
          return done();
        });
      });
    });
  });
  xdescribe('framed scopes', function() {
    var containerEngine, wrap, wrapEngine;
    container = null;
    containerEngine = null;
    wrap = null;
    wrapEngine = null;
    before(function() {
      container = document.createElement('div');
      container.id = "wrap-container";
      document.getElementById('fixtures').appendChild(container);
      container.innerHTML = "<style type=\"text/gss-ast\" scoped>\n[{\n  \"type\":\"constraint\",\n  \"commands\": [\n    ['==', [\"get$\",\"width\",[\"#\",\"wrap\"]], [\"number\",69]]\n  ]\n}]\n</style>\n<div id=\"wrap\" style=\"width:100px;\" data-gss-id=\"wrap\">\n  <style type=\"text/gss-ast\" scoped>\n  [{\n    \"type\":\"constraint\",\n    \"commands\": [\n      ['==', [\"get$\",\"width\",[\"#\",\"boo\"]], [\"get$\",\"width\",[\"$reserved\",\"scope\"]]]\n    ]\n  }]\n  </style>\n  <div id=\"boo\" data-gss-id=\"boo\"></div>\n</div>";
      containerEngine = GSS(container);
      wrap = document.getElementById('wrap');
      return wrapEngine = GSS(wrap);
    });
    after(function() {
      return remove(container);
    });
    it('engines are attached to correct element', function() {
      expect(wrapEngine).to.not.equal(containerEngine);
      expect(wrapEngine.scope).to.equal(wrap);
      return expect(containerEngine.scope).to.equal(container);
    });
    return it('scoped value is bridged downward', function(done) {
      var cListener, count, wListener;
      cListener = function(e) {
        return container.removeEventListener('solved', cListener);
      };
      container.addEventListener('solved', cListener);
      count = 0;
      wListener = function(e) {
        count++;
        if (count === 2) {
          expect(wrapEngine.vars).to.eql({
            "$boo[width]": 69,
            "$wrap[width]": 69
          });
          wrap.removeEventListener('solved', wListener);
          return done();
        }
      };
      return wrap.addEventListener('solved', wListener);
    });
  });
  return xdescribe("Engine memory management", function() {
    it("engines are destroyed", function(done) {
      return GSS._.defer(function() {
        expect(GSS.engines.length).to.equal(1);
        return done();
      });
    });
    it("views are recycled *MOSTLY*", function(done) {
      var margin_of_error;
      margin_of_error = 25 + 5;
      return GSS._.defer(function() {
        var count, key;
        count = 0;
        for (key in GSS.View.byId) {
          count++;
        }
        assert(count <= document.querySelectorAll("data-gss-id").length + margin_of_error, "views are recycled: " + count);
        return done();
      });
    });
    return it("_byIdCache is cleared *MOSTLY*", function(done) {
      var margin_of_error;
      margin_of_error = 25 + 5;
      return GSS._.defer(function() {
        var count, key;
        count = 0;
        for (key in GSS._byIdCache) {
          count++;
        }
        assert(count <= document.querySelectorAll("data-gss-id").length + margin_of_error, "views are recycled: " + count);
        return done();
      });
    });
  });
});



},{}],9:[function(require,module,exports){
var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Matrix', function() {
  var engine;
  engine = null;
  before(function() {
    var container;
    container = document.createElement('div');
    engine = new GSS(container);
    return engine.compile();
  });
  describe('dispatched by argument types', function() {
    return it('should properly recognize matrix operations', function() {
      expect(engine.intrinsic.Command(['translateX', 3])).to.be.an["instanceof"](engine.intrinsic.Matrix.Transformation1);
      expect(engine.intrinsic.Command(['translateX', 3])).to.be.an["instanceof"](engine.intrinsic.Matrix);
      expect(function() {
        return engine.intrinsic.Command(['translateX', 3, 3]);
      }).to["throw"](/Too many/);
      return expect(function() {
        return engine.intrinsic.Command(['translateX', 'a']);
      }).to["throw"](/Unexpected argument/);
    });
  });
  describe('when executed', function() {
    return it('should compute matrix', function() {
      var rotate, rotated;
      rotated = engine.intrinsic.Matrix.prototype._mat4.create();
      rotated = engine.intrinsic.Matrix.prototype._mat4.rotateZ(rotated, rotated, 180);
      rotate = ['rotateZ', 0.5];
      return expect(engine.intrinsic.Command(rotate).solve(engine.intrinsic, rotate)).to.eql(rotated);
    });
  });
  return describe('defined as a sequence of matrix operations', function() {
    return it('should group together', function() {
      var sequence;
      sequence = [['translateX', 3], ['rotateZ', 2]];
      expect(engine.intrinsic.Command(sequence)).to.be.an["instanceof"](engine.intrinsic.Matrix.prototype.Sequence);
      expect(engine.intrinsic.Command(['translateX', 3])).to.eql(sequence[0].command);
      expect(engine.intrinsic.Command(['rotateZ', 3])).to.not.eql(sequence[1].command);
      expect(engine.intrinsic.Command(['rotateZ', 3])).to.not.eql(sequence[1].command);
      expect(engine.intrinsic.Command(['rotateZ', ['translateX', 3], 3])).to.eql(sequence[1].command);
      return expect(function() {
        return engine.intrinsic.Command([1, ['rotateZ', 2]]);
      }).to["throw"](/Undefined/);
    });
  });
});



},{}],10:[function(require,module,exports){
var Engine, assert, expect, remove, stringify;

Engine = GSS.Engine;

remove = function(el) {
  return el.parentNode.removeChild(el);
};

stringify = JSON.stringify;

stringify = function(o) {
  return o;
};

expect = chai.expect;

assert = chai.assert;

describe('Perf', function() {
  this.timeout(15000);
  return ['with worker', 'without worker'].forEach(function(title, i) {
    return describe(title, function() {
      var engine, scope;
      scope = null;
      engine = null;
      beforeEach(function() {
        var fixtures;
        fixtures = document.getElementById('fixtures');
        scope = document.createElement('div');
        fixtures.appendChild(scope);
        return engine = new GSS(scope, i === 0);
      });
      afterEach(function(done) {
        remove(scope);
        engine.destroy();
        return done();
      });
      return describe('live command perfs1', function() {
        it('100 at once', function(done) {
          var innerHTML, _i;
          innerHTML = "";
          for (i = _i = 0; _i < 100; i = ++_i) {
            innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>";
          }
          scope.innerHTML = innerHTML;
          engine.once('solve', function() {
            scope.innerHTML = "";
            return engine.then(function() {
              return done();
            });
          });
          return engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', ['.', 'box'], 'x']]]);
        });
        it('100 intrinsics at once', function(done) {
          var innerHTML, _i;
          innerHTML = "";
          for (i = _i = 0; _i < 100; i = ++_i) {
            innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>";
          }
          scope.innerHTML = innerHTML;
          engine.once('solve', function() {
            scope.innerHTML = "";
            return engine.then(function() {
              return done();
            });
          });
          return engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', ['.', 'box'], 'intrinsic-width']]]);
        });
        it('100 serially', function(done) {
          var count, listener;
          scope.innerHTML = "";
          count = 1;
          scope.insertAdjacentHTML('beforeend', "<div class='box' id='gen-35346" + count + "'>One</div>");
          GSS.console.profile('100 serially');
          listener = function(e) {
            count++;
            if (count === 100) {
              engine.removeEventListener('solve', listener);
              GSS.console.profileEnd('100 serially');
              scope.innerHTML = "";
              return engine.then(function() {
                return done();
              });
            } else {
              return scope.insertAdjacentHTML('beforeend', "<div class='box' id='gen-35346" + count + "'>One</div>");
            }
          };
          engine.addEventListener('solve', listener);
          return engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', ['.', 'box'], 'x']]]);
        });
        return it('100 intrinsics serially', function(done) {
          var count, listener;
          scope.innerHTML = "";
          count = 1;
          scope.insertAdjacentHTML('beforeend', "<div class='box' id='35346" + count + "'>One</div>");
          GSS.console.profile('100 intrinsics serially');
          listener = function(e) {
            count++;
            scope.insertAdjacentHTML('beforeend', "<div class='box' id='35346" + count + "'>One</div>");
            if (count === 100) {
              engine.removeEventListener('solve', listener);
              GSS.console.profileEnd('100 intrinsics serially');
              scope.innerHTML = "";
              return engine.then(function() {
                return done();
              });
            }
          };
          engine.addEventListener('solve', listener);
          return engine.solve([['==', ['get', ['.', 'box'], 'width'], ['get', ['.', 'box'], 'intrinsic-width']]]);
        });
      });
    });
  });
});



},{}],11:[function(require,module,exports){
var DEMOS, assert, expect, remove;

DEMOS = {
  FACE_DETECTION_SECTION: "<section class=\"demo\">\n\n  <h1 class=\"title\" id=\"title\">We've already broken ground on more than 30 layout filters.</h1>\n  <h2 class=\"subtitle\">Before we invest the hard work of making each bullet-proof, we need to know this is wanted & needed, become a founding member & help us help you!</h2>\n  <img class=\"image\" src=\"image.png\">\n\n</section>\n\n<style type=\"text/gss\" scoped>\n  [md] == 72 !require;\n  [md-sub] == 8;\n  $[width] == $[intrinsic-width];\n\n\n  .demo {\n    @if $[width] < 500 {\n      .title {\n        &margin-top == [md-sub];\n      }\n    } @else {\n      .title {\n        &margin-top == [md];\n        &padding-top == ([md-sub] * 6) - 8;\n      }\n    }\n\n  }\n\n</style>\n",
  SCOPING: "<button id=\"box1\" class=\"box w-virtual\" onclick=\"\n  this.setAttribute('class', \n    'box ' + (this.className.indexOf('wo') > -1 ? 'w-virtual' : 'wo-virtual'))\">\n  <div class=\"innie\" id=\"innie1\" ></div>\n</button>\n<button id=\"box2\" class=\"box wo-virtual\" onclick=\"this.setAttribute('class', \n  'box ' + (this.className.indexOf('wo') > -1 && 'w-virtual' || 'wo-virtual'))\">\n  <div class=\"innie\" id=\"innie2\" ></div>\n</button>\n<button id=\"box3\" class=\"box w-virtual\" onclick=\"this.setAttribute('class', \n  'box ' + (this.className.indexOf('wo') > -1 && 'w-virtual' || 'wo-virtual'))\">\n  <div class=\"innie\" id=\"innie3\" ></div>\n</button>\n\n<style>\n* {\n  box-sizing: border-box;\n}\n\n.box {\n  background-color: hsl(220,50%,50%);\n}    \n.wo-virtual .innie {\n  background-color: hsl(360,100%,50%);\n}\n.w-virtual .innie {\n  background-color: hsl(180,100%,50%);\n}\n.w-virtual:after {\n  content: 'W/ SCOPED VIRTUAL';\n  font-size: 40px;\n  top: 32px;\n  left: 32px;\n  position:absolute;\n}\n.wo-virtual:after {\n  content: 'W/O VIRTUAL';\n  font-size: 40px;\n  top: 32px;\n  left: 32px;\n  position:absolute;\n}\n\n</style>\n<style type=\"text/gss\">\n\n\n$[left] == 0;\n$[top] == 0;\n$[height] == $[intrinsic-height];\n$[width] == $[intrinsic-width];\n\n.box.w-virtual {\n  @h |-(&\"zone\")-| in(&) gap(20);\n  @v |-(&\"zone\")-| in(&) gap(20);\n  @h |(& .innie)| in(&\"zone\");\n  @v |(& .innie)| in(&\"zone\");\n}\n.box.wo-virtual {\n  @h |-(& .innie)-| in(&) gap(20);\n  @v |-(& .innie)-| in(&) gap(20);\n}\n\n@v |-10-(.box)-20-... in($) {\n        \n  @h |~100~(&)~100~| in($);\n  \n  &[x] + 20 == &:next[x];\n  &[right] - 20 == &:next[right];\n  \n  height: == 300;\n  \n}\n\n</style>\n",
  GSS1: "<style scoped>\n  header {\n    background: orange;\n    height: 50px;\n  }\n\n  main {\n    background: yellow;\n    height: 100px;\n    z-index: 10;\n  }\n\n  footer {\n    background: red;\n    width: 10px;\n    height: 20px;\n  }\n\n  aside {\n    background: blue;\n    width: 100px;\n  }\n\n  ul li {\n    list-style: none;\n    background: green;\n    top: 5px;\n  }\n</style>\n<style type=\"text/gss\" scoped>\n  // plural selectors can be used as singular, a la jQ\n  [left-margin] == (main)[right];\n\n  // global condition with nested rules\n  @if (main)[top] > 50 {\n    main {\n      background: blue;\n    }\n  }\n  header {\n    ::[left] == 0;\n    // condition inside css rule\n    @if ($[intrinsic-width] > $[intrinsic-height]) {\n      ::[width] == $[intrinsic-width] / 4;\n      opacity: 0.5;\n    } @else {\n      ::[width] == $[intrinsic-width] / 2;\n      opacity: 0.75;\n    }\n  }\n  footer {\n    ::[top] == ($ main)[height]; \n    ::[height] == $[intrinsic-height] * 2;\n  }\n\n  aside {\n    ::[left] == ($ main)[right];\n    ::[height] == 100;\n    ::[top] == ($ header)[intrinsic-height] + ($ header)[intrinsic-y];\n  }\n\n  main {\n    // Bind things to scroll position\n    ::[top] == $[scroll-top];// + (header)[intrinsic-y];\n    ::[width] == ($ aside)[intrinsic-width];\n    ::[left] == ($ header)[right];\n\n    ::[height] == $[intrinsic-height] - ($ header)[intrinsic-height];\n  } \n  // Custom combinators\n  ul li !~ li {\n\n    ::[height] == 30;\n    \n    // FIXME: Regular css style is never removed (needs specificity sorting and groupping);\n    background-color: yellowgreen;\n  }\n\n  // Chains\n  ul li {\n    // justify by using variable\n    ::[width] == $[li-width];\n    :previous[right] == &[left];\n    :last[right] == $[intrinsic-width] - 16;\n    :first[left] == 0;\n  }\n</style>\n\n\n<header id=\"header\"></header>\n<main id=\"main\">\n  <ul>\n    <li id=\"li1\">1</li>\n    <li id=\"li2\">2</li>\n    <li id=\"li3\">3</li>\n  </ul>\n</main>\n<aside id=\"aside\"></aside>\n<footer id=\"footer\"></footer>",
  PROFILE_CARD: "  <style>\n    #profile-card-demo * { \n      box-sizing: border-box;\n      -webkit-box-sizing: border-box;\n      -moz-box-sizing: border-box;\n    }\n\n    #profile-card-demo {\n      background-color: hsl(3, 18%, 43%);\n    }\n\n    #profile-card-demo * {\n      -webkit-backface-visibility: hidden;\n      margin: 0px;\n      padding: 0px;\n      outline: none;\n    }\n\n    #background {\n      background-color: hsl(3, 18%, 43%);\n      position: absolute;\n      top: 0px;\n      bottom: 0px;\n      right: 0px;\n      left: 0px;\n      z-index: -1;\n      background-image: url('assets/cover.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n      opacity: .7;\n      -webkit-filter: blur(5px) contrast(.7);\n    }\n\n    #cover {\n      background-color: #ccc;\n      background-image: url('assets/cover.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n    }\n\n    #avatar {\n      background-image: url('assets/avatar.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n      border: 10px solid hsl(39, 40%, 90%);\n      box-shadow: 0 1px 1px hsla(0,0%,0%,.5);\n    }\n\n    #profile-card-demo h1 {\n      color: white;\n      text-shadow: 0 1px 1px hsla(0,0%,0%,.5);\n      font-size: 40px;\n      line-height: 1.5em;\n      font-family: \"adelle\",georgia,serif;\n      font-style: normal;\n      font-weight: 400;\n    }\n\n    #profile-card-demo button {\n      color: hsl(3, 18%, 43%);\n      background-color: hsl(39, 40%, 90%);\n      text-shadow: 0 1px hsla(3, 18%, 100%, .5);\n      font-family: \"proxima-nova-soft\",sans-serif;\n      font-style: normal;\n      font-weight: 700;\n      font-size: 14px;\n      text-transform:uppercase;\n      letter-spacing:.1em;\n      border: none;  \n    }\n\n    #profile-card-demo button.primary {\n      background-color: #e38f71;\n      color: white;\n      text-shadow: 0 -1px hsla(3, 18%, 43%, .5);\n    }\n\n    #profile-card-demo #profile-card, .card {\n      background-color: hsl(39, 40%, 90%);\n      border: 1px solid hsla(0,0%,100%,.6);\n      box-shadow: 0 5px 8px hsla(0,0%,0%,.3);  \n    }\n  </style>\n<style type=\"text/gss\" scoped>\n/* vars */\n[gap] == 20 !required;\n[flex-gap] >= [gap] * 2 !required;\n[radius] == 10 !required;\n[outer-radius] == [radius] * 2 !required;\n\n/* scope-as-window for tests */\n$[left] == 0;\n$[top] == 0;\n$[width] == $[intrinsic-width] !require;\n$[height] == $[intrinsic-height] !require;\n\n/* elements */\n#profile-card {      \n&width == $[width] - 480;            \n&height == $[height] - 480;\n&[center-x] == $[center-x];\n&[center-y] == $[center-y];        \n&border-radius == [outer-radius];\n}\n\n#avatar {\n&height == 160 !required;\n&width == ::[height];\n&border-radius == ::[height] / 2;        \n}\n\n#name {\n&height == ::[intrinsic-height] !required;\n&width == ::[intrinsic-width] !required;\n}\n\n#cover {\n&border-radius == [radius];\n}\n\nbutton {\n&width == ::[intrinsic-width] !required;\n&height == ::[intrinsic-height] !required;        \n&padding == [gap];\n&padding-top == [gap] / 2;\n&padding-bottom == [gap] / 2;\n&border-radius == [radius];\n}\n\n\n@h |~-~(#name)~-~| in(#cover) gap([gap]*2) !strong;\n\n/* landscape profile-card */\n@if #profile-card[width] >= #profile-card[height] {\n\n@v |\n    -\n    (#avatar)\n    -\n    (#name)\n    -\n   |\n  in(#cover)\n  gap([gap]) outer-gap([flex-gap]) {\n    &[center-x] == ($ #cover)[center-x];\n}\n\n@h |-10-(#cover)-10-|\n  in(#profile-card);\n\n@v |\n    -10-\n    (#cover)\n    -\n    (#follow)\n    -\n   |\n  in(#profile-card)\n  gap([gap]) !strong;\n\n#follow[center-x] == #profile-card[center-x];\n\n@h |-(#message)~-~(#follow)~-~(#following)-(#followers)-|\n  in(#profile-card)\n  gap([gap])\n  !strong {\n    :next[top] == &top;\n  }\n}\n\n/* portrait profile-card */\n@else {\n@v |\n    -\n    (#avatar)\n    -\n    (#name)\n    -\n    (#follow)\n    -\n    (#message)\n    -\n    (#following)\n    -\n    (#followers)\n    -\n   |\n  in(#cover)\n  gap([gap])\n  outer-gap([flex-gap]) !strong {\n    &[center-x] == ($ #profile-card)[center-x];\n}\n\n@h |-10-(#cover)-10-| in(#profile-card) !strong;\n@v |-10-(#cover)-10-| in(#profile-card) !strong;\n}\n\n  </style>\n  <div id=\"background\"></div>\n  <div id=\"profile-card\"></div>\n  <div id=\"cover\"></div>\n  <div id=\"avatar\"></div>\n  <h1 id=\"name\"><span>Dan Daniels</span></h1>\n  <button id=\"follow\" class=\"primary\">Follow</button>\n  <button id=\"following\">Following</button>\n  <button id=\"followers\">Followers</button>\n  <button id=\"message\">Message</button>",
  ADAPTIVE_ASPECT: "<header id=\"header\">header</header>\n\n<article id=\"article\">\n  <p>ISTANBUL — Forty-nine Turkish hostages who had been held for months in Iraq by Islamic State militants were returned to Turkey on Saturday after what Turkey said was a covert operation led by its intelligence agency.</p>\n  <p>The hostages, including diplomats and their families, had been seized in June from the Turkish Consulate in Mosul, in northern Iraq.</p>\n  <p>“The Turkish intelligence agency has followed the situation very sensitively and patiently since the beginning and, as a result, conducted a successful rescue operation,” President Recep Tayyip Erdogan said in a statement Saturday.</p>\n  <p>The details of the hostages’ release were unclear. The semiofficial Turkish news agency Anadolu reported that Turkey had not paid ransom or engaged in a military operation, but said it had used drones to track the hostages, who had been moved at least eight times during their 101 days in captivity.</p>\n  <p>Times Topic: Islamic State in Iraq and Syria (ISIS) Back and Forth, Wearily, Across the ISIS BorderSEPT. 20, 2014 The agency said that Turkish intelligence teams had tried five times to rescue the hostages, but that each attempt had been thwarted by clashes in the area where they were being held.</p>\n  <p>An employee of the Turkish Consulate in Mosul was greeted by family members. Credit Reuters One senior American official, who asked not to be named, said Saturday that Turkey had not notified the United States before securing the return of the hostages, or made a specific request for American military help in connection with their release.</p>\n  <p>“I am sharing joyful news, which as a nation we have been waiting for,” Prime Minister Ahmet Davutoglu said in Baku, Azerbaijan, where he was on an official visit.</p>\n  <p>“After intense efforts that lasted days and weeks, in the early hours, our citizens were handed over to us and we brought them back to our country,” he said.</p>\n  <p>The prime minister left Baku for the Turkish province of Urfa, where the freed hostages, who included Consul General Ozturk Yilmaz, other diplomats, children and consulate guards, had been brought from Raqqa, Syria, the de facto headquarters of the Islamic State militants.</p>\n</article>\n\n<footer id=\"footer\">footer</footer>\n\n<style>\n* {\n  box-sizing: border-box;\n  margin: 0;      \n}\nhtml {\n  background-color: hsl(0,0%,95%);\n}\narticle {\n  background-color: hsl(0,0%,99%);\n  padding: 72px;\n  -webkit-column-width: 400px;\n  overflow-x: auto;\n  font-size: 20px;\n  line-height: 30px;\n}\nheader {\n  background-color: hsl(0,0%,90%);\n  padding: 16px;\n  text-align: center;\n}\nfooter {\n  background-color: hsl(0,0%,85%);\n  padding: 16px;\n  text-align: center;\n}\np {\n  margin-bottom: 1em;\n}\n</style>\n<style type=\"text/gss\">\n// vertical article\n  \n$[left] == 0;\n$[top] == 0;\n$[height] == $[intrinsic-height];\n$[width] == $[intrinsic-width];\n$[article-gap] >= 16;\n\n@if $[intrinsic-width] < $[intrinsic-height] {\n  @h |-(article)-| gap($[article-gap]) in($) {\n    height: == &[intrinsic-height];\n    width: <= 800;        \n  }\n  @v |\n    -72-\n    (header)\n    (article)\n    (footer)\n    \n    in($);\n  \n  header, footer {\n    height: == 72;\n    @h |(&)| in($ article);\n  }\n}\n\n// horizontal article\n@else {\n  @v |-(article)-| gap($[article-gap]) in($) {\n    width: == &[intrinsic-width];\n    height: <= 600;   \n  }\n  \n  @h |\n    -16-\n    (header)\n    (footer)\n    (article)        \n    \n    in($);\n  \n  header, footer {\n    width: == 72;\n    @v |(&)| in($ article);\n  }\n}\n\n\n</style>\n"
};

DEMOS.ADAPTIVE_ASPECT_LINEAR = DEMOS.ADAPTIVE_ASPECT.replace('$[intrinsic-width] < $[intrinsic-height]', '$[width] < $[height]');

assert = chai.assert;

expect = chai.expect;

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

describe('Full page tests', function() {
  var container, engine, index, type, _i, _len, _ref, _results;
  engine = container = null;
  afterEach(function() {
    remove(container);
    return engine.destroy();
  });
  this.timeout(100000);
  _ref = ['With worker', 'Without worker'];
  _results = [];
  for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
    type = _ref[index];
    _results.push((function(type, index) {
      return describe(type, function() {
        var j, _fn, _j, _k, _len1, _len2, _ref1, _ref2, _results1;
        it('scoping', function(done) {
          container = document.createElement('div');
          container.style.height = '1000px';
          container.style.width = '1000px';
          container.style.position = 'absolute';
          container.style.overflow = 'auto';
          container.style.left = 0;
          container.style.top = 0;
          window.$engine = engine = new GSS(container, index === 0);
          document.getElementById('fixtures').appendChild(container);
          container.innerHTML = DEMOS.SCOPING;
          return engine.then(function(solution) {
            var expectation, value, _j, _len1;
            expectation = {
              "$1[height]": 1000,
              "$1[intrinsic-height]": 1000,
              "$1[intrinsic-width]": 1000,
              "$1[width]": 1000,
              "$1[x]": 0,
              "$1[y]": 0,
              "$box1'zone'[height]": 260,
              "$box1'zone'[width]": 760,
              "$box1'zone'[x]": 120,
              "$box1'zone'[y]": 30,
              "$box1[height]": 300,
              "$box1[width]": 800,
              "$box1[x]": 100,
              "$box1[y]": 10,
              "$box2[height]": 300,
              "$box2[width]": 760,
              "$box2[x]": 120,
              "$box2[y]": 330,
              '$box3"zone"[height]': 260,
              '$box3"zone"[width]': 680,
              '$box3"zone"[x]': 160,
              '$box3"zone"[y]': 670,
              "$box3[height]": 300,
              "$box3[width]": 720,
              "$box3[x]": 140,
              "$box3[y]": 650,
              "$innie1[height]": 260,
              "$innie1[width]": 760,
              "$innie1[x]": 120,
              "$innie1[y]": 30,
              "$innie2[height]": 260,
              "$innie2[width]": 720,
              "$innie2[x]": 140,
              "$innie2[y]": 350,
              "$innie3[height]": 260,
              "$innie3[width]": 680,
              "$innie3[x]": 160,
              "$innie3[y]": 670
            };
            for (value = _j = 0, _len1 = expectation.length; _j < _len1; value = ++_j) {
              expect = expectation[value];
              assert(engine.values[expect]).to.eql(value);
            }
            engine.id('box1').click();
            return engine.then(function(solution) {
              expect(solution['$box1"zone"[height]']).to.eql(null);
              expect(solution['$box1"zone"[width]']).to.eql(null);
              expect(solution['$box1"zone"[x]']).to.eql(null);
              expect(solution['$box1"zone"[y]']).to.eql(null);
              engine.id('box1').click();
              return engine.then(function(solution) {
                expect(solution['$box1"zone"[height]']).to.eql(260);
                expect(solution['$box1"zone"[width]']).to.eql(760);
                expect(solution['$box1"zone"[x]']).to.eql(120);
                expect(solution['$box1"zone"[y]']).to.eql(30);
                engine.id('box2').click();
                return engine.then(function(solution) {
                  expect(solution['$box2"zone"[height]']).to.eql(260);
                  expect(solution['$box2"zone"[width]']).to.eql(720);
                  expect(solution['$box2"zone"[x]']).to.eql(140);
                  expect(solution['$box2"zone"[y]']).to.eql(350);
                  engine.id('box2').click();
                  return engine.then(function(solution) {
                    expect(solution['$box2"zone"[height]']).to.eql(null);
                    expect(solution['$box2"zone"[width]']).to.eql(null);
                    expect(solution['$box2"zone"[x]']).to.eql(null);
                    expect(solution['$box2"zone"[y]']).to.eql(null);
                    engine.id('box3').click();
                    return engine.then(function(solution) {
                      expect(solution['$box3"zone"[height]']).to.eql(null);
                      expect(solution['$box3"zone"[width]']).to.eql(null);
                      expect(solution['$box3"zone"[x]']).to.eql(null);
                      expect(solution['$box3"zone"[y]']).to.eql(null);
                      engine.id('box3').click();
                      return engine.then(function(solution) {
                        expect(solution['$box3"zone"[height]']).to.eql(260);
                        expect(solution['$box3"zone"[width]']).to.eql(680);
                        expect(solution['$box3"zone"[x]']).to.eql(160);
                        expect(solution['$box3"zone"[y]']).to.eql(670);
                        engine.scope.innerHTML = "";
                        return engine.then(function(solution) {
                          expect(engine.values).to.eql({});
                          return done();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
        this.timeout(100000);
        it('gss1 demo', function(done) {
          container = document.createElement('div');
          container.style.height = '640px';
          container.style.width = '640px';
          container.style.position = 'absolute';
          container.style.overflow = 'auto';
          container.style.left = 0;
          container.style.top = 0;
          window.$engine = engine = new GSS(container, index === 0);
          document.getElementById('fixtures').appendChild(container);
          container.innerHTML = DEMOS.GSS1;
          return engine.then(function(solution) {
            var clone, li;
            expect(solution['li-width']).to.eql((640 - 16) / 3);
            expect(solution['$aside[x]']).to.eql(640 / 2 + 100);
            expect(solution['$header[width]']).to.eql(Math.round(640 / 2));
            li = engine.scope.querySelector('ul li:last-child');
            clone = li.cloneNode();
            clone.id = 'li4';
            clone.innerHTML = '4';
            li.parentNode.appendChild(clone);
            return engine.then(function(solution) {
              expect(Math.round(solution['li-width'])).to.eql((640 - 16) / 4);
              li = engine.scope.querySelector('ul li:first-child');
              li.parentNode.removeChild(li);
              return engine.then(function(solution) {
                expect(Math.round(solution['li-width'])).to.eql((640 - 16) / 3);
                expect(solution['$li2[x]']).to.eql(0);
                expect(solution['$li1[x]']).to.eql(null);
                engine.scope.setAttribute('style', 'width: 1024px; height: 640px');
                return engine.then(function(solution) {
                  expect(Math.round(solution['li-width'])).to.eql(Math.round((1024 - 16) / 3));
                  expect(solution['$header[width]']).to.eql(1024 / 4);
                  container.innerHTML = "";
                  return engine.then(function(solution) {
                    return done();
                  });
                });
              });
            });
          });
        });
        _ref1 = ['with intrinsic condition', 'with linear condition'];
        _fn = function(type, j) {
          return describe(type, function(done) {
            return it('should handle face detection section', function(done) {
              var html;
              container = document.createElement('div');
              container.id = 'face-demo';
              window.$engine = engine = new GSS(container, index === 0);
              document.getElementById('fixtures').appendChild(container);
              html = DEMOS.FACE_DETECTION_SECTION;
              if (j === 0) {
                html = html.replace('$[width] < 500', '$[intrinsic-width] < 500');
              }
              container.innerHTML = html;
              container.setAttribute('style', 'height: 640px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
              return engine.then(function(solution) {
                expect(solution).to.eql({
                  '$title[margin-top]': 72,
                  '$title[padding-top]': 40,
                  '$face-demo[intrinsic-width]': 640,
                  '$face-demo[width]': 640,
                  'md': 72,
                  'md-sub': 8
                });
                container.setAttribute('style', 'height: 640px; width: 400px; position: absolute; overflow: auto; left: 0; top: 0');
                return engine.then(function(solution) {
                  expect(solution['$title[margin-top]']).to.eql(8);
                  expect(solution['$title[padding-top]']).to.eql(null);
                  expect(solution['$face-demo[intrinsic-width]']).to.eql(400);
                  expect(solution['$face-demo[width]']).to.eql(400);
                  container.innerHTML = "";
                  return engine.then(function(solution) {
                    expect(solution).to.eql({
                      '$title[margin-top]': null,
                      '$face-demo[intrinsic-width]': null,
                      '$face-demo[width]': null,
                      'md': null,
                      'md-sub': null
                    });
                    return done();
                  });
                });
              });
            });
          });
        };
        for (j = _j = 0, _len1 = _ref1.length; _j < _len1; j = ++_j) {
          type = _ref1[j];
          _fn(type, j);
        }
        it('profile card', function(done) {
          container = document.createElement('div');
          container.id = 'profile-card-demo';
          window.$engine = engine = new GSS(container, index === 0);
          document.getElementById('fixtures').appendChild(container);
          container.innerHTML = DEMOS.PROFILE_CARD;
          container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0');
          return engine.then(function(solution) {
            var roughAssert;
            roughAssert = function(a, b, threshold) {
              if (threshold == null) {
                threshold = 15;
              }
              return expect(Math.abs(a - b) < threshold).to.eql(true);
            };
            roughAssert(solution['$follow[y]'], 540);
            roughAssert(solution['$follow[x]'], 329.5);
            roughAssert(solution['flex-gap'], 40);
            container.setAttribute('style', 'height: 768px; width: 1124px; position: absolute; overflow: auto; left: 0; top: 0');
            return engine.then(function(solution) {
              console.log(1, JSON.stringify(solution));
              roughAssert(solution['$follow[x]'], 435);
              roughAssert(solution['$follow[y]'], 537);
              container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0');
              return engine.then(function(solution) {
                roughAssert(solution['flex-gap'], 109);
                roughAssert(solution['$follow[y]'], 728);
                roughAssert(solution['$follow[x]'], 240);
                container.setAttribute('style', 'height: 1280px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0');
                return engine.then(function(solution) {
                  console.log(1);
                  roughAssert(solution['$follow[y]'], 668);
                  roughAssert(solution['$follow[x]'], 329.5);
                  roughAssert(solution['flex-gap'], 158);
                  container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0');
                  return engine.then(function(solution) {
                    roughAssert(solution['$follow[y]'], 540);
                    roughAssert(solution['flex-gap'], 40);
                    container.innerHTML = "";
                    return engine.then(function(solution) {
                      expect(engine.values).to.eql({});
                      return done();
                    });
                  });
                });
              });
            });
          });
        });
        _ref2 = ['with intrinsic condition', 'with linear condition'];
        _results1 = [];
        for (j = _k = 0, _len2 = _ref2.length; _k < _len2; j = ++_k) {
          type = _ref2[j];
          _results1.push((function(type, j) {
            return describe(type, function() {
              return it('Adaptive aspect', function(done) {
                container = document.createElement('div');
                container.style.height = '640px';
                container.style.width = '640px';
                container.style.position = 'absolute';
                container.style.overflow = 'auto';
                container.style.left = 0;
                container.style.top = 0;
                window.$engine = engine = new GSS(container, index === 0);
                document.getElementById('fixtures').appendChild(container);
                if (j === 0) {
                  container.innerHTML = DEMOS.ADAPTIVE_ASPECT;
                } else {
                  container.innerHTML = DEMOS.ADAPTIVE_ASPECT_LINEAR;
                }
                return engine.then(function(solution) {
                  expect(solution['$article[height]']).to.eql(600);
                  expect(solution['$article[width]']).to.eql(480);
                  expect(solution['$footer[height]']).to.eql(600);
                  expect(solution['$footer[width]']).to.eql(72);
                  expect(solution['$header[height]']).to.eql(600);
                  expect(solution['$header[width]']).to.eql(72);
                  expect(solution['article-gap']).to.eql(20);
                  container.setAttribute('style', 'height: 800px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
                  return engine.then(function(solution) {
                    expect(solution['$article[height]'] > 1400).to.eql(true);
                    expect(solution['article-gap']).to.eql(16);
                    expect(solution['$article[width]']).to.eql(608);
                    expect(solution['$footer[height]']).to.eql(72);
                    expect(solution['$footer[width]']).to.eql(608);
                    expect(solution['$header[height]']).to.eql(72);
                    expect(solution['$header[width]']).to.eql(608);
                    container.setAttribute('style', 'height: 640px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
                    return engine.then(function(solution) {
                      expect(solution['article-gap']).to.eql(20);
                      expect(solution['$article[height]']).to.eql(600);
                      expect(solution['$article[width]']).to.eql(480);
                      expect(solution['$footer[height]']).to.eql(600);
                      expect(solution['$footer[width]']).to.eql(72);
                      expect(solution['$header[height]']).to.eql(600);
                      expect(solution['$header[width]']).to.eql(72);
                      container.setAttribute('style', 'height: 800px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
                      return engine.then(function(solution) {
                        expect(solution['$article[height]'] > 1400).to.eql(true);
                        expect(solution['$article[width]']).to.eql(608);
                        expect(solution['$footer[height]']).to.eql(72);
                        expect(solution['$footer[width]']).to.eql(608);
                        expect(solution['$header[height]']).to.eql(72);
                        expect(solution['$header[width]']).to.eql(608);
                        expect(solution['article-gap']).to.eql(16);
                        container.setAttribute('style', 'height: 800px; width: 600px; position: absolute; overflow: auto; left: 0; top: 0');
                        return engine.then(function(solution) {
                          expect(solution['$article[height]'] > 1400).to.eql(true);
                          expect(solution['$article[width]']).to.eql(568);
                          expect(solution['$footer[width]']).to.eql(568);
                          expect(solution['$header[width]']).to.eql(568);
                          engine.scope.innerHTML = "";
                          return engine.then(function() {
                            expect(engine.values).to.eql({});
                            return done();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          })(type, j));
        }
        return _results1;
      });
    })(type, index));
  }
  return _results;
});



},{}],12:[function(require,module,exports){
var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Selectors', function() {
  var engine;
  engine = null;
  before(function() {
    var container;
    container = document.createElement('div');
    engine = new GSS(container);
    return engine.compile();
  });
  return describe('dispatched by argument types', function() {
    it('should create command instance for each operation', function() {
      expect(engine.document.Command(['tag', 'div'])).to.be.an["instanceof"](engine.document.Selector.Selecter);
      expect(engine.document.Command(['tag', 'div'])).to.be.an["instanceof"](engine.document.Selector);
      expect(engine.document.Command(['tag', 'div'])).to.be.an["instanceof"](engine.document.Selector);
      return expect(engine.document.Command(['tag', ['tag', 'div'], 'div'])).to.be.an["instanceof"](engine.document.Selector.Qualifier);
    });
    it('should have absolute and relative path set for each command', function() {
      expect(engine.document.Command(['tag', 'div']).path).to.eql('div');
      expect(engine.document.Command(['tag', 'h1']).key).to.eql('h1');
      expect(engine.document.Command(['tag', ['&'], 'h1']).path).to.eql('&h1');
      expect(engine.document.Command(['.', ['tag', 'p'], 'active']).path).to.eql('p.active');
      expect(engine.document.Command(['.', ['tag', 'p'], 'active']).key).to.eql('.active');
      expect(engine.document.Command(['tag', ['+', ['.', ['tag', 'p'], 'active']], 'em']).path).to.eql('p.active+em');
      return expect(engine.document.Command(['[*=]', ['+', ['.', ['tag', 'p'], 'active']], 'em', 'v']).path).to.eql('p.active+[em*="v"]');
    });
    it('should group commands by tags', function() {
      expect(engine.document.Command(['#', [' ', ['.', ['tag', ['>'], 'p'], 'active']], 'button']).selector).to.eql(' #button');
      expect(engine.document.Command(['#', [' ', ['.', ['tag', ['>'], 'p'], 'active']], 'button']).path).to.eql('>p.active #button');
      expect(engine.document.Command(['.', ['tag', 'p'], 'active']).selector).to.eql('p.active');
      expect(engine.document.Command(['.', ['tag', ['~~'], 'p'], 'active']).path).to.eql('~~p.active');
      expect(engine.document.Command(['.', ['tag', ['~~'], 'p'], 'active']).selector).to.eql('p.active');
      expect(engine.document.Command(['!~', ['.', ['tag', ['~~'], 'p'], 'active']]).selector).to.eql(void 0);
      expect(engine.document.Command(['!~', ['.', ['tag', ['~~'], 'p'], 'active']]).path).to.eql('~~p.active!~');
      expect(engine.document.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).head.command.path).to.eql('~~ p.active');
      expect(engine.document.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).tail.command.path).to.eql('~~ ');
      return expect(engine.document.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).selector).to.eql(' p.active');
    });
    return it('should group elements in comma', function() {
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).path).to.eql('p.active');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).selector).to.eql('p.active');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).tail.command.path).to.eql('p');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).head.command.path).to.eql('p.active');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['tag', 'p']]).selector).to.eql('p.active,p');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['tag', 'p']]).path).to.eql('p.active,p');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).path).to.eql('p.active,p~~');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).selector).to.eql(void 0);
      expect(engine.document.Command([',', ['.', ['~~'], 'active'], ['.', ['++'], 'active']]).selector).to.eql(void 0);
      expect(engine.document.Command([',', ['.', 'a'], ['.', [' ', ['$']], 'b']]).selector).to.eql(void 0);
      return expect(engine.document.Command([',', ['.', 'a'], ['.', ['$'], 'b']]).selector).to.eql(void 0);
    });
  });
});



},{}],13:[function(require,module,exports){
var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Signatures', function() {
  var engine;
  engine = null;
  describe('dispatched by argument types', function() {
    var PrimitiveCommand;
    PrimitiveCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['String', 'Variable'],
          right: ['Number']
        }
      ]
    }, {
      'primitive': function() {}
    });
    before(function() {
      engine = new GSS;
      engine.abstract.PrimitiveCommand = PrimitiveCommand;
      return engine.compile();
    });
    describe('with primitive', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['primitive', 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', 'test', 10])).to.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', 'test', 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['undeclared', 'test', 10])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        return expect(engine.abstract.Command(['undeclared', 'test', 'test'])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    describe('with variables', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['primitive', ['get', 'test']])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['get', 'test'], 10])).to.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['get', 'test'], 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['get', 'test'], ['get', 'test']])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        return expect(engine.abstract.Command(['undeclared', ['get', 'test'], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    return describe('with expressions', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1], 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1], ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        return expect(engine.abstract.Command(['undeclared', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
  });
  describe('dispatched with optional arguments', function() {
    var UnorderedCommand;
    UnorderedCommand = GSS.prototype.Command.extend({
      signature: [
        [
          {
            left: ['String', 'Variable'],
            right: ['Number'],
            mode: ['Number']
          }
        ]
      ]
    }, {
      'unordered': function() {}
    });
    before(function() {
      engine = new GSS;
      engine.abstract.UnorderedCommand = UnorderedCommand;
      return engine.compile();
    });
    describe('and no required arguments', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['unordered', 'test'])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 'test', 10])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 'test', 10, 20])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 10, 'test', 20])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 10, 20, 'test'])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 10, 20, 'test', 30])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        return expect(engine.abstract.Command(['unordered', 'test', 'test'])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
      });
    });
    describe('with variables', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['unordered', ['get', 'test']])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['get', 'test'], 10])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['get', 'test'], 'test'])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['get', 'test'], ['get', 'test']])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        return expect(engine.abstract.Command(['undeclared', ['get', 'test'], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    return describe('with expressions', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1]])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1], 'test'])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1], ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        return expect(engine.abstract.Command(['undeclared', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
  });
  describe('optional group with order specific type declaration', function() {
    before(function() {
      engine = new GSS;
      engine.abstract.FancyTypes = GSS.prototype.Command.extend({
        signature: [
          [
            {
              left: ['String', 'Variable'],
              right: ['Number', 'String'],
              mode: ['Number', 'Variable']
            }
          ]
        ]
      }, {
        'fancy': function() {}
      });
      return engine.compile();
    });
    return it('should respect type order', function() {
      expect(engine.abstract.Command(['fancy', 'test']).permutation).to.eql([0]);
      expect(engine.abstract.Command(['fancy', 'test', 'test']).permutation).to.eql([0, 1]);
      expect(engine.abstract.Command(['fancy', 1]).permutation).to.eql([1]);
      expect(engine.abstract.Command(['fancy', 1, 1]).permutation).to.eql([1, 2]);
      expect(engine.abstract.Command(['fancy', 1, 'a']).permutation).to.eql([1, 0]);
      expect(engine.abstract.Command(['fancy', 1, 'a', 1]).permutation).to.eql([1, 0, 2]);
      expect(engine.abstract.Command(['fancy', 'a', 1]).permutation).to.eql([0, 1]);
      return expect(engine.abstract.Command(['fancy', 'a', 1, 2]).permutation).to.eql([0, 1, 2]);
    });
  });
  describe('optional groups and mixed with optional groups', function() {
    var OptionalGroupCommand;
    OptionalGroupCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['Variable', 'String']
        }, [
          {
            a: ['String'],
            b: ['Number']
          }
        ], {
          right: ['Number']
        }, [
          {
            c: ['Number']
          }
        ]
      ]
    }, {
      'optional': function() {}
    });
    before(function() {
      engine = new GSS;
      engine.abstract.OptionalGroupCommand = OptionalGroupCommand;
      return engine.compile();
    });
    describe('and no required arguments', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['optional', 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 20])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 20, 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20, 30])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20, 30]).permutation).to.eql([0, 2, 1, 3, 4]);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20]).permutation).to.eql([0, 2, 1, 3]);
        return expect(engine.abstract.Command(['optional', 'test', 10, 20]).permutation).to.eql([0, 2, 3]);
      });
    });
    describe('with variables', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['optional', ['get', 'test']])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['get', 'test'], 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['get', 'test'], 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['get', 'test'], ['get', 'test']])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        return expect(engine.abstract.Command(['undeclared', ['get', 'test'], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    return describe('with expressions', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1], 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        return expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1], 'test', 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
      });
    });
  });
  describe('dispatched subclassed with dynamic condition', function() {
    var DynamicCommand, WrapperCommand;
    WrapperCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['DynamicCommand'],
          right: ['Number']
        }
      ]
    }, {
      'wrapper': function(a) {
        return ['wrapper', a];
      }
    });
    DynamicCommand = GSS.prototype.Command.extend({
      type: 'DynamicCommand',
      signature: []
    }, {
      'dynamic': function(a) {
        return [666];
      }
    });
    DynamicCommand.Positive = DynamicCommand.extend({
      kind: 'auto',
      condition: function(engine, operation) {
        return operation.parent[2] > 0;
      }
    });
    DynamicCommand.Negative = DynamicCommand.extend({
      kind: 'auto',
      condition: function(engine, operation) {
        return operation.parent[2] < 0;
      }
    });
    before(function() {
      engine = new GSS;
      engine.abstract.WrapperCommand = WrapperCommand;
      engine.abstract.DynamicCommand = DynamicCommand;
      return engine.compile();
    });
    return it('should dispatch command', function() {
      var cmd;
      engine.abstract.Command(cmd = ['wrapper', ['dynamic'], 0]);
      expect(cmd[1].command).to.be.an["instanceof"](DynamicCommand.dynamic);
      engine.abstract.Command(cmd = ['wrapper', ['dynamic'], +1]);
      expect(cmd[1].command).to.be.an["instanceof"](DynamicCommand.Positive);
      engine.abstract.Command(cmd = ['wrapper', ['dynamic'], -1]);
      return expect(cmd[1].command).to.be.an["instanceof"](DynamicCommand.Negative);
    });
  });
  return describe('dispatched with object as callee', function() {
    var ObjectCommand;
    ObjectCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['Variable', 'String']
        }, [
          {
            c: ['Number']
          }
        ]
      ]
    }, {
      'object': function(a, b, c) {
        return [a, b, c];
      }
    });
    before(function() {
      engine = new GSS;
      engine.abstract.ObjectCommand = ObjectCommand;
      return engine.compile();
    });
    return it('should dispatch command', function() {
      var z;
      z = {
        title: 'God Object'
      };
      expect(engine.abstract.Command([z, 1, 'v'])).to.not.be.an["instanceof"](ObjectCommand.object);
      return expect(engine.abstract.Command([z, 'v', 1])).to.be.an["instanceof"](ObjectCommand.object);
    });
  });
});



},{}],14:[function(require,module,exports){
var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Styles', function() {
  var doc, engine;
  doc = engine = null;
  before(function() {
    var property, value, _ref, _results;
    engine || (engine = new GSS(document.createElement('div')));
    engine.compile();
    doc = {};
    _ref = engine.intrinsic.properties;
    _results = [];
    for (property in _ref) {
      value = _ref[property];
      _results.push((function(property, value) {
        doc[property] = function() {
          return value.apply(engine.intrinsic, arguments);
        };
        return doc[property].initial = value.initial;
      })(property, value));
    }
    return _results;
  });
  describe('simple properties', function() {
    it('numeric property', function() {
      expect(doc['z-index'](10)).to.eql(10);
      expect(doc['z-index'](10.5)).to.eql(void 0);
      return expect(doc['z-index']('ff')).to.eql(void 0);
    });
    it('length & percentage', function() {
      expect(doc['font-size'](10)).to.eql(10);
      expect(doc['font-size'](['em', 10])).to.eql(['em', 10]);
      expect(doc['font-size'](['%', 10])).to.eql(['%', 10]);
      return expect(doc['font-size'](['s', 10])).to.eql(void 0);
    });
    return it('keywords', function() {
      expect(doc['float']('none')).to.eql('none');
      expect(doc['float']('left')).to.eql('left');
      return expect(doc['float']('reft')).to.eql(void 0);
    });
  });
  describe('shorthand with no specific order of properties', function() {
    return it('should expand properties', function() {
      expect(doc['background'](['rgb', 1, 1, 1])).to.eql(new doc['background'].initial({
        'background-color': ['rgb', 1, 1, 1]
      }));
      expect(doc['background']('no-repeat', ['hsla', 3, 2, 1, 0])).to.eql(new doc['background'].initial({
        'background-repeat': 'no-repeat',
        'background-color': ['hsla', 3, 2, 1, 0]
      }));
      expect(doc['background']('no-repeat', ['hsla', 3, 2, 1, 0], 'no-repeat')).to.eql(void 0);
      expect(doc['background']('no-repeat', ['hsla', 3, 2, 1, 0], 2, 'right')).to.eql(new doc['background'].initial({
        'background-repeat': 'no-repeat',
        'background-color': ['hsla', 3, 2, 1, 0],
        'background-position-y': 2,
        'background-position-x': 'right'
      }));
      return expect(doc['background']('top', 'right', 'padding-box', 'border-box', ['linear-gradient', ['to', 'top', 'right']])).to.eql(new doc['background'].initial({
        'background-position-y': 'top',
        'background-position-x': 'right',
        'background-origin': 'padding-box',
        'background-clip': 'border-box',
        'background-image': ['linear-gradient', ['to', 'top', 'right']]
      }));
    });
  });
  describe('unordered shorthand with multiple values', function() {
    return it('should expand each value', function() {
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent')).to.eql(new doc['background'].initial({
        0: new doc['background'].initial({
          'background-repeat': 'no-repeat'
        }),
        1: new doc['background'].initial({
          'background-repeat': 'repeat'
        }),
        'background-color': 'transparent'
      }));
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format()).to.eql('no-repeat, repeat transparent');
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format({
        "background-image-2": ['url', 'abc']
      })).to.eql('no-repeat, url(abc) repeat transparent');
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format({
        "background-repeat-2": "repeat-y"
      })).to.eql('no-repeat, repeat-y transparent');
      return expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format({
        "background-position-y-1": "top"
      })).to.eql('top no-repeat, repeat transparent');
    });
  });
  describe('ordered shorthand with multiple values', function() {
    return it('should do things', function() {
      expect(doc['box-shadow']([1, 1, 'transparent'], [2, 2, ['rgba', 1, 1, 1]])).to.eql(new doc['box-shadow'].initial({
        0: new doc['box-shadow'].initial({
          'box-shadow-offset-x': 1,
          'box-shadow-offset-y': 1,
          'box-shadow-color': 'transparent'
        }),
        1: new doc['box-shadow'].initial({
          'box-shadow-offset-x': 2,
          'box-shadow-offset-y': 2,
          'box-shadow-color': ['rgba', 1, 1, 1]
        })
      }));
      expect(doc['box-shadow']([1, 1, 'transparent'], [2, 2, ['rgba', 1, 1, 1]]).format()).to.eql('1px 1px transparent, 2px 2px rgba(1,1,1)');
      expect(doc['box-shadow']([1, 1, 'transparent'], [2, 2, ['rgba', 1, 1, 1]]).format({
        'box-shadow-offset-x-1': -1,
        'box-shadow-offset-y-2': -2
      })).to.eql('-1px 1px transparent, 2px -2px rgba(1,1,1)');
      return expect(doc['box-shadow']([1, 1, 'transparent'], [2, 2, ['rgba', 1, 1, 1]]).format({
        'box-shadow-blur-1': ['em', 1],
        'box-shadow-spread-2': ['cm', 2]
      })).to.eql('1px 1px 1em transparent, 2px 2px 0 2cm rgba(1,1,1)');
    });
  });
  describe('ordered shorthands', function() {
    return it('should validate and expand value', function() {
      expect(doc['border-top'](1, 'solid', 'transparent')).to.eql(new doc['border-top'].initial({
        'border-top-width': 1,
        'border-top-style': 'solid',
        'border-top-color': 'transparent'
      }));
      expect(doc['border-left'](1, 'solid', 'tranceparent')).to.eql(void 0);
      expect(doc['border-left'](1, 'zolid', ['rgb', 1, 1, 1])).to.eql(void 0);
      return expect(doc['border-left'](['rgb', 1, 1, 1], ['em', 2])).to.eql(new doc['border-left'].initial({
        'border-left-color': ['rgb', 1, 1, 1],
        'border-left-width': ['em', 2]
      }));
    });
  });
  describe('dimensional shorthands', function() {
    return it('should validate, pad and expand values', function() {
      expect(doc['margin'](1)).to.eql(new doc['margin'].initial({
        'margin-top': 1,
        'margin-right': 1,
        'margin-bottom': 1,
        'margin-left': 1
      }));
      expect(doc['padding'](1, ['cm', 2])).to.eql(new doc['padding'].initial({
        'padding-top': 1,
        'padding-right': ['cm', 2],
        'padding-bottom': 1,
        'padding-left': ['cm', 2]
      }));
      expect(doc['border-width'](1, ['cm', 2], ['vh', 3])).to.eql(new doc['border-width'].initial({
        'border-top-width': 1,
        'border-right-width': ['cm', 2],
        'border-bottom-width': ['vh', 3],
        'border-left-width': ['cm', 2]
      }));
      return expect(doc['border-style']('solid', 'dotted', 'double', 'ridge')).to.eql(new doc['border-style'].initial({
        'border-top-style': 'solid',
        'border-right-style': 'dotted',
        'border-bottom-style': 'double',
        'border-left-style': 'ridge'
      }));
    });
  });
  describe('corner shorthands', function() {
    return it('should validate, pad and expand values', function() {
      expect(doc['border-radius'](1)).to.eql(new doc['border-radius'].initial({
        "border-top-left-radius": 1,
        "border-top-right-radius": 1,
        "border-bottom-left-radius": 1,
        "border-bottom-right-radius": 1
      }));
      return expect(doc['border-radius'](1, 2)).to.eql(new doc['border-radius'].initial({
        "border-top-left-radius": 1,
        "border-top-right-radius": 2,
        "border-bottom-left-radius": 1,
        "border-bottom-right-radius": 2
      }));
    });
  });
  return xdescribe('transformations', function() {
    return it('should generate matrix', function() {
      engine.solve([['rotateX', ['deg', 10]], ['scaleZ', 2], ['translateY', -2]]);
      return expect(doc['transform']()).to.eql(123);
    });
  });
});



},{}],15:[function(require,module,exports){
var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Stylesheet', function() {
  var container, engine;
  engine = container = null;
  beforeEach(function() {
    container = document.createElement('div');
    document.body.appendChild(container);
    return window.$engine = engine = new GSS(container);
  });
  afterEach(function() {
    container.parentNode.removeChild(container);
    engine.destroy();
    return container = engine = null;
  });
  return describe('with static rules', function() {
    describe('in top scope', function() {
      describe('with simple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  .box {\n    width: 1px;\n  }\n</style>\n<div class=\"box\" id=\"box1\"></div>\n<div class=\"box\" id=\"box2\"></div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql([".box { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      describe('with custom selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  #box2 !+ .box {\n    width: 1px;\n  }\n</style>\n<div class=\"box\" id=\"box1\"></div>\n<div class=\"box\" id=\"box2\"></div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['[matches~="#box2!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('#box2!+.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      xdescribe('with self-referential selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .box {\n    width: 1px;\n  }\n</style>\n<div class=\"box\" id=\"box1\"></div>\n<div class=\"box\" id=\"box2\"></div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql([".box { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('#box2!+.box');
            return done();
          });
        });
      });
      describe('with multiple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .box, .zox {\n    width: 1px;\n  }\n</style>\n<div class=\"box\" id=\"box1\"></div>\n<div class=\"box\" id=\"box2\"></div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql([".box, .zox { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.box,.zox');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.box,.zox');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      return describe('with mixed selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .box, &.zox, !+ .box{\n    width: 1px;\n  }\n</style>\n<div class=\"box\" id=\"box1\"></div>\n<div class=\"box\" id=\"box2\"></div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['.box, .zox, [matches~=".box,&.zox,!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.box,&.zox,!+.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
    });
    describe('in a simple rule', function() {
      describe('with simple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  .outer {\n    .box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql([".outer .box { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer' + GSS.prototype.Command.prototype.DESCEND + '.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer' + GSS.prototype.Command.prototype.DESCEND + '.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      describe('with custom selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  .outer {\n    #box2 !+ .box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['[matches~=".outer' + GSS.prototype.Command.prototype.DESCEND + '#box2!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer' + GSS.prototype.Command.prototype.DESCEND + '#box2!+.box');
            expect(engine.id('box1').offsetWidth).to.eql;
            return done();
          });
        });
      });
      describe('with self-referential selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  #box1 {\n    &.box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(["#box1.box { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('#box1 #box1' + GSS.prototype.Command.prototype.DESCEND + '&.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql(null);
            expect(engine.id('box2').offsetWidth).to.not.eql(1);
            return done();
          });
        });
      });
      describe('with multiple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .outer {\n    .box, .zox {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql([".outer .box, .outer .zox { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer' + GSS.prototype.Command.prototype.DESCEND + '.box,.zox');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer' + GSS.prototype.Command.prototype.DESCEND + '.box,.zox');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      return describe('with mixed selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .outer {\n    .box, &.zox, !+ .box{\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['.outer .box, .outer.zox, [matches~=".outer' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
    });
    describe('in a comma separated rule', function() {
      describe('with simple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  .outer, .zouter {\n    .box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql([".outer .box, .zouter .box { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      describe('with custom selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  .outer, .zouter {\n    #box2 !+ .box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['[matches~=".outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '#box2!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '#box2!+.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql(null);
            expect(engine.id('box2').offsetWidth).to.not.eql(1);
            return done();
          });
        });
      });
      describe('with self-referential selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  #box1, .outer {\n    &.box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(["#box1.box, .outer.box { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('#box1,.outer #box1,.outer' + GSS.prototype.Command.prototype.DESCEND + '&.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql(null);
            expect(engine.id('box2').offsetWidth).to.not.eql(1);
            return done();
          });
        });
      });
      describe('with multiple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .outer, .zouter {\n    .box, .zox {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql([".outer .box, .zouter .box, .outer .zox, .zouter .zox { width: 1px; }"]);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '.box,.zox');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '.box,.zox');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      return describe('with mixed selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .outer, .zouter {\n    .box, &.zox, !+ .box{\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['.outer .box, .zouter .box, .outer.zox, .zouter.zox, [matches~=".outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer,.zouter' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
    });
    return describe('in a rule with mixed selectors', function() {
      describe('with simple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  .outer, div !+ div {\n    .box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['.outer .box, [matches~=".outer,div!+div"] .box { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,div!+div .outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      describe('with custom selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss\">\n  .outer, div !+ div {\n    #box2 !+ .box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['[matches~=".outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '#box2!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,div!+div .outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '#box2!+.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql(null);
            expect(engine.id('box2').offsetWidth).to.not.eql(1);
            return done();
          });
        });
      });
      describe('with self-referential selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  #box2, div !+ div {\n    &.box {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['#box2.box, [matches~="#box2,div!+div"].box { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('#box2,div!+div #box2,div!+div' + GSS.prototype.Command.prototype.DESCEND + '&.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('#box2,div!+div #box2,div!+div' + GSS.prototype.Command.prototype.DESCEND + '&.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      describe('with multiple selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .outer, div !+ div {\n    .box, .zox {\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['.outer .box, [matches~=".outer,div!+div"] .box, .outer .zox, [matches~=".outer,div!+div"] .zox { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,div!+div .outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '.box,.zox');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '.box,.zox');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
      return describe('with mixed selectors', function() {
        return it('should include generaeted rules', function(done) {
          container.innerHTML = "<style type=\"text/gss\" id=\"gss2\">\n  .outer, div !+ div {\n    .box, &.zox, !+ .box{\n      width: 1px;\n    }\n  }\n</style>\n<div class=\"outer\">\n  <div class=\"box\" id=\"box1\"></div>\n  <div class=\"box\" id=\"box2\"></div>\n</div>";
          return engine.then(function() {
            var rule;
            expect((function() {
              var _i, _len, _ref, _results;
              _ref = engine.stylesheets[0].sheet.cssRules;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                rule = _ref[_i];
                _results.push(rule.cssText);
              }
              return _results;
            })()).to.eql(['.outer .box, [matches~=".outer,div!+div"] .box, .outer.zox, [matches~=".outer,div!+div"].zox, [matches~=".outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box"] { width: 1px; }']);
            expect(engine.id('box1').getAttribute('matches')).to.eql('.outer,div!+div .outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box');
            expect(engine.id('box1').offsetWidth).to.eql(1);
            expect(engine.id('box2').getAttribute('matches')).to.eql('.outer,div!+div' + GSS.prototype.Command.prototype.DESCEND + '.box,&.zox,!+.box');
            expect(engine.id('box2').offsetWidth).to.eql(1);
            return done();
          });
        });
      });
    });
  });
});



},{}],16:[function(require,module,exports){
var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Cassowary Thread', function() {
  it('should instantiate', function() {
    var thread;
    return thread = new GSS;
  });
  it('[x]==7; [y]==5; [x] - [y] == [z] // z is 2', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', 'z'], ['-', ['get', 'x'], ['get', 'y']]], ['==', ['get', 'x'], 7], ['==', ['get', 'y'], 5]]);
    chai.expect(thread.values).to.eql({
      x: 7,
      y: 5,
      z: 2
    });
    return done();
  });
  it('hierarchy', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', 'x'], 100, 'strong'], ['==', ['get', 'x'], 10, 'medium'], ['==', ['get', 'x'], 1, 'weak'], ['==', ['get', 'y'], 1, 'weak'], ['==', ['get', 'y'], 10, 'medium'], ['==', ['get', 'y'], 101, 'strong']]);
    chai.expect(thread.values).to.eql({
      "x": 100,
      "y": 101
    });
    return done();
  });
  it('order of operations', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', 'w'], 100, 'required'], ['==', ['get', 'igap'], 3, 'required'], ['==', ['get', 'ogap'], 20, 'required'], ['==', ['get', 'md'], ['/', ['-', ['get', 'w'], ['*', ['get', 'ogap'], 2]], 4], 'required'], ['==', ['get', 'span3'], ['+', ['*', ['get', 'md'], 3], ['*', ['get', 'igap'], 2]], 'required']]);
    chai.expect(thread.values).to.eql({
      "w": 100,
      "igap": 3,
      "ogap": 20,
      "md": 15,
      "span3": 51
    });
    return done();
  });
  it('$12322[width] == [grid-col]; ...', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', '$12322[width]'], ['get', 'grid-col']], ['==', ['get', '$34222[width]'], ['get', 'grid-col']], ['==', 100, ['get', 'grid-col']]]);
    chai.expect(thread.values).to.eql({
      "$12322[width]": 100,
      "$34222[width]": 100,
      "grid-col": 100
    });
    return done();
  });
  it('Serial Suggests with plus expression', function(done) {
    var thread;
    thread = new GSS({
      pad: 1
    });
    thread.solve([['==', ['+', ['get', 'target-width'], ['get', 'pad']], ['get', 'actual-width']], ['==', ['get', 'target-width'], 100]]);
    chai.expect(thread.values).to.eql({
      "target-width": 100,
      "actual-width": 101,
      pad: 1
    });
    thread.solve({
      pad: 2
    });
    chai.expect(thread.updated.solution).to.eql({
      "pad": 2,
      "actual-width": 102
    });
    thread.solve({
      pad: 4
    });
    chai.expect(thread.updated.solution).to.eql({
      "pad": 4,
      "actual-width": 104
    });
    return done();
  });
  it('intrinsic mock', function(done) {
    var thread;
    thread = new GSS({
      'intrinsic-width': 999
    });
    thread.solve([['==', ['get', 'width'], 100, 'weak'], ['==', ['get', 'width'], ['get', 'intrinsic-width'], 'require']]);
    chai.expect(thread.values).to.eql({
      'intrinsic-width': 999,
      "width": 999
    });
    return done();
  });
  it('intrinsic var is immutable with suggestion', function() {
    var thread;
    thread = new GSS({
      'intrinsic-width': 100
    });
    thread.solve([['==', ['get', 'hgap'], 20, 'required'], ['==', ['get', 'width'], ['+', ['get', 'intrinsic-width'], ['get', 'hgap']], 'required'], ['==', ['get', 'width'], 20, 'strong']]);
    return chai.expect(thread.values).to.eql({
      "width": 120,
      "hgap": 20,
      'intrinsic-width': 100
    });
  });
  it('tracking & removing by get tracker', function(done) {
    var thread;
    thread = new GSS();
    thread.solve([['==', ['get', 'x'], 100, 'strong']], 'x-tracker');
    thread.solve([['==', ['get', 'x'], 10, 'weak']]);
    chai.expect(thread.values).to.eql({
      "x": 100
    });
    thread.solve(['remove', 'x-tracker']);
    chai.expect(thread.values).to.eql({
      "x": 10
    });
    return done();
  });
  describe('dom prop helpers', function() {
    it('varexp - right', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112[x]'], 10], ['==', ['get', '$112', 'right'], 100]]);
      return expect(thread.values).to.eql({
        "$112[x]": 10,
        "$112[width]": 90
      });
    });
    it('varexp - center-x', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112[x]'], 10], ['==', ['get', '$112', 'center-x'], 110]]);
      return expect(thread.values).to.eql({
        "$112[x]": 10,
        "$112[width]": 200
      });
    });
    it('varexp - bottom', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112[height]'], 10], ['==', ['get', '$112', 'bottom'], 100]]);
      return expect(thread.values).to.eql({
        "$112[height]": 10,
        "$112[y]": 90
      });
    });
    return it('varexp - center-y', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112[height]'], 100], ['==', ['get', '$112', 'center-y'], 51]]);
      return expect(thread.values).to.eql({
        "$112[height]": 100,
        "$112[y]": 1
      });
    });
  });
  return describe('Tracking', function() {
    it('tracking by path', function() {
      var thread;
      thread = new GSS(document.createElement('div'));
      thread.solve([['==', ['get', '$222[line-height]'], 1.6]]);
      thread.solve([['==', ['get', '$112[x]'], 10], ['==', ['get', '$112', 'right'], 100]], '.box');
      expect(thread.values).to.eql({
        "$222[line-height]": 1.6,
        "$112[x]": 10,
        "$112[width]": 90
      });
      thread.solve(['remove', '.box']);
      return expect(thread.updated.solution).to.eql({
        "$112[x]": null,
        "$112[width]": null
      });
    });
    return it('tracking by selector', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112[x]'], 50, 'strong']], '.box$112');
      thread.solve([['==', ['get', '$112[x]'], 1000, 'required']], '.big-box$112');
      expect(thread.updated.solution).to.eql({
        "$112[x]": 1000
      });
      thread.solve([['remove', '.big-box$112']]);
      return expect(thread.updated.solution).to.eql({
        "$112[x]": 50
      });
    });
  });
});



},{}],17:[function(require,module,exports){
var assert, expect, remove;

expect = chai.expect;

assert = chai.assert;

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

describe('Units', function() {
  var container, engine;
  engine = container = null;
  beforeEach(function() {
    container = document.createElement('div');
    document.getElementById('fixtures').appendChild(container);
    return window.$engine = engine = new GSS(container);
  });
  afterEach(function() {
    return remove(container);
  });
  describe('with conflicting constraints', function() {
    describe('without unit', function() {
      return it('should solve constraints together and resolve conflict', function(done) {
        container.innerHTML = "<style type=\"text/gss-ast\">\n  [\"rule\", [\"tag\", \"button\"], [\n    [\">=\", [\"get\", \"width\"], 50, \"weak\"],\n    [\"<=\", [\"get\", \"height\"], 120, \"strong\"],\n    [\">=\", [\"get\", \"height\"],[\"*\", [\"get\", \"width\"], 3]]\n  ]]\n</style>\n<button id=\"button1\"></button>";
        return engine.then(function(solution) {
          expect(solution).to.eql({
            '$button1[width]': 40,
            '$button1[height]': 120
          });
          return done();
        });
      });
    });
    return describe('with unit', function() {
      return it('should resolve constraints separately and ignore conflict', function(done) {
        container.innerHTML = "<style type=\"text/gss-ast\">\n  [\"rule\", [\"tag\", \"button\"], [\n    [\">=\", [\"get\", \"width\"], 50, \"weak\"],\n    [\"<=\", [\"get\", \"height\"], 120, \"strong\"],\n    [\">=\", [\"get\", \"height\"],[\"*\", [\"px\", [\"get\", \"width\"]], 3]]\n  ]]\n</style>\n<button id=\"button1\"></button>";
        return engine.then(function(solution) {
          expect(solution).to.eql({
            '$button1[width]': 50,
            '$button1[height]': 120
          });
          return done();
        });
      });
    });
  });
  describe('with non-linear expressions', function() {
    return describe('with unit', function() {
      return it('should be able to compute ratios', function(done) {
        container.innerHTML = "<style type=\"text/gss-ast\">\n  [\"rule\", [\"tag\", \"button\"], [\n    [\">=\", [\"get\", \"width\"], 50, \"weak\"],\n    [\"<=\", [\"get\", \"height\"], 100, \"strong\"],\n\n    [\">=\", [\"get\", \"ratio\"], \n      [\"/\", \n        [\"px\", [\"get\", \"width\"]], \n        [\"px\", [\"get\", \"height\"]]]\n    ]\n  ]]\n</style>\n<button id=\"button1\"></button>";
        return engine.then(function(solution) {
          expect(solution).to.eql({
            '$button1[width]': 50,
            '$button1[height]': 100,
            '$button1[ratio]': 0.5
          });
          return done();
        });
      });
    });
  });
  return describe('with dynamic units', function() {
    describe('bound to window', function() {
      return it('should be able to compute width', function(done) {
        container.innerHTML = "<style type=\"text/gss-ast\">\n  [\"rule\", [\"tag\", \"button\"], [\n    [\"==\", [\"get\", \"a\"], 50],\n    [\">=\", [\"get\", \"width\"], [\"vw\", 10]], \n    [\">=\", [\"get\", \"height\"], [\"vh\", [\"get\", \"a\"]]],\n    [\">=\", [\"get\", \"c\"], [\"vmax\", 30]]\n  ]]\n</style>\n<button id=\"button1\"></button>";
        return engine.then(function(solution) {
          var h, w;
          w = document.documentElement.clientWidth;
          h = Math.min(window.innerHeight, document.documentElement.clientHeight);
          expect(Math.round(solution['$button1[width]'])).to.eql(Math.round(w / 10));
          expect(Math.round(solution['$button1[height]'])).to.eql(Math.round(h / 2));
          expect(Math.round(solution['$button1[c]'])).to.eql(Math.round(Math.max(w, h) * 0.3));
          engine.then(function(solution) {
            expect(Math.round(solution['$button1[width]'])).to.eql(Math.round(1000 / 10));
            expect(Math.round(solution['$button1[c]'])).to.eql(Math.round(Math.max(1000, h) * 0.3));
            remove(engine.id('button1'));
            return engine.then(function(solution) {
              expect(solution['$button1[width]']).to.eql(null);
              expect(solution['$button1[height]']).to.eql(null);
              expect(solution['$button1[c]']).to.eql(null);
              expect(Object.keys(engine.intrinsic.watchers)).to.eql([]);
              return done();
            });
          });
          engine.intrinsic.properties['::window[width]'] = function() {
            return 1000;
          };
          return engine.intrinsic.set('::window', 'width', 1000);
        });
      });
    });
    return describe('bound to font-size', function() {
      return it('should be able to compute width', function(done) {
        container.innerHTML = "<style type=\"text/gss-ast\">\n  [\"rule\", [\"tag\", \"span\"], [\n    [\">=\", [\"get\", \"width\"], [\"em\", 10]], \n    [\">=\", [\"get\", \"height\"], [\"em\", [\"get\", \"c\"]]],\n    [\">=\", [\"get\", \"c\"], 2]\n  ]]\n</style>\n<div id=\"wrapper\" style=\"font-size: 20px\">\n  <span id=\"button1\"></span>\n</div>";
        return engine.then(function(solution) {
          expect(Math.round(solution['$button1[width]'])).to.eql(Math.round(200));
          expect(Math.round(solution['$button1[height]'])).to.eql(Math.round(40));
          engine.then(function(solution) {
            expect(Math.round(solution['$button1[width]'])).to.eql(Math.round(300));
            expect(Math.round(solution['$button1[height]'])).to.eql(Math.round(60));
            remove(engine.id('button1'));
            return engine.then(function(solution) {
              expect(solution['$button1[width]']).to.eql(null);
              expect(solution['$button1[height]']).to.eql(null);
              expect(solution['$button1[c]']).to.eql(null);
              expect(Object.keys(engine.intrinsic.watchers)).to.eql([]);
              return done();
            });
          });
          return engine.id('wrapper').style.fontSize = '30px';
        });
      });
    });
  });
});



},{}]},{},[1]);
