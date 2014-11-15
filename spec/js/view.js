var $, $$, assert, expect, remove;

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

describe("GSS.View", function() {
  var container, engine;
  engine = null;
  container = null;
  beforeEach(function() {
    container = document.createElement('div');
    engine = new GSS(container);
    return $('#fixtures').appendChild(container);
  });
  afterEach(function() {
    remove(container);
    return engine.destroy();
  });
  describe('Display Pass percolates downward through unconstrained views', function() {
    return it('before & after', function(done) {
      var onSolved, target1, target2;
      onSolved = function(e) {
        var values;
        values = e.detail.values;
        assert(target1.style['width'] === "88px", "width should be 88px");
        assert(target2.style['width'] === "88px", "width should be 88px");
        container.removeEventListener('solved', onSolved);
        return done();
      };
      container.addEventListener('solved', onSolved);
      engine.solve([['==', ['get', ['.', 'target'], 'width'], 88]]);
      container.innerHTML = "<div>\n  <div>\n    <div style=\"width:10px;\" class=\"target\">\n      <div>\n        <div>\n          <div style=\"width:10px;\" class=\"target\">\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>        ";
      target1 = engine["class"]('target')[0];
      target2 = engine["class"]('target')[1];
      assert(target1.style['width'] === "10px");
      return assert(target2.style['width'] === "10px");
    });
  });
  describe('Display passes down translated offsets', function() {
    return it('matrix3d & view:attach event', function(done) {
      var ast, onSolved, q, target1, target2;
      container.innerHTML = "<div id=\"target1\" class=\"target\">\n  <div id=\"target2\" class=\"target\">\n  </div>\n</div>  ";
      ast = [['==', ['get', ['.', 'target'], 'y'], 100]];
      q = document.getElementsByClassName('target');
      target1 = q[0];
      target2 = q[1];
      onSolved = function(values) {
        assert(values['$target1[y]'] === 100, "solved value is 100. ");
        assert(values['$target2[y]'] === 100, "solved value is 0. ");
        assert(target1.style.top === '100px');
        assert(target2.style.top === '0px');
        return done();
      };
      engine.once('solved', onSolved);
      return engine.solve(ast);
    });
  });
  describe('Elements can be positioned relative to', function() {
    return it('after solving', function(done) {
      var ast;
      container.style.position = 'relative';
      ast = ['==', ['get', ['#', 'floater'], 'y'], ['+', ['get', ['#', 'anchor'], 'intrinsic-y'], 3]];
      engine.once('solved', function() {
        expect(engine.values['$floater[y]']).to.eql(20);
        engine.id('pusher').setAttribute('style', 'padding-top: 11px; height: 17px;');
        return engine.once('solved', function() {
          expect(engine.values['$floater[y]']).to.eql(31);
          return done();
        });
      });
      engine.solve(ast);
      return container.innerHTML = "<div id=\"pusher\" style=\"height: 17px\"></div>\n<div id=\"anchor\" style=\"height: 10px\"></div>\n<div id=\"floater\"></div>";
    });
  });
  describe('Display Pass takes in account parent offsets when requested', function() {
    return it('after solving', function(done) {
      var onSolved, q, target1;
      engine.solve([['==', ['get', ['.', 'target'], 'y'], 100]]);
      container.innerHTML = "<div style=\"border: 1px solid black;top:1px; position:absolute;\">\n  <div style=\"border: 1px solid black;top:1px; position:absolute;\">\n    <div style=\"border: 1px solid black;top:1px; position:absolute;\">\n      <div style=\"border: 1px solid black;top:1px; position:absolute;\">\n        <div id=\"target1\" class=\"target\">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>        ";
      q = document.getElementsByClassName('target');
      target1 = q[0];
      onSolved = function(e) {
        assert(engine.values['$target1[y]'] === 100, "solved value is 100.");
        assert(target1.offsetTop === 92, "Top offset should match");
        assert(target1.offsetLeft === 0, "Left offset should match");
        return done();
      };
      return engine.once('solved', onSolved);
    });
  });
  return xdescribe('printCss', function() {
    return it('prints css', function(done) {
      var didAttach, q, target1, target2;
      container.innerHTML = "<style type=\"text/gss\">\n  .target[y] == 100;\n  .target[margin-right] == 55;\n  .target {\n    height: 33px;\n    height: == ::[intrinsic-height];\n  }\n</style>\n<div id=\"ignore1\">\n  <div id=\"target1\" class=\"target\">\n    <div id=\"ignore2\"> \n      <div id=\"target2\" class=\"target\">\n      </div>\n    </div>\n  </div>  \n</div>";
      q = document.getElementsByClassName('target');
      target1 = q[0];
      target2 = q[1];
      GSS.config.defaultMatrixType = 'mat4';
      didAttach = false;
      return engine.once('display', function(values) {
        var css1, css2, cssRoot, expectedCss1, expectedCss2, m1, m2;
        css1 = target1.gssView.printCss();
        css2 = target2.gssView.printCss();
        cssRoot = GSS.printCss();
        m1 = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 100, 0, 1)";
        m2 = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";
        expectedCss1 = "#target1{position:absolute;margin:0px;top:0px;left:0px;" + (GSS._.dasherize(GSS._.transformPrefix)) + ":" + m1 + ";margin-right:55px;}";
        expectedCss2 = "#target2{position:absolute;margin:0px;top:0px;left:0px;" + (GSS._.dasherize(GSS._.transformPrefix)) + ":" + m2 + ";margin-right:55px;}";
        assert(css1 === expectedCss1, "wrong css1 " + css1);
        assert(css2 === expectedCss2, "wrong css2 " + css2);
        assert(cssRoot === (expectedCss1 + expectedCss2), "wrong cssRoot, " + cssRoot);
        return done();
      });
    });
  });
});
