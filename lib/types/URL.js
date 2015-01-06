var Command, URL, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../Command');

URL = (function(_super) {
  __extends(URL, _super);

  function URL() {
    _ref = URL.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  URL.prototype.type = 'URL';

  URL.define({
    'url': function() {},
    'src': function() {}
  });

  return URL;

})(Command);
