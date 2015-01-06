var Command, Primitive, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../Command');

Primitive = (function(_super) {
  __extends(Primitive, _super);

  function Primitive() {
    _ref = Primitive.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  return Primitive;

})(Command);

Primitive.Number = (function(_super) {
  __extends(Number, _super);

  Number.prototype.type = 'Number';

  function Number(obj) {
    var parsed;
    parsed = parseFloat(obj);
    if (parsed === obj) {
      return parsed;
    }
  }

  Number.formatNumber = function(number) {
    return number;
  };

  return Number;

})(Primitive);

Primitive.Integer = (function(_super) {
  __extends(Integer, _super);

  Integer.prototype.type = 'Integer';

  function Integer(obj) {
    var parsed;
    parsed = parseInt(obj);
    if (String(parsed) === String(obj)) {
      return parsed;
    }
  }

  return Integer;

})(Primitive);

Primitive.String = (function(_super) {
  __extends(String, _super);

  String.prototype.type = 'String';

  function String(obj) {
    if (typeof obj === 'string') {
      return obj;
    }
  }

  return String;

})(Primitive);

Primitive.Strings = (function(_super) {
  __extends(Strings, _super);

  Strings.prototype.type = 'Strings';

  function Strings(obj) {
    if (typeof obj === 'string' || obj instanceof Array) {
      return obj;
    }
  }

  return Strings;

})(Primitive);

Primitive.Size = (function(_super) {
  __extends(Size, _super);

  Size.prototype.type = 'Size';

  function Size(obj) {
    var _ref1;
    if (typeof obj === 'string' && ((_ref1 = Primitive.Size.Keywords) != null ? _ref1[obj] : void 0)) {
      return obj;
    }
  }

  Size.Keywords = {
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

  return Size;

})(Primitive);

Primitive.Position = (function(_super) {
  __extends(Position, _super);

  Position.prototype.type = 'Position';

  function Position(obj) {
    var _ref1;
    if (typeof obj === 'string' && ((_ref1 = Primitive.Position.Keywords) != null ? _ref1[obj] : void 0)) {
      return obj;
    }
  }

  Position.Keywords = {
    "top": "top",
    "bottom": "bottom",
    "left": "left",
    "right": "right"
  };

  return Position;

})(Primitive);

Primitive.Property = (function(_super) {
  __extends(Property, _super);

  function Property() {
    _ref1 = Property.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Property.prototype.type = 'Property';

  Property.prototype.Property = function(obj) {
    if (this.properties[obj]) {
      return obj;
    }
  };

  return Property;

})(Primitive);

module.exports = Primitive;
