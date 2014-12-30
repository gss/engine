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
