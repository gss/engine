class Styles
  constructor: (@engine) ->

  transform: [[
    -> mat4.create(),
    'Matrix'
  ]]

  animation: [[[
    name:              ['none', 'String']
    duration:          ['Time']
    delay:             ['Time']
    direction:         ['normal', 'reverse', 'alternate']
    'timing-function': ['Easing'],
    'iteration-count': [1, 'infinite', 'Number']
    'fill-mode':       ['none', 'both', 'forwards', 'backwards']
    'play-state':      ['running', 'paused']
  ]]]
  
  transition: [[[
    property:          ['all', 'property', 'none']
    duration:          ['Time']
    delay:             ['Time']
    direction:         ['reverse', 'normal']
    'timing-function': ['Easing']
  ]]]

  background: [[[
    image:             ['URL', 'Gradient', 'none']
    position:         
      x:               ['Length', 'Percentage', 'center', 'left', 'right']
      y:               ['Length', 'Percentage', 'center', 'top', 'bottom']
    size: 
      x:               ['Length', 'Percentage', 'cover', 'contain']
      y:               ['Length', 'Percentage']
    repeat:            ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round']
    attachment:        ['fixed', 'scroll', 'local']
    origin:            ['padding-box', 'border-box', 'content-box']
    clip:              ['border-box', 'content-box', 'padding-box']
  ]]
  [ 
    color:             ['Color', 'transparent'] 
  ]]

  text:
    shadow: [[[
      offset:
        x:             ['Length']
        y:             ['Length']
      blur:            ['Length']
      color:           ['Color']
    ]]]

    decoration:        ['none', 'capitalize', 'uppercase', 'lowercase']
    align:             ['left', 'right', 'center', 'justify']
    ident:             ['Length', 'Percentage']

  box:
    shadow: [[
      [ inset:         ['inset'] ]
      offset:
        x:             ['Length']
        y:             ['Length']
      [ 
        blur:          ['Length']
        spread:        ['Length'] 
      ]
      color:           ['Color']
    ]]

    sizing:            ['padding-box', 'border-box', 'content-box']

  outline: [
    width:             ['medium', 'Length']
    style:             ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
    color:             ['invert', 'Color']
  ]


  'line-height':       ['normal', 'Length', 'Number', 'Percentage']

  font: [
    [ 
      style:           ['normal', 'italic', 'oblique']
      variant:         ['normal', 'small-caps']
      weight:          ['normal', 'Number', 'bold']
    ]
    size:              ['Size', 'Length', 'Percentage']
    [ 
      #'/',
      'line-height':   ['normal', 'Length', 'Number', 'Percentage'] 
    ]
    family:            ['inherit', 'strings']
  ]

  'font-stretch':      ['normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 
                        'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded' ] 
  'font-size-adjust':  ['Number']

  'letter-spacing':    ['normal', 'Length'],
  
  list:
    style: [
      type:            ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman',
                       'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'lower-alpha', 'none',
                       'upper-alpha'],
      image:           ['none', 'URL']
      position:        ['outside', 'inside', 'none']
    ]

  width:               ['Length', 'auto']
  height:              ['Length', 'auto']
  min:
    width:             ['Length', 'auto']
    height:            ['Length', 'auto']
  max:
    width:             ['Length', 'auto']
    height:            ['Length', 'auto']

  display:             ['inline', 'inline-block', 'block', 'list-item', 'run-in', 'table', 'inline-table', 'none',
                        'table-row-group', 'table-header-group', 'table-footer-group', 'table-row',
                        'table-column-group', 'table-column', 'table-cell', 'table-caption']
  visibility:          ['visible', 'hidden']
  float:               ['none', 'left', 'right']
  clear:               ['none', 'left', 'right', 'both']
  overflow:            ['visible', 'hidden', 'scroll', 'auto']
  'overflow-x':            ['visible', 'hidden', 'scroll', 'auto']
  'overflow-y':            ['visible', 'hidden', 'scroll', 'auto']
  position:            ['static', 'relative', 'absolute', 'fixed', 'sticky']
  top:                 ['Length', 'Percentage', 'auto']
  left:                ['Length', 'Percentage', 'auto']
  right:               ['Length', 'Percentage', 'auto']
  bottom:              ['Length', 'Percentage', 'auto']
  opacity:             ['Number']
  'z-index':           ['Integer']
  cursor:              ['auto', 'crosshair', 'default', 'hand', 'move', 'e-resize', 'ne-resize', 'nw-resize',
                       'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help']
  color:               ['color']

  columns:             ['length']
  'column-gap':        ['length']
  'column-width':      ['length']
  'column-count':      ['Integer']



  for side, index in sides = ['top', 'right', 'bottom', 'left']
    (Styles::margin  ||= [{'pad'}])[0][side] = ['Length', 'Percentage', 'auto']
    (Styles::padding ||= [{'pad'}])[0][side] = ['Length', 'Percentage', 'auto']
    (Styles::border  ||= [{'pad'}])[0][side] = [[
      width: ['Length', 'thin', 'thick', 'medium'],
      style: ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'none']
      color: ['Color']
    ]]
    for type in ['width', 'color', 'style']
      (Styles::['border-' + type] ||= [[{'pad'}]])[0][+
        0]['border-' + side + '-' + type] = 
          Styles::border[0][side][0][0][type]

    unless index % 2 
      for i in [3 ... 0] by -2 
        prop = 'border-' + side + '-' + (sides[i]) + '-radius'
        Styles::[prop] = ['Length', 'none']

        (Styles::['border-radius'] ||= [{'pad'}])[0][prop] = ['Length', 'none']

module.exports = Styles