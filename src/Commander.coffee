###

Root commands, if bound to a dom query, will spawn commands
to match live results of query.

###

# Commander
# ======================================================== 
#
# transforms & generates needed commands for engine

Processor = require('./Processor.js')

class Commander extends Processor

  constructor: (engine) ->
    @engine = engine
    super()

  execute: (ast) ->
    if ast.commands?
      for command in ast.commands 
        if ast.isRule
          command.parentRule = ast
        @evaluate command, 0, ast


  # DOM Query invalidator hooks

  handleRemoves: (removes) ->
    return @evaluate "unregister", removes

  handleSelectorsWithAdds: (selectorsWithAdds) ->
    return @evaluate "register", selectorsWithAdds, true

  handleInvalidMeasures: (invalidMeasures) ->
    return @evaluate "register", invalidMeasures.map( (id) ->
      return "$" + id + '[intrinsic]'
    , true )


  # Getters
  
  'get': true
    
  'get$':
    prefix: '['
    suffix: ']'
    method: '_get$'

  '_get$': (context, property, command) ->
    if command.absolute is 'window'
      return ['get',"::window[#{prop}]"]       
  
    # intrinsics
    if property.indexOf("intrinsic-") is 0
      if @register "$" + id + "[intrinsic]", context
        val = @engine.measureByGssId(id, property)
        # intrinsics always need remeasurement
        engine.setNeedsMeasure true
        if engine.vars[k] isnt val
          return ['suggest', ['get$', property, id, undefined], ['number', val], 'required'] 
      
    return ['get$', property, '$' + id, undefined]
  

    
  # Conditionals
  
  "$rule":
    prefix: "{"
    scope: true
    evaluate: (arg, i, evaluated) ->
      return arg if i == 0
      if i == 1 || (evaluated[1] && i == 2)
        return @evaluate arg

  "$if":
    prefix: "@if"
    evaluate: (arg, i, evaluated) ->
      return arg if i == 0
      if i == 1 || (evaluated[1] ? i == 2 : i == 3)
        return @evaluate arg


  # Selector commands

  '$query':
    method: "querySelectorAll"
    match: (value) ->
      return @webkitMatchesSelector(value)
    group: '$query'
  
  '$class':
    prefix: '.'
    method: "getElementsByClassName"
    match: (value) ->
      return @classList.contains(value)
    group: '$query'

  '$tag':
    prefix: ''
    method: "getElementsByTagName"
    group: '$query'
    match: (value) ->
      return @tagName == value.toUpperCase()

  '$id':
    prefix: '#'
    method: "getElementById"
    group: '$query'
    match: (value) ->
      return @id == name

  '$virtual':
    prefix: '"'
    suffix: '"'

  '$nth':
    prefix: ':nth('
    suffix: ')'
    valueOf: (divisor, comparison) ->
      nodes = []
      for i, node in @
        if i % parseInt(divisor) == parseInt(comparison)
          nodes.push(nodes)
      return nodes


  # Macros

  '$combinator': (context, name) ->
    return @[name]

  '$reserved': (context, name) ->
    return @[name]


  # CSS Combinators with reversals

  ' ':
    prefix: ' '
    group: '$all'
    valueOf: ->
      return @getElementsByTagName("*")

  '!':
    prefix: '!'
    valueOf: ->
      node = @
      nodes = undefined
      while node = node.parentNode
        (nodes ||= []).push(node)
      return nodes

  '>':
    prefix: '>'
    group: '$query'
    valueOf: ->
      return @children

  '!>':
    prefix: '!>'
    valueOf: ->
      node = @
      nodes = undefined
      while node = node.previousElementSibling
        (nodes ||= []).push(node)
      return nodes

  '+':
    prefix: '+'
    valueOf: ->
      return @nextElementSibling

  '!+':
    prefix: '!+'
    valueOf: ->
      return @previousElementSibling

  '~':
    prefix: '~'
    group: '$all'
    valueOf: ->
      node = @
      nodes = undefined
      while node = node.nextElementSibling
        (nodes ||= []).push(node)
      return node

  '!~':
    prefix: '~'
    group: '$all'
    valueOf: ->
      node = @
      nodes = undefined
      while node = node.previousElementSibling
        (nodes ||= []).push(node)
      return node

  # Pseudo classes

  ':value':
    valueOf: ->
      return @value
    watch: "oninput"



  # Pseudo elements

  '::this':
    prefix: ''
    valueOf: ->
      return @

  '::parent':
    prefix: '::parent'
    valueOf: ->
      return @parentNode

  '::scope':
    prefix: "::scope"
    valueOf: ->
      return @engine.scope

  '::window':
    prefix: 'window'
    absolute: "window"

  # Global getters
  '::window[width]': (context) ->
    if @register "::window[size]", context
      w = window.innerWidth
      w = w - GSS.get.scrollbarWidth() if GSS.config.verticalScroll
      if @set context, w
        return ['suggest', ['get', "::window[width]"], ['number', w], 'required']

  '::window[height]': (context) ->
    if @register "::window[size]", context
      h = window.innerHeight
      h = h - GSS.get.scrollbarWidth() if GSS.config.horizontalScroll
      if @set context, h
        return ['suggest', ['get', "::window[height]"], ['number', w], 'required']

  '::window[center-x]': (context) ->
    if @register "::window[width]", context
      return ['eq', ['get','::window[center-x]'], ['divide',['get','::window[width]'],2], 'required']

  '::window[right]': (context) ->
    if @register "::window[width]", context
      return ['eq', ['get','::window[right]'], ['get','::window[width]'], 'required']

  '::window[center-y]': (context) ->
    if @register "::window[height]", context
      return ['eq', ['get','::window[center-y]'], ['divide',['get','::window[height]'],2], 'required']

  '::window[bottom]': (context) ->
    if @register "::window[height]", context
      return ['eq', ['get','::window[bottom]'], ['get','::window[height]'], 'required']

  '::window[size]': 
    watch: 'onresize'
    context: ->
      window


  # Constants

  '::window[x]': 0
  '::window[y]': 0
  '::scope[x]': 0
  '::scope[y]': 0
    

  # Constraints

  'strength': true
  'suggest': true
  'eq': true
  'lte': true
  'gte': true
  'lt': true
  'gt': true
  'stay': true


  # Math operators

  'number': true
  'plus': true
  'minus' : true
  'multiply': true
  'divide': true
  

  # Equasions

  "?>=": true
  "?<=": true
  "?==": true
  "?!=": true
  "?>": true
  "?<": true
  "&&": true
  "||": true

module.exports = Commander
