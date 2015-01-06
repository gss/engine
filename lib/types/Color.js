var Color;

Color = (function() {
  function Color() {}

  Color.Keywords = {
    'transparent': 'transparent',
    'currentColor': 'currentColor'
  };

  Color.define({
    hsl: function(h, s, l) {
      var b, c, g, i, r, t1, t2, t3, _i, _ref;
      if (s === 0) {
        r = g = b = l * 255;
      } else {
        t3 = [0, 0, 0];
        c = [0, 0, 0];
        t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
        t1 = 2 * l - t2;
        h /= 360;
        t3[0] = h + 1 / 3;
        t3[1] = h;
        t3[2] = h - 1 / 3;
        for (i = _i = 0; _i <= 2; i = ++_i) {
          if (t3[i] < 0) {
            t3[i] += 1;
          }
          if (t3[i] > 1) {
            t3[i] -= 1;
          }
          if (6 * t3[i] < 1) {
            c[i] = t1 + (t2 - t1) * 6 * t3[i];
          } else if (2 * t3[i] < 1) {
            c[i] = t2;
          } else if (3 * t3[i] < 2) {
            c[i] = t1 + (t2 - t1) * ((2 / 3) - t3[i]) * 6;
          } else {
            c[i] = t1;
          }
        }
        _ref = [Math.round(c[0] * 255), Math.round(c[1] * 255), Math.round(c[2] * 255)], r = _ref[0], g = _ref[1], b = _ref[2];
      }
      return ['rgb', r, g, b];
    },
    hsla: function(h, s, l, a) {
      return Type.Color.hsl.execute(h, s, l).concat[a];
    },
    rgb: function(r, g, b) {
      return ['rgb', r, g, b];
    },
    rgba: function(r, g, b, a) {
      return ['rgba', r, g, b, a];
    },
    hex: function(hex) {
      var a, b, g, r, u;
      if (hex.match(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
        if (hex.length === 4 || hex.length === 7) {
          hex = hex.substr(1);
        }
        if (hex.length === 3) {
          hex = hex.split("");
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        u = parseInt(hex, 16);
        r = u >> 16;
        g = u >> 8 & 0xFF;
        b = u & 0xFF;
        return ['rgb', r, g, b];
      }
      if (hex.match(/^#?([A-Fa-f0-9]{8})$/)) {
        if (hex.length === 9) {
          hex = hex.substr(1);
        }
        u = parseInt(hex, 16);
        r = u >> 24 & 0xFF;
        g = u >> 16 & 0xFF;
        b = u >> 8 & 0xFF;
        a = u & 0xFF;
        return ['rgba', r, g, b, a];
      }
    }
  });

  return Color;

})();

module.exports = Color;
