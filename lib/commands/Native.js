var Native;

Native = (function() {
  function Native() {}

  Native.prototype.camelize = function(string) {
    return string.toLowerCase().replace(/-([a-z])/gi, function(match) {
      return match[1].toUpperCase();
    });
  };

  Native.prototype.dasherize = function(string) {
    return string.replace(/[A-Z]/g, function(match) {
      return '-' + match[0].toLowerCase();
    });
  };

  Native.prototype.getStyle = function(element, property) {
    var prop, value;
    prop = this.camelize(property);
    value = element.style[property];
    if (value === '') {
      value = this.intrinsic.getComputedStyle(element)[prop];
    }
    value = this.toPrimitive(value, null, null, null, element, prop);
    if (value.push && typeof value[0] === 'object') {
      return this.properties[property].apply(this, value);
    } else {
      return this.properties[property].call(this, value);
    }
  };

  Native.prototype.setStyle = function(element, property, value) {
    return element.style[property] = value;
  };

  Native.prototype.indexOfTriplet = function(array, a, b, c) {
    var index, op, _i, _len;
    if (array) {
      for (index = _i = 0, _len = array.length; _i < _len; index = _i += 3) {
        op = array[index];
        if (op === a && array[index + 1] === b && array[index + 2] === c) {
          return index;
        }
      }
    }
    return -1;
  };

  Native.prototype.getCommonParent = function(a, b) {
    var ap, aps, bp, bps;
    aps = [];
    bps = [];
    ap = a;
    bp = b;
    while (ap && bp) {
      aps.push(ap);
      bps.push(bp);
      ap = ap.parentNode;
      bp = bp.parentNode;
      if (bps.indexOf(ap) > -1) {
        return ap;
      }
      if (aps.indexOf(bp) > -1) {
        return bp;
      }
    }
    return suggestions;
  };

  return Native;

})();

module.exports = Measurements;
