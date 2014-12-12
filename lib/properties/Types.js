var Types;

Types = (function() {
  function Types() {}

  Types.define = function(property, value) {
    var prop, _results;
    if (value) {
      return this[property] = value;
    } else {
      _results = [];
      for (prop in property) {
        value = property[prop];
        _results.push(this.define(prop, value));
      }
      return _results;
    }
  };

  return Types;

})();

Types.define({
  Float: function(obj) {
    var parsed;
    parsed = parseFloat(obj);
    if (parsed === obj) {
      return parsed;
    }
  },
  Integer: function(obj) {
    var parsed;
    parsed = parseInt(obj);
    if (String(parsed) === String(obj)) {
      return parsed;
    }
  },
  String: function(obj) {
    if (typeof obj === 'string') {
      return obj;
    }
  },
  Strings: function(obj) {
    if (typeof obj === 'string' || obj instanceof Array) {
      return obj;
    }
  },
  Timings: {
    'ease': ['cubic-bezier', .42, 0, 1, 1],
    'ease-in': ['cubic-bezier', .42, 0, 1, 1],
    'ease-out': ['cubic-bezier', 0, 0, .58, 1],
    'ease-in-out': ['cubic-bezier', .42, 0, .58, 1],
    'linear': ['cubic-bezier', 0, 0, 1, 1],
    'step-start': 'step-start',
    'step-end': 'step-end'
  },
  Timing: function(obj) {
    if (obj == null) {
      obj = 'ease';
    }
    if (typeof obj === 'string') {
      if (obj = this.Type.Timings[obj]) {
        return obj;
      }
    } else if (obj[0] === 'steps' || obj[0] === 'cubic-bezier') {
      return obj;
    }
  },
  Length: function(obj) {
    if (typeof obj === 'number') {
      return obj;
    }
    if (this.Unit[obj[0]]) {
      if (obj[1] === 0) {
        return 0;
      }
      return obj;
    }
  },
  Percentage: function(obj) {
    if (obj[0] === '%') {
      return obj;
    }
  },
  Positions: {
    "top": "top",
    "bottom": "bottom",
    "left": "left",
    "right": "right"
  },
  Position: function(obj) {
    if (this.Types.Positions[obj]) {
      return obj;
    }
  },
  Times: {
    's': 's',
    'ms': 'ms',
    'm': 'm'
  },
  Time: function(obj) {
    if (this.Types.Times[obj[0]]) {
      return obj;
    }
  },
  Colors: {
    'transparent': 'transparent',
    'hsl': 'hsl',
    'rgb': 'rgb',
    'hsla': 'hsla',
    'rgba': 'rgba',
    'hsb': 'hsb'
  },
  Pseudocolors: {
    'transparent': 'transparent',
    'currentColor': 'currentColor'
  },
  Color: function(obj) {
    if (typeof obj === 'string') {
      if (this.Types.Pseudocolors[obj]) {
        return obj;
      }
    } else {
      if (this.Types.Colors[obj[0]]) {
        return obj;
      }
    }
  },
  Sizes: {
    'medium': 'medium',
    'xx-small': 'xx-small',
    'x-small': 'x-small',
    'small': 'small',
    'large': 'large',
    'x-large': 'x-large',
    'xx-large': 'xx-large',
    'smaller': 'smaller',
    'larger': 'larger'
  },
  Size: function(obj) {
    if (this.Types.Sizes[obj]) {
      return obj;
    }
  },
  Gradients: {
    'linear-gradient': 'linear-gradient',
    'radial-gradient': 'radial-gradient',
    'repeating-linear-gradient': 'repeating-linear-gradient',
    'repeating-radial-gradient': 'repeating-radial-gradient'
  },
  Gradient: function(obj) {
    if (this.Types.Gradients[obj[0]]) {
      return obj;
    }
  },
  URLs: {
    'url': 'url',
    'src': 'src'
  },
  URL: function(obj) {
    if (this.Types.URLs[obj[0]]) {
      return obj;
    }
  },
  Property: function(obj) {
    if (this.properties[obj]) {
      return obj;
    }
  },
  Matrix: function(obj) {
    if (typeof obj === 'object' && object.length !== void 0) {
      return obj;
    }
  }
});

module.exports = Types;
