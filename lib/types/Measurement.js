var Measurement, Unit, Variable, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Variable = require('../commands/Variable');

Unit = require('../commands/Unit');

Measurement = (function(_super) {
  __extends(Measurement, _super);

  function Measurement() {
    _ref = Measurement.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Measurement.prototype.signature = [
    {
      value: ['Variable', 'Number']
    }
  ];

  return Measurement;

})(Variable);

Measurement.Percentage = (function(_super) {
  __extends(Percentage, _super);

  function Percentage(obj) {
    switch (typeof obj) {
      case 'object':
        if (obj[0] === '%') {
          return obj;
        }
    }
  }

  return Percentage;

})(Measurement);

Measurement.Length = (function(_super) {
  __extends(Length, _super);

  function Length(obj) {
    switch (typeof obj) {
      case 'number':
        return obj;
      case 'object':
        if (Measurement.Length[obj[0]]) {
          return obj;
        }
        if (Unit[obj[0]] && obj[0] !== '%') {
          return obj;
        }
    }
  }

  Length.define({
    px: function(value) {
      return value;
    },
    pt: function(value) {
      return value;
    },
    cm: function(value) {
      return value * 37.8;
    },
    mm: function(value) {
      return value * 3.78;
    },
    "in": function(value) {
      return value * 96;
    }
  });

  Length.formatNumber = function(number) {
    return number + 'px';
  };

  return Length;

})(Measurement);

Measurement.Angle = (function(_super) {
  __extends(Angle, _super);

  function Angle(obj) {
    switch (typeof obj) {
      case 'number':
        return obj;
      case 'object':
        if (Measurement.Angle[obj[0]]) {
          return obj;
        }
    }
  }

  Angle.define({
    deg: function(value) {
      return value * (Math.PI / 180);
    },
    grad: function(value) {
      return value * (Math.PI / 180) / (360 / 400);
    },
    turn: function(value) {
      return value * (Math.PI / 180) * 360;
    },
    rad: function(value) {
      return value;
    }
  });

  Angle.formatNumber = function(number) {
    return number + 'rad';
  };

  return Angle;

})(Measurement);

Measurement.Time = (function(_super) {
  __extends(Time, _super);

  function Time(obj) {
    switch (typeof obj) {
      case 'number':
        return obj;
      case 'object':
        if (Measurement.Time[obj[0]]) {
          return obj;
        }
    }
  }

  Time.define({
    h: function(value) {
      return value * 60 * 60 * 1000;
    },
    min: function(value) {
      return value * 60 * 1000;
    },
    s: function(value) {
      return value * 1000;
    },
    ms: function(value) {
      return value;
    }
  });

  Time.formatNumber = function(number) {
    return number + 'ms';
  };

  return Time;

})(Measurement);

Measurement.Frequency = (function(_super) {
  __extends(Frequency, _super);

  function Frequency(obj) {
    switch (typeof obj) {
      case 'number':
        return obj;
      case 'object':
        if (this[obj[0]]) {
          return obj;
        }
    }
  }

  Frequency.define({
    mhz: function(value) {
      return value * 1000 * 1000;
    },
    khz: function(value) {
      return value * 1000;
    },
    hz: function(value) {
      return value;
    }
  });

  Frequency.formatNumber = function(number) {
    return number + 'hz';
  };

  return Frequency;

})(Measurement);

module.exports = Measurement;
