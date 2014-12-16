var $, $$, assert, expect, remove, stringify;

assert = chai.assert;

expect = chai.expect;

stringify = function(o) {
  return o;
  return JSON.stringify(o, 1, 1);
};

$ = function() {
  return document.querySelector.apply(document, arguments);
};

$$ = function() {
  return document.querySelectorAll.apply(document, arguments);
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
    $('#fixtures').appendChild(container);
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
    return describe('conditional', function() {
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
              expect(getSource(engine.tag('style')[1])).to.equal("[matches~=\".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2\"]{width:100px;}\n.outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5; height: 200px}");
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
      return it('should deliver', function() {
        container = document.createElement('div');
        container.style.left = 0;
        container.style.top = 0;
        container.style.position = 'absolute';
        window.$engine = engine = new GSS(container);
        document.body.appendChild(container);
        container.innerHTML = "<article id=\"article1\">\n  <section id=\"section11\">\n    <p id=\"p111\"></p>\n    <p id=\"p112\"></p>\n  </section>\n  <section id=\"section12\">\n    <p id=\"p121\"></p>\n    <p id=\"p122\"></p>\n  </section>\n</article>\n<article id=\"article2\">\n  <section id=\"section21\">\n    <p id=\"p211\"></p>\n    <p id=\"p212\"></p>\n  </section>\n  <section id=\"section22\">\n    <p id=\"p221\"></p>\n    <p id=\"p222\"></p>\n  </section>\n</article>\n\n<style type=\"text/gss\">\n  p {\n    height: == 50;\n    width: == 50;\n  }\n\n  article {\n    @h |(& section)-...| in(::);\n\n    section {\n      @h |(& p)...| in(::);\n    }\n  }\n</style>";
        return engine.then(function() {
          return 1;
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
                "$b1[z-index]": 3
              }));
              return done();
            });
            return container.innerHTML = "<style>\n  #a1 {\n    position: relative;\n    z-index: 2;\n  }\n</style>\n<style type=\"text/gss\"> \n  #b1[z-index] == #a1[intrinsic-z-index] + 1;\n</style>\n<div class=\"a\" id=\"a1\"></div>\n<div class=\"b\" id=\"b1\"></div>";
          });
          return it('should use inline value', function(done) {
            engine.once('solve', function(e) {
              expect(stringify(engine.values)).to.eql(stringify({
                "$b1[z-index]": 3
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
                "$b1[border-left-width]": -2
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
          GSS.console.log(1);
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
            GSS.console.log(1);
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
                GSS.console.log(1);
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
    xdescribe('complex selectors', function() {
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
          w = window.innerWidth;
          cx = w / 2;
          h = window.innerHeight;
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
          w = window.innerWidth;
          h = window.innerHeight;
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
        var listen;
        listen = function(e) {
          expect(engine.values).to.eql({
            "external-file": 1000
          });
          return done();
        };
        engine.once('solve', listen);
        return container.innerHTML = "<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file.gss\" scoped></link>";
      });
    });
    return describe("multiple files", function() {
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
            engine.removeEventListener('solve', listen);
            return done();
          }
        };
        engine.addEventListener('solve', listen);
        return container.innerHTML = "<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file.gss\" scoped></link>\n<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file-2.gss\" scoped></link>\n<link rel=\"stylesheet\" type=\"text/gss\" href=\"./fixtures/external-file-3.gss\" scoped></link>";
      });
    });
  });
  describe('Virtual Elements', function() {
    describe('basic', function() {
      engine = null;
      it('in scoped stylesheet', function(done) {
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
      it('in regular stylesheet', function(done) {
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
      container.innerHTML = "\n    <div id=\"box\" class=\"box foo\" onclick=\"this.setAttribute('class', this.className.indexOf('bar') > -1 ? 'box foo' : 'box bar')\"></div>\n\n    <style type=\"text/gss\">\n      [col-gap] == 16;\n      $[size] == $[intrinsic-size];\n      $[left] == 0;\n    \n      @h |($\"col-1...8\")-[col-gap]-...| in($) !require {\n        width: == $[col-width] !require;\n      }\n      \n      .box {          \n        @v |(&)| in(::window);\n        &.bar {\n          @h |(&)| in($\"col-6\");\n        }\n        &.foo {\n          @h |(&)| in($\"col-3\");\n        }\n      }\n    </style>\n    ";
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
    describe('grid-template', function() {
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
              #layout {
                x: == 0;
                y: == 0;
                width: == 100;
                height: == 10;
                @grid-rows "r1 r2";
                @grid-cols "c1-c2" gap(10);
                #item {
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
        debugger;
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
            '$section1[width]': window.innerWidth - 200,
            '$section1[x]': 100,
            '$section1[y]': 0,
            '$section2[height]': 10,
            '$section2[intrinsic-height]': 10,
            '$section2[width]': window.innerWidth - 200,
            '$section2[x]': 100,
            '$section2[y]': 0,
            '::window[width]': window.innerWidth,
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
            debugger;
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
        container.innerHTML = "<div id=\"cont1\" class=\"cont\"></div>\n<div id=\"a1\" class=\"a\"></div>\n<div id=\"a2\" class=\"a\"></div>\n<div id=\"b1\" class=\"b\"></div>\n<div id=\"b2\" class=\"b\"></div>            \n<style type=\"text/gss\">                            \n  .cont {\n    width: == 100;\n    \n    @h |($ .a)($ .b)| in(::) {\n      &[width] == :next[width];\n    }\n  }                           \n</style>";
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
          GSS.console.log(JSON.stringify(engine.vars));
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
        container.innerHTML = "<style type=\"text/gss\">\n  article {\n    width: == 50;\n    height: == 50;\n    x: >= 0;\n  }\n  #p1[width] == 50;\n  @h (article)... {\n    (& p)[width] == (&:next p)[width];\n  }\n</style>\n<article id=\"article1\">\n  <p id=\"p1\"></p>\n</article>\n<article id=\"article1\">\n  <p id=\"p2\"></p>\n</article>";
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
        GSS.console.profile(1);
        return engine.once('solve', function(solution) {
          GSS.console.profileEnd(1);
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
