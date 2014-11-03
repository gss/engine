var Exporter;

Exporter = (function() {
  function Exporter() {}

  Exporter.prototype.preexport = function() {
    var baseline, element, height, match, pairs, scope, width, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6,
      _this = this;
    if ((scope = this.scope).nodeType === 9) {
      scope = this.scope.body;
    }
    this.identity["yield"](scope);
    _ref = scope.getElementsByTagName('*');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      if (element.tagName !== 'SCRIPT' && (element.tagName !== 'STYLE' || ((_ref1 = element.getAttribute('type')) != null ? _ref1.indexOf('gss') : void 0) > -1)) {
        this.identity["yield"](element);
      }
    }
    if (window.Sizes) {
      this.sizes = [];
      _ref2 = window.Sizes;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        pairs = _ref2[_j];
        _ref3 = pairs[0];
        for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
          width = _ref3[_k];
          _ref4 = pairs[1];
          for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
            height = _ref4[_l];
            this.sizes.push(width + 'x' + height);
          }
        }
      }
    }
    if (match = (_ref5 = location.search.match(/export=([a-z0-9]+)/)) != null ? _ref5[1] : void 0) {
      if (match.indexOf('x') > -1) {
        _ref6 = match.split('x'), width = _ref6[0], height = _ref6[1];
        baseline = 72;
        width = parseInt(width) * baseline;
        height = parseInt(height) * baseline;
        window.addEventListener('load', function() {
          localStorage[match] = JSON.stringify(_this["export"]());
          return _this.postexport();
        });
        document.body.style.width = width + 'px';
        this.intrinsic.properties['::window[height]'] = function() {
          return height;
        };
        return this.intrinsic.properties['::window[width]'] = function() {
          return width;
        };
      } else {
        if (match === 'true') {
          localStorage.clear();
          return this.postexport();
        }
      }
    }
  };

  Exporter.prototype.postexport = function() {
    var property, result, size, value, _i, _len, _ref;
    _ref = this.sizes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      size = _ref[_i];
      if (!localStorage[size]) {
        location.search = location.search.replace(/[&?]export=([a-z0-9])+/, '') + '?export=' + size;
        return;
      }
    }
    result = {};
    for (property in localStorage) {
      value = localStorage[property];
      if (property.match(/^\d+x\d+$/)) {
        result[property] = JSON.parse(value);
      }
    }
    return document.write(JSON.stringify(result));
  };

  Exporter.prototype["export"] = function() {
    var id, index, path, property, value, values, _ref;
    values = {};
    _ref = this.values;
    for (path in _ref) {
      value = _ref[path];
      if ((index = path.indexOf('[')) > -1 && path.indexOf('"') === -1) {
        property = this.camelize(path.substring(index + 1, path.length - 1));
        id = path.substring(0, index);
        if (property === 'x' || property === 'y' || document.body.style[property] !== void 0) {
          if (this.values[id + '[intrinsic-' + property + ']'] == null) {
            values[path] = Math.ceil(value);
          }
        }
      }
    }
    values.stylesheets = this.stylesheets["export"]();
    return values;
  };

  return Exporter;

})();

module["export"] = Exporter;
