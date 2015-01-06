var Command, Styles;

Styles = (function() {
  var i, index, prop, side, sides, type, _base, _base1, _base2, _base3, _base4, _i, _j, _k, _len, _len1, _name, _ref, _ref1;

  function Styles() {}

  Styles.prototype.transform = [
    [
      function() {
        return mat4.create();
      }, 'Matrix'
    ]
  ];

  Styles.prototype.animation = [
    [
      [
        {
          name: ['none', 'String'],
          duration: ['Time'],
          delay: ['Time'],
          direction: ['normal', 'reverse', 'alternate'],
          'timing-function': ['Easing'],
          'iteration-count': [1, 'infinite', 'Number'],
          'fill-mode': ['none', 'both', 'forwards', 'backwards'],
          'play-state': ['running', 'paused']
        }
      ]
    ]
  ];

  Styles.prototype.transition = [
    [
      [
        {
          property: ['all', 'property', 'none'],
          duration: ['Time'],
          delay: ['Time'],
          direction: ['reverse', 'normal'],
          'timing-function': ['Easing']
        }
      ]
    ]
  ];

  Styles.prototype.background = [
    [
      [
        {
          image: ['URL', 'Gradient', 'none'],
          position: {
            x: ['Length', 'Percentage', 'center', 'left', 'right'],
            y: ['Length', 'Percentage', 'center', 'top', 'bottom']
          },
          size: {
            x: ['Length', 'Percentage', 'cover', 'contain'],
            y: ['Length', 'Percentage']
          },
          repeat: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round'],
          attachment: ['fixed', 'scroll', 'local'],
          origin: ['padding-box', 'border-box', 'content-box'],
          clip: ['border-box', 'content-box', 'padding-box']
        }
      ]
    ], [
      {
        color: ['Color', 'transparent']
      }
    ]
  ];

  Styles.prototype.text = {
    shadow: [
      [
        [
          {
            offset: {
              x: ['Length'],
              y: ['Length']
            },
            blur: ['Length'],
            color: ['Color']
          }
        ]
      ]
    ],
    decoration: ['none', 'capitalize', 'uppercase', 'lowercase'],
    align: ['left', 'right', 'center', 'justify'],
    ident: ['Length', 'Percentage']
  };

  Styles.prototype.box = {
    shadow: [
      [
        [
          {
            inset: ['inset']
          }
        ], {
          offset: {
            x: ['Length'],
            y: ['Length']
          }
        }, [
          {
            blur: ['Length'],
            spread: ['Length']
          }
        ], {
          color: ['Color']
        }
      ]
    ],
    sizing: ['padding-box', 'border-box', 'content-box']
  };

  Styles.prototype.outline = [
    {
      width: ['medium', 'Length'],
      style: ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'],
      color: ['invert', 'Color']
    }
  ];

  Styles.prototype['line-height'] = ['normal', 'Length', 'Number', 'Percentage'];

  Styles.prototype.font = [
    [
      {
        style: ['normal', 'italic', 'oblique'],
        variant: ['normal', 'small-caps'],
        weight: ['normal', 'Number', 'bold']
      }
    ], {
      size: ['Size', 'Length', 'Percentage']
    }, [
      {
        'line-height': ['normal', 'Length', 'Number', 'Percentage']
      }
    ], {
      family: ['inherit', 'strings']
    }
  ];

  Styles.prototype['font-stretch'] = ['normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'];

  Styles.prototype['font-size-adjust'] = ['Number'];

  Styles.prototype['letter-spacing'] = ['normal', 'Length'];

  Styles.prototype.list = {
    style: [
      {
        type: ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'lower-alpha', 'none', 'upper-alpha'],
        image: ['none', 'URL'],
        position: ['outside', 'inside', 'none']
      }
    ]
  };

  Styles.prototype.width = ['Length', 'auto'];

  Styles.prototype.height = ['Length', 'auto'];

  Styles.prototype.min = {
    width: ['Length', 'auto'],
    height: ['Length', 'auto']
  };

  Styles.prototype.max = {
    width: ['Length', 'auto'],
    height: ['Length', 'auto']
  };

  Styles.prototype.display = ['inline', 'inline-block', 'block', 'list-item', 'run-in', 'table', 'inline-table', 'none', 'table-row-group', 'table-header-group', 'table-footer-group', 'table-row', 'table-column-group', 'table-column', 'table-cell', 'table-caption'];

  Styles.prototype.visibility = ['visible', 'hidden'];

  Styles.prototype.float = ['none', 'left', 'right'];

  Styles.prototype.clear = ['none', 'left', 'right', 'both'];

  Styles.prototype.overflow = ['visible', 'hidden', 'scroll', 'auto'];

  Styles.prototype['overflow-x'] = ['visible', 'hidden', 'scroll', 'auto'];

  Styles.prototype['overflow-y'] = ['visible', 'hidden', 'scroll', 'auto'];

  Styles.prototype.position = ['static', 'relative', 'absolute', 'fixed', 'sticky'];

  Styles.prototype.top = ['Length', 'Percentage', 'auto'];

  Styles.prototype.left = ['Length', 'Percentage', 'auto'];

  Styles.prototype.right = ['Length', 'Percentage', 'auto'];

  Styles.prototype.bottom = ['Length', 'Percentage', 'auto'];

  Styles.prototype.opacity = ['Number'];

  Styles.prototype['z-index'] = ['Integer'];

  Styles.prototype.cursor = ['auto', 'crosshair', 'default', 'hand', 'move', 'e-resize', 'ne-resize', 'nw-resize', 'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help'];

  Styles.prototype.color = ['color'];

  Styles.prototype.columns = ['length'];

  Styles.prototype['column-gap'] = ['length'];

  Styles.prototype['column-width'] = ['length'];

  Styles.prototype['column-count'] = ['Integer'];

  _ref = sides = ['top', 'right', 'bottom', 'left'];
  for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
    side = _ref[index];
    ((_base = Styles.prototype).margin || (_base.margin = [
      {
        'pad': 'pad'
      }
    ]))[0][side] = ['Length', 'Percentage', 'auto'];
    ((_base1 = Styles.prototype).padding || (_base1.padding = [
      {
        'pad': 'pad'
      }
    ]))[0][side] = ['Length', 'Percentage', 'auto'];
    ((_base2 = Styles.prototype).border || (_base2.border = [
      {
        'pad': 'pad'
      }
    ]))[0][side] = [
      [
        {
          width: ['Length', 'thin', 'thick', 'medium'],
          style: ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'],
          color: ['Color']
        }
      ]
    ];
    _ref1 = ['width', 'color', 'style'];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      type = _ref1[_j];
      ((_base3 = Styles.prototype)[_name = 'border-' + type] || (_base3[_name] = [
        [
          {
            'pad': 'pad'
          }
        ]
      ]))[0][+0]['border-' + side + '-' + type] = Styles.prototype.border[0][side][0][0][type];
    }
    if (!(index % 2)) {
      for (i = _k = 3; _k > 0; i = _k += -2) {
        prop = 'border-' + side + '-' + sides[i] + '-radius';
        Styles.prototype[prop] = ['Length', 'none'];
        ((_base4 = Styles.prototype)['border-radius'] || (_base4['border-radius'] = [
          {
            'pad': 'pad'
          }
        ]))[0][prop] = ['Length', 'none'];
      }
    }
  }

  return Styles;

})();

Command = require('../Command');

module.exports = Styles;
