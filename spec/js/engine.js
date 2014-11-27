var $, $$, Engine, assert, expect, fixtures, remove;

Engine = GSS.Engine;

assert = chai.assert;

expect = chai.expect;

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
      $('#fixtures').appendChild(container);
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
          $('#fixtures').appendChild(container);
          container.innerHTML = "<button id=\"button1\">One</button>\n<button id=\"button2\">Second</button>\n<button id=\"button3\">Three</button>\n<button id=\"button4\">4</button>";
          engine = new GSS(container, useWorker || void 0);
          return engine.compile(true);
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
          $('#fixtures').appendChild(container);
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
      $('#fixtures').appendChild(container);
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
      $('#fixtures').appendChild(container);
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
      $('#w').innerHTML = "<div>        \n     <div id=\"b1\"></div>\n     <div id=\"b2\"></div>\n</div>";
      container.addEventListener('solved', onSolved);
      return engine.solve(ast);
    });
  });
  describe('Math', function() {
    before(function() {
      container = document.createElement('div');
      $('#fixtures').appendChild(container);
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
      $('#fixtures').appendChild(container);
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
      $('#fixtures').appendChild(container);
      return engine = new GSS(container);
    });
    afterEach(function(done) {
      remove(container);
      return done();
    });
    return it("force display on un-queried views", function() {
      var w;
      engine.positions.solve({
        "$d1[width]": 1,
        "$d2[width]": 2,
        "$d3[width]": 3
      });
      w = Math.round($('#d1').getBoundingClientRect().width);
      assert(w === 1, "d1 width: " + w);
      w = Math.round($('#d2').getBoundingClientRect().width);
      assert(w === 2, "d2 width: " + w);
      w = Math.round($('#d3').getBoundingClientRect().width);
      return assert(w === 3, "d3 width: " + w);
    });
  });
  describe('GSS Engine with styleNode', function() {
    container = null;
    engine = null;
    before(function() {
      container = document.createElement('div');
      return $('#fixtures').appendChild(container);
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
                  key: 'style[type*="text/gss"]$style1↓.box$box1'
                }, ['==', ['get', '$box1[x]'], 100]
              ]
            ], [
              [
                {
                  key: 'style[type*="text/gss"]$style1↓.box$box2'
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
      return $('#fixtures').appendChild(container);
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
        $('#fixtures').appendChild(container);
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
      $('#fixtures').appendChild(container);
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
      $('#fixtures').appendChild(container);
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
