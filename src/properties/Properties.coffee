class Styles

  transform: [[
    -> mat4.create(),
    'matrix'
  ]]

  animation: [[[
    name:              ['none', 'String']
    duration:          ['time']
    delay:             ['time']
    direction:         ['normal', 'reverse', 'alternate']
    'timing-function': ['timing'],
    'iteration-count': [1, 'infinite', 'Number']
    'fill-mode':       ['none', 'both', 'forwards', 'backwards']
    'play-state':      ['running', 'paused']
  ]]]
  
  transition: [[[
    property:          ['all', 'property', 'none']
    duration:          ['time']
    delay:             ['time']
    direction:         ['reverse', 'normal']
    'timing-function': ['timing']
  ]]]

  background: [[[
    image:             ['Image', 'Gradient', 'none']
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


  'line-height':       ['normal', 'Number', 'Length', 'Percentage']

  font: [
    [ 
      style:           ['normal', 'italic', 'oblique']
      variant:         ['normal', 'small-caps']
      weight:          ['normal', 'Number', 'bold']
    ]
    size:              ['Size', 'Length', 'Percentage']
    [ 
      #'/',
      'line-height':   ['normal', 'Number', 'Length', 'Percentage'] 
    ]
    family:            ['inherit', 'strings']
  ]

  'font-stretch':      ['normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 
                        'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded' ] 
  'font-size-adjust':  ['Float']

  'letter-spacing':    ['normal', 'Length'],
  
  list:
    style: [
      type:            ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman',
                       'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'lower-alpha', 'none',
                       'upper-alpha'],
      image:           ['none', 'URL']
      position:        ['outside', 'inside', 'none']
    ]

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
  position:            ['static', 'relative', 'absolute', 'fixed', 'sticky']
  top:                 ['Length', 'Percentage', 'auto']
  left:                ['Length', 'Percentage', 'auto']
  right:               ['Length', 'Percentage', 'auto']
  bottom:              ['Length', 'Percentage', 'auto']
  'z-index':           ['Integer']
  cursor:              ['auto', 'crosshair', 'default', 'hand', 'move', 'e-resize', 'ne-resize', 'nw-resize',
                       'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help']
  color:               ['color']



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

    if index % 2
      for i in [1 ... 3] by 2 
        ((Styles::['border-radius'] ||= {'pad'})[side] ||= {'pad'})[sides[i + 1]] = ['Length', 'none']

module.exports = Styles