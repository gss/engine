class Styles 
  animation:                [[['animationName', 'animationDuration', 'animationDelay',
                            'animationDirection','animationTimingFunction']]],
  animationName:            ['strings'],
  animationDuration:        ['length'],
  animationDelay:           ['length'],
  animationDirection:       ['reverse', 'normal'],
  animationTimingFunction:  ['ease-in', 'ease-out', 'ease-in-out', 'linear'],
  
  transition:               [[['transitionProperty', 'transitionDuration', 
                            'transitionDelay', 'transitionTimingFunction']]],
  transitionProperty:       ['strings'],
  transitionDuration:       ['length'],
  transitionDelay:          ['length'],
  transitionTimingFunction: ['ease-in', 'ease-out', 'ease-in-out', 'linear']


  background:           [[['backgroundColor', 'backgroundImage', 'backgroundRepeat',
                        'backgroundAttachment', 'backgroundPositionX', 'backgroundPositionY']], 'multiple'],
  backgroundColor:      ['color', 'transparent', 'inherit'],
  backgroundImage:      ['url', 'none', 'inherit'],
  backgroundRepeat:     ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'inherit', 'space', 'round'],
  backgroundAttachment: ['fixed', 'scroll', 'inherit', 'local', 'fixed'],
  backgroundPosition:   [['backgroundPositionX', 'backgroundPositionY']],
  backgroundPositionX:  ['percentage', 'center', 'left', 'right', 'length', 'inherit'],
  backgroundPositionY:  ['percentage', 'center', 'top', 'bottom', 'length', 'inherit'],

  textShadow:           [['textShadowBlur', 'textShadowOffsetX', 'textShadowOffsetY', 'textShadowColor'], 'multiple', 'virtual'],
  textShadowBlur:       ['length'],
  textShadowOffsetX:    ['length'],
  textShadowOffsetY:    ['length'],
  textShadowColor:      ['color'],

  boxShadow:            [['boxShadowBlur', 'boxShadowOffsetX', 'boxShadowOffsetY', 'boxShadowColor'], 'multiple', 'virtual'],
  boxShadowBlur:        ['length'],
  boxShadowOffsetX:     ['length'],
  boxShadowOffsetY:     ['length'],
  boxShadowColor:       ['color'],

  outline:              ['outlineWidth', 'outlineStyle', 'outlineColor'],
  outlineWidth:         ['length'],
  outlineStyle:         ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'],
  outlineColor:         ['color'],

  font:                 [[['fontStyle', 'fontVariant', 'fontWeight'], 'fontSize', ['lineHeight'], 'fontFamily']],
  fontStyle:            ['normal', 'italic', 'oblique', 'inherit'],
  fontVariant:          ['normal', 'small-caps', 'inherit'],
  fontWeight:           ['normal', 'number', 'bold', 'inherit'],
  fontFamily:           ['strings', 'inherit'],
  fontSize:             ['length', 'percentage', 'inherit',
                         'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'smaller', 'larger'],

  color:                ['color'],
  letterSpacing:        ['normal', 'length', 'inherit'],
  textDecoration:       ['none', 'capitalize', 'uppercase', 'lowercase'],
  textAlign:            ['left', 'right', 'center', 'justify'],
  textIdent:            ['length', 'percentage'],
  lineHeight:           ['normal', 'number', 'length', 'percentage'],

  listStyle:            [['list-style-type', 'list-style-position', 'list-style-image']],
  listStyleType:        ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman',
                         'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'lower-alpha', 'none',
                         'upper-alpha', 'inherit'],
  listStyleImage:       ['url', 'none', 'inherit'],
  listStylePosition:    ['inside', 'outside', 'none'],

  height:               ['length', 'auto'],
  maxHeight:            ['length', 'auto'],
  minHeight:            ['length', 'auto'],
  width:                ['length', 'auto'],
  maxWidth:             ['length', 'auto'],
  minWidth:             ['length', 'auto'],

  display:              ['inline', 'block', 'list-item', 'run-in', 'inline-block', 'table', 'inline-table', 'none',
                         'table-row-group', 'table-header-group', 'table-footer-group', 'table-row',
                         'table-column-group', 'table-column', 'table-cell', 'table-caption'],
  visibility:           ['visible', 'hidden'],
  float:                ['none', 'left', 'right'],
  clear:                ['none', 'left', 'right', 'both', 'inherit'],
  overflow:             ['visible', 'hidden', 'scroll', 'auto'],
  position:             ['static', 'relative', 'absolute', 'fixed'],
  top:                  ['length', 'auto'],
  left:                 ['length', 'auto'],
  right:                ['length', 'auto'],
  bottom:               ['length', 'auto'],
  zIndex:               ['integer'],
  cursor:               ['auto', 'crosshair', 'default', 'hand', 'move', 'e-resize', 'ne-resize', 'nw-resize',
                         'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help'],

Setter = (style) ->
  if typeof style[0] == 'object'

  else
    Setter.Simple.call(@, style)

Setter.Simple = (style) ->
  keywords = {}
  for property in style
    unless @[property]
      setter.keywords[property] = style
  setter = (value) ->

  setter.keywords


Setter.Shorthand = ->


Setter.List = ->

Types =
  # Decimal value (e.g. line-height: 2.2)
  float: (obj) ->
    if typeof obj == 'number'
      return obj

  # Integer value (e.g. z-index: 1)
  integer: (obj) ->
    if (obj % 1 == 0 && ((0 + obj).toString() == obj))
      return obj

  # Style-specific unquoted word 
  keywords: (set) ->
    
  # Array of strings (e.g. font-family)
  strings: (obj) ->
    if typeof obj == 'string' || obj.push
      return obj

  # Keywords for background-position and alike
  positions: {"top", "bottom", "left", "right"}
  position: (obj) ->
    if Type.positions[obj]
      return obj

  # Length with % unit
  percentage: (obj) ->
    if obj.name == '%'
      return Type.length(obj, '%')


module.exports = Styles