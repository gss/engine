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
  var engine, scope;
  this.timeout(15000);
  scope = null;
  engine = null;
  beforeEach(function() {
    var fixtures;
    fixtures = document.getElementById('fixtures');
    scope = document.createElement('div');
    fixtures.appendChild(scope);
    return engine = new GSS(scope, true);
  });
  afterEach(function(done) {
    remove(scope);
    engine.destroy();
    return done();
  });
  return describe('live command perfs1', function() {
    it('100 at once', function(done) {
      var i, innerHTML, _i;
      innerHTML = "";
      for (i = _i = 0; _i < 100; i = ++_i) {
        innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>";
      }
      scope.innerHTML = innerHTML;
      engine.once('solve', function() {
        scope.innerHTML = "";
        return engine.then(function() {
          debugger;
          return done();
        });
      });
      return engine.solve([['==', ['get', ['$class', 'box'], 'width', 'perf-test-1'], ['get', ['$class', 'box'], 'x']]]);
    });
    it('100 intrinsics at once', function(done) {
      var i, innerHTML, _i;
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
      return engine.solve([['==', ['get', ['$class', 'box'], 'width'], ['get', ['$class', 'box'], 'intrinsic-width']]]);
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
      return engine.solve([['==', ['get', ['$class', 'box'], 'width'], ['get', ['$class', 'box'], 'x']]]);
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
      return engine.solve([['==', ['get', ['$class', 'box'], 'width'], ['get', ['$class', 'box'], 'intrinsic-width']]]);
    });
  });
});
