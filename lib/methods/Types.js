var Types;

Types = (function() {
  function Types() {}

  Types.prototype.Float = function(obj) {
    var parsed;
    parsed = parseFloat(obj);
    if (parsed === obj) {
      return parsed;
    }
  };

  Types.prototype.Integer = function(obj) {
    var parsed;
    parsed = parseInt(obj);
    if (String(parsed) === String(obj)) {
      return parsed;
    }
  };

  Types.prototype.String = function(obj) {
    if (typeof obj === 'string') {
      return obj;
    }
  };

  Types.prototype.Strings = function(obj) {
    if (typeof obj === 'string' || obj.push) {
      return obj;
    }
  };

  Types.prototype.Timings = {
    'ease': ['cubic-bezier', .42, 0, 1, 1],
    'ease-in': ['cubic-bezier', .42, 0, 1, 1],
    'ease-out': ['cubic-bezier', 0, 0, .58, 1],
    'ease-in-out': ['cubic-bezier', .42, 0, .58, 1],
    'linear': ['cubic-bezier', 0, 0, 1, 1],
    'step-start': 'step-start',
    'step-end': 'step-end'
  };

  Types.prototype.Timing = function(obj) {
    if (obj == null) {
      obj = 'ease';
    }
    if (typeof obj === 'string') {
      if (obj = this.Timings[obj]) {
        return obj;
      }
    } else if (obj[0] === 'steps' || obj[0] === 'cubic-bezier') {
      return obj;
    }
  };

  Types.prototype.Length = function(obj) {
    if (typeof obj === 'number') {
      return obj;
    }
    if ((this.units || this.Units.prototype)[obj[0]]) {
      if (obj[1] === 0) {
        return 0;
      }
      return obj;
    }
  };

  Types.prototype.Percentage = function(obj) {
    if (obj[0] === '%') {
      return obj;
    }
  };

  Types.prototype.Positions = {
    "top": "top",
    "bottom": "bottom",
    "left": "left",
    "right": "right"
  };

  Types.prototype.Position = function(obj) {
    if (this.Positions[obj]) {
      return obj;
    }
  };

  Types.prototype.Times = {
    's': 's',
    'ms': 'ms',
    'm': 'm'
  };

  Types.prototype.Time = function(obj) {
    if (this.Times[obj[0]]) {
      return obj;
    }
  };

  Types.prototype.Colors = {
    'transparent': 'transparent',
    'hsl': 'hsl',
    'rgb': 'rgb',
    'hsla': 'hsla',
    'rgba': 'rgba',
    'hsb': 'hsb'
  };

  Types.prototype.Pseudocolors = {
    'transparent': 'transparent',
    'currentColor': 'currentColor'
  };

  Types.prototype.Color = function(obj) {
    if (typeof obj === 'string') {
      if (this.Pseudocolors[obj]) {
        return obj;
      }
    } else {
      if (this.Colors[obj[0]]) {
        return obj;
      }
    }
  };

  Types.prototype.Sizes = {
    'medium': 'medium',
    'xx-small': 'xx-small',
    'x-small': 'x-small',
    'small': 'small',
    'large': 'large',
    'x-large': 'x-large',
    'xx-large': 'xx-large',
    'smaller': 'smaller',
    'larger': 'larger'
  };

  Types.prototype.Size = function(obj) {
    if (this.Sizes[obj]) {
      return obj;
    }
  };

  Types.prototype.Gradients = {
    'linear-gradient': 'linear-gradient',
    'radial-gradient': 'radial-gradient',
    'repeating-linear-gradient': 'repeating-linear-gradient',
    'repeating-radial-gradient': 'repeating-radial-gradient'
  };

  Types.prototype.Gradient = function(obj) {
    if (this.Gradients[obj[0]]) {
      return obj;
    }
  };

  Types.prototype.URLs = {
    'url': 'url',
    'src': 'src'
  };

  Types.prototype.URL = function(obj) {
    if (this.URLs[obj[0]]) {
      return obj;
    }
  };

  Types.prototype.Property = function(obj) {
    if (this.properties[obj]) {
      return obj;
    }
  };

  Types.prototype.Matrix = function(obj) {
    if (typeof obj === 'object' && object.length !== void 0) {
      return obj;
    }
  };

  return Types;

})();

module.exports = Types;
