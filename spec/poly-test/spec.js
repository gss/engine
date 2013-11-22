describe("Polymer: poly-test", function() {
  describe('Constraining Custom Element Root', function() {
    var ast, container, engine, target1, target2;
    engine = null;
    container = null;
    target1 = null;
    target2 = null;
    before(function() {
      var fixtures;
      fixtures = document.getElementById('fixtures');
      container = document.createElement('div');
      fixtures.appendChild(container);
      engine = GSS({
        scope: container
      });
      return container.innerHTML = "<poly-test style=\"width:10px\">\n  <poly-test style=\"width:10px\"></poly-test>\n</poly-test>        ";
    });
    after(function(done) {
      remove(container);
      engine.destroy();
      return done();
    });
    ast = {
      selectors: ['#text'],
      commands: [['var', 'poly-test[width]', 'width', ['$tag', 'poly-test']], ['eq', ['get', 'poly-test[width]'], ['number', 88]]]
    };
    it('before solving', function() {
      var q;
      q = document.getElementsByTagName('poly-test');
      target1 = q[0];
      target2 = q[1];
      assert(target1.style['width'] === "10px");
      return assert(target2.style['width'] === "10px");
    });
    return it('after solving', function(done) {
      var onSolved;
      onSolved = function(e) {
        var values;
        values = e.detail.values;
        assert(target1.style['width'] === "88px", "width should be 88px");
        assert(target2.style['width'] === "88px", "width should be 88px");
        container.removeEventListener('solved', onSolved);
        return done();
      };
      container.addEventListener('solved', onSolved);
      return engine.run(ast);
    });
  });
  return describe('Constraining Element & its LightDOM ', function() {
    var ast, container, engine, target1, target2, target3, target4;
    engine = null;
    container = null;
    target1 = null;
    target2 = null;
    target3 = null;
    target4 = null;
    before(function() {
      var fixtures;
      fixtures = document.getElementById('fixtures');
      container = document.createElement('div');
      fixtures.appendChild(container);
      engine = GSS({
        scope: container
      });
      return container.innerHTML = "<poly-test>\n  <poly-test></poly-test>\n</poly-test>";
    });
    after(function(done) {
      remove(container);
      engine.destroy();
      return done();
    });
    ast = {
      selectors: ['#text'],
      commands: [['var', '.poly-test-child[width]', 'width', ['$tag', '.poly-test-child']], ['eq', ['get', '.poly-test-child[width]'], ['number', 88]]]
    };
    it('before solving', function(done) {
      var tag, whenReady;
      tag = document.querySelector('poly-test');
      whenReady = function() {
        setTimeout(function() {
          var q;
          q = document.getElementsByClassName('poly-test-child');
          target1 = q[0];
          target2 = q[1];
          target3 = q[2];
          target4 = q[3];
          assert(!!target1, "target1");
          assert(!!target2, "target2");
          assert(!!target3, "target3");
          assert(!!target4, "target4");
          return done();
        }, 100);
        return tag.removeEventListener("bangbang", whenReady);
      };
      return tag.addEventListener("bangbang", whenReady);
    });
    return it('after solving', function(done) {
      var onSolved;
      onSolved = function(e) {
        var values;
        values = e.detail.values;
        assert(target1.style['width'] === "88px", "width should be 88px");
        assert(target2.style['width'] === "88px", "width should be 88px");
        assert(target3.style['width'] === "88px", "width should be 88px");
        assert(target4.style['width'] === "88px", "width should be 88px");
        container.removeEventListener('solved', onSolved);
        return done();
      };
      container.addEventListener('solved', onSolved);
      return engine.run(ast);
    });
  });
});
