var Setter, Styles, Types;

Styles = (function() {
  function Styles() {}

  Styles.prototype.animation = [[['animationName', 'animationDuration', 'animationDelay', 'animationDirection', 'animationTimingFunction']]];

  Styles.prototype.animationName = ['strings'];

  Styles.prototype.animationDuration = ['length'];

  Styles.prototype.animationDelay = ['length'];

  Styles.prototype.animationDirection = ['reverse', 'normal'];

  Styles.prototype.animationTimingFunction = ['ease-in', 'ease-out', 'ease-in-out', 'linear'];

  Styles.prototype.transition = [[['transitionProperty', 'transitionDuration', 'transitionDelay', 'transitionTimingFunction']]];

  Styles.prototype.transitionProperty = ['strings'];

  Styles.prototype.transitionDuration = ['length'];

  Styles.prototype.transitionDelay = ['length'];

  Styles.prototype.transitionTimingFunction = ['ease-in', 'ease-out', 'ease-in-out', 'linear'];

  Styles.prototype.background = [[['backgroundColor', 'backgroundImage', 'backgroundRepeat', 'backgroundAttachment', 'backgroundPositionX', 'backgroundPositionY']], 'multiple'];

  Styles.prototype.backgroundColor = ['color', 'transparent', 'inherit'];

  Styles.prototype.backgroundImage = ['url', 'none', 'inherit'];

  Styles.prototype.backgroundRepeat = ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'inherit', 'space', 'round'];

  Styles.prototype.backgroundAttachment = ['fixed', 'scroll', 'inherit', 'local', 'fixed'];

  Styles.prototype.backgroundPosition = [['backgroundPositionX', 'backgroundPositionY']];

  Styles.prototype.backgroundPositionX = ['percentage', 'center', 'left', 'right', 'length', 'inherit'];

  Styles.prototype.backgroundPositionY = ['percentage', 'center', 'top', 'bottom', 'length', 'inherit'];

  Styles.prototype.textShadow = [['textShadowBlur', 'textShadowOffsetX', 'textShadowOffsetY', 'textShadowColor'], 'multiple', 'virtual'];

  Styles.prototype.textShadowBlur = ['length'];

  Styles.prototype.textShadowOffsetX = ['length'];

  Styles.prototype.textShadowOffsetY = ['length'];

  Styles.prototype.textShadowColor = ['color'];

  Styles.prototype.boxShadow = [['boxShadowBlur', 'boxShadowOffsetX', 'boxShadowOffsetY', 'boxShadowColor'], 'multiple', 'virtual'];

  Styles.prototype.boxShadowBlur = ['length'];

  Styles.prototype.boxShadowOffsetX = ['length'];

  Styles.prototype.boxShadowOffsetY = ['length'];

  Styles.prototype.boxShadowColor = ['color'];

  Styles.prototype.outline = ['outlineWidth', 'outlineStyle', 'outlineColor'];

  Styles.prototype.outlineWidth = ['length'];

  Styles.prototype.outlineStyle = ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'];

  Styles.prototype.outlineColor = ['color'];

  Styles.prototype.font = [[['fontStyle', 'fontVariant', 'fontWeight'], 'fontSize', ['lineHeight'], 'fontFamily']];

  Styles.prototype.fontStyle = ['normal', 'italic', 'oblique', 'inherit'];

  Styles.prototype.fontVariant = ['normal', 'small-caps', 'inherit'];

  Styles.prototype.fontWeight = ['normal', 'number', 'bold', 'inherit'];

  Styles.prototype.fontFamily = ['strings', 'inherit'];

  Styles.prototype.fontSize = ['length', 'percentage', 'inherit', 'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'smaller', 'larger'];

  Styles.prototype.color = ['color'];

  Styles.prototype.letterSpacing = ['normal', 'length', 'inherit'];

  Styles.prototype.textDecoration = ['none', 'capitalize', 'uppercase', 'lowercase'];

  Styles.prototype.textAlign = ['left', 'right', 'center', 'justify'];

  Styles.prototype.textIdent = ['length', 'percentage'];

  Styles.prototype.lineHeight = ['normal', 'number', 'length', 'percentage'];

  Styles.prototype.listStyle = [['list-style-type', 'list-style-position', 'list-style-image']];

  Styles.prototype.listStyleType = ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'lower-alpha', 'none', 'upper-alpha', 'inherit'];

  Styles.prototype.listStyleImage = ['url', 'none', 'inherit'];

  Styles.prototype.listStylePosition = ['inside', 'outside', 'none'];

  Styles.prototype.height = ['length', 'auto'];

  Styles.prototype.maxHeight = ['length', 'auto'];

  Styles.prototype.minHeight = ['length', 'auto'];

  Styles.prototype.width = ['length', 'auto'];

  Styles.prototype.maxWidth = ['length', 'auto'];

  Styles.prototype.minWidth = ['length', 'auto'];

  Styles.prototype.display = ['inline', 'block', 'list-item', 'run-in', 'inline-block', 'table', 'inline-table', 'none', 'table-row-group', 'table-header-group', 'table-footer-group', 'table-row', 'table-column-group', 'table-column', 'table-cell', 'table-caption'];

  Styles.prototype.visibility = ['visible', 'hidden'];

  Styles.prototype.float = ['none', 'left', 'right'];

  Styles.prototype.clear = ['none', 'left', 'right', 'both', 'inherit'];

  Styles.prototype.overflow = ['visible', 'hidden', 'scroll', 'auto'];

  Styles.prototype.position = ['static', 'relative', 'absolute', 'fixed'];

  Styles.prototype.top = ['length', 'auto'];

  Styles.prototype.left = ['length', 'auto'];

  Styles.prototype.right = ['length', 'auto'];

  Styles.prototype.bottom = ['length', 'auto'];

  Styles.prototype.zIndex = ['integer'];

  Styles.prototype.cursor = ['auto', 'crosshair', 'default', 'hand', 'move', 'e-resize', 'ne-resize', 'nw-resize', 'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help'];

  return Styles;

})();

Setter = function(style) {
  if (typeof style[0] === 'object') {

  } else {
    return Setter.Simple.call(this, style);
  }
};

Setter.Simple = function(style) {
  var keywords, property, setter, _i, _len;
  keywords = {};
  for (_i = 0, _len = style.length; _i < _len; _i++) {
    property = style[_i];
    if (!this[property]) {
      setter.keywords[property] = style;
    }
  }
  setter = function(value) {};
  return setter.keywords;
};

Setter.Shorthand = function() {};

Setter.List = function() {};

Types = {
  float: function(obj) {
    if (typeof obj === 'number') {
      return obj;
    }
  },
  integer: function(obj) {
    if (obj % 1 === 0 && ((0 + obj).toString() === obj)) {
      return obj;
    }
  },
  keywords: function(set) {},
  strings: function(obj) {
    if (typeof obj === 'string' || obj.push) {
      return obj;
    }
  },
  positions: {
    "top": "top",
    "bottom": "bottom",
    "left": "left",
    "right": "right"
  },
  position: function(obj) {
    if (Type.positions[obj]) {
      return obj;
    }
  },
  percentage: function(obj) {
    if (obj.name === '%') {
      return Type.length(obj, '%');
    }
  }
};

module.exports = Styles;
