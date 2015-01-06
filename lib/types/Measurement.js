var Measurement, Variable, _ref, _ref1, _ref2, _ref3, _ref4,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Variable = require('../commands/Variable');

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

Measurement.Length = (function(_super) {
  __extends(Length, _super);

  function Length() {
    _ref1 = Length.__super__.constructor.apply(this, arguments);
    return _ref1;
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

  return Length;

})(Measurement);

Measurement.Angle = (function(_super) {
  __extends(Angle, _super);

  function Angle() {
    _ref2 = Angle.__super__.constructor.apply(this, arguments);
    return _ref2;
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

  return Angle;

})(Measurement);

Measurement.Time = (function(_super) {
  __extends(Time, _super);

  function Time() {
    _ref3 = Time.__super__.constructor.apply(this, arguments);
    return _ref3;
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

  return Time;

})(Measurement);

Measurement.Frequency = (function(_super) {
  __extends(Frequency, _super);

  function Frequency() {
    _ref4 = Frequency.__super__.constructor.apply(this, arguments);
    return _ref4;
  }

  Frequency.define({
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

  return Frequency;

})(Measurement);

module.exports = Measurement;
