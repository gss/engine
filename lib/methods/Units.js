var Units;

Units = (function() {
  function Units() {}

  Units.prototype.px = function(value) {
    return value;
  };

  Units.prototype.pt = function(value) {
    return value;
  };

  Units.prototype.cm = function(value) {
    return this['*'](value, 37.8);
  };

  Units.prototype.mm = function(value) {
    return this['*'](value, 3.78);
  };

  Units.prototype["in"] = function(value) {
    return this['*'](value, 96);
  };

  Units.prototype.deg = function(value) {
    return this['*'](value, Math.PI / 180);
  };

  Units.prototype.grad = function(value) {
    return this.deg(this['/'](value, 360 / 400));
  };

  Units.prototype.turn = function(value) {
    return this.deg(this['*'](value, 360));
  };

  Units.prototype.rad = function(value) {
    return value;
  };

  Units.prototype.em = {
    command: function(operation, continuation, scope, meta, value) {
      return this['*'](this.get(scope, 'font-size', continuation), value);
    }
  };

  Units.prototype.rem = {
    command: function(operation, continuation, scope, meta, value) {
      return this['*'](this.get('::window', 'font-size', continuation), value);
    }
  };

  Units.prototype.vw = {
    command: function(operation, continuation, scope, meta, value) {
      return this['*'](this['/'](this.get('::window', 'width', continuation), 100), value);
    }
  };

  Units.prototype.vh = {
    command: function(operation, continuation, scope, meta, value) {
      return this['*'](this['/'](this.get('::window', 'height', continuation), 100), value);
    }
  };

  Units.prototype.vmin = {
    command: function(operation, continuation, scope, meta, value) {
      return this['*'](this['/'](this.get('::window', 'min', continuation), 100), value);
    }
  };

  Units.prototype.vmax = {
    command: function(operation, continuation, scope, meta, value) {
      return this['*'](this['/'](this.get('::window', 'max', continuation), 100), value);
    }
  };

  return Units;

})();

module.exports = Units;
