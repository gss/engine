var Type, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Type = (function(_super) {
  __extends(Type, _super);

  function Type() {
    _ref = Type.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Type.condition = function(obj) {
    var _ref1;
    if (typeof obj === 'string' && ((_ref1 = this.Keywords) != null ? _ref1[obj] : void 0)) {
      return obj;
    }
  };

  return Type;

})(Command);

Type.Number = (function(_super) {
  __extends(Number, _super);

  function Number() {
    _ref1 = Number.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Number.prototype.type = 'Number';

  Number.condition = function(obj) {
    var parsed;
    parsed = parseFloat(obj);
    if (parsed === obj) {
      return parsed;
    }
  };

  return Number;

})(Type);

Type.Integer = (function(_super) {
  __extends(Integer, _super);

  function Integer() {
    _ref2 = Integer.__super__.constructor.apply(this, arguments);
    return _ref2;
  }

  Integer.prototype.type = 'Integer';

  Integer.condition = function(obj) {
    var parsed;
    parsed = parseInt(obj);
    if (String(parsed) === String(obj)) {
      return parsed;
    }
  };

  return Integer;

})(Type);

Type.String = (function(_super) {
  __extends(String, _super);

  function String() {
    _ref3 = String.__super__.constructor.apply(this, arguments);
    return _ref3;
  }

  String.prototype.type = 'String';

  String.condition = function(obj) {
    if (typeof obj === 'string') {
      return obj;
    }
  };

  return String;

})(Type);

Type.Strings = (function(_super) {
  __extends(Strings, _super);

  function Strings() {
    _ref4 = Strings.__super__.constructor.apply(this, arguments);
    return _ref4;
  }

  Strings.prototype.type = 'Strings';

  Strings.condition = function(obj) {
    if (typeof obj === 'string' || obj instanceof Array) {
      return obj;
    }
  };

  return Strings;

})(Type);

Type.Size = (function(_super) {
  __extends(Size, _super);

  function Size() {
    _ref5 = Size.__super__.constructor.apply(this, arguments);
    return _ref5;
  }

  Size.prototype.type = 'Size';

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

})(Type);

Type.Position = (function(_super) {
  __extends(Position, _super);

  function Position() {
    _ref6 = Position.__super__.constructor.apply(this, arguments);
    return _ref6;
  }

  Position.prototype.type = 'Position';

  Position.Keywords = {
    "top": "top",
    "bottom": "bottom",
    "left": "left",
    "right": "right"
  };

  return Position;

})(Type);

Type.URL = (function(_super) {
  __extends(URL, _super);

  function URL() {
    _ref7 = URL.__super__.constructor.apply(this, arguments);
    return _ref7;
  }

  URL.prototype.type = 'URL';

  URL.define({
    'url': function() {},
    'src': function() {}
  });

  return URL;

})(Type);

Type.Property = (function(_super) {
  __extends(Property, _super);

  function Property() {
    _ref8 = Property.__super__.constructor.apply(this, arguments);
    return _ref8;
  }

  Property.prototype.type = 'Property';

  Property.prototype.Property = function(obj) {
    if (this.properties[obj]) {
      return obj;
    }
  };

  return Property;

})(Type);

module.exports = Type;
