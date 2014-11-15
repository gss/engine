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
    it('lte for class & id selectos', function(done) {
      window.$engine = engine;
      engine.solve([['<=', ['get', ['.', 'box'], 'width'], ['get', ['#', 'box1'], 'width']]], function(solution) {
        var box2;
        expect(engine.updated.getProblems()).to.eql([
          [
            [
              {
                key: '.box$box1→#box1'
              }, ['<=', ['get', '$box1[width]'], ['get', '$box1[width]']]
            ], [
              {
                key: '.box$34222→#box1'
              }, ['<=', ['get', '$34222[width]'], ['get', '$box1[width]']]
            ], [
              {
                key: '.box$35346→#box1'
              }, ['<=', ['get', '$35346[width]'], ['get', '$box1[width]']]
            ]
          ]
        ]);
        box2 = engine.id("34222");
        box2.parentNode.removeChild(box2);
        return engine.then(function(solution) {
          expect(engine.updated.getProblems()).to.eql([[['remove', '.box$34222'], ['remove', '.box$34222→#box1']], [['remove', '.box$34222→#box1']]]);
          scope.appendChild(box2);
          return engine.then(function(solution) {
            var box1;
            expect(engine.updated.getProblems()).to.eql([
              [
                [
                  {
                    key: '.box$34222→#box1'
                  }, ['<=', ['get', '$34222[width]'], ['get', '$box1[width]']]
                ]
              ]
            ]);
            box1 = engine.id("box1");
            box1.parentNode.removeChild(box1);
            return engine.then(function(solution) {
              expect(engine.updated.getProblems()).to.eql([[['remove', '.box$box1'], ['remove', '.box$box1→#box1'], ['remove', '.box$35346→#box1'], ['remove', '.box$34222→#box1']], [['remove', '.box$box1→#box1', '.box$35346→#box1', '.box$34222→#box1']]]);
              scope.appendChild(box1);
              return engine.then(function(solution) {
                expect(engine.updated.getProblems()).to.eql([
                  [
                    [
                      {
                        key: '.box$35346→#box1'
                      }, ['<=', ['get', '$35346[width]'], ['get', '$box1[width]']]
                    ], [
                      {
                        key: '.box$34222→#box1'
                      }, ['<=', ['get', '$34222[width]'], ['get', '$box1[width]']]
                    ], [
                      {
                        key: '.box$box1→#box1'
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
                  '::window[width]': window.innerWidth
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
                '::window[height]': window.innerHeight
              }
            }, ['>=', ['get', 'hhh'], ['get', '::window[height]']]
          ]
        ], [
          [
            {
              key: '',
              values: {
                '::window[height]': window.innerHeight
              }
            }, ['>=', ['get', 'hah'], ['get', '::window[height]']]
          ]
        ], [
          [
            {
              key: '',
              values: {
                '::window[width]': window.innerWidth
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
                    key: ".box$box1→#box1",
                    values: {
                      "$box1[intrinsic-width]": 1110
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1",
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
                    key: ".box$box1→#box1",
                    values: {
                      "$box1[intrinsic-width]": 111
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1",
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
                    key: ".box$box1→#box1",
                    values: {
                      "$box1[intrinsic-width]": 111
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1",
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
                    key: ".box$box1→#box1",
                    values: {
                      "$box1[intrinsic-width]": 0
                    }
                  }, ["==", ["get", "$box1[height]"], ["get", "$box1[intrinsic-width]"]]
                ]
              ], [
                [
                  {
                    key: ".box$box2→#box1",
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
        engine.solve([['==', ['get', 'hgap'], 20], ['==', ['get', ['#', 'thing1'], 'width'], 100], ['rule', ['.', 'thing'], ['==', ['get', ['&'], 'width'], ['+', ['get', [':previous', ['&']], 'width'], ['*', ['get', 'hgap'], 2]]]]]);
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
