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

  return: (command) ->
    @engine.registerCommand command
    console.error('COMMAND', command)
    # send command to thread


  # DOM Query invalidator hooks

  handleRemoves: (removes) ->
    #for remove in removes
    #  @memory.set remove

  handleSelectorsWithAdds: (selectors) ->
    #for selector in selectors
    #  @memory.set selector

  handleInvalidMeasures: (ids) ->
    #for id in ids
    #  @memory.set "$" + id + '[intrinsic]'

  # Getters
  
  'get': true
    
  'get$':
    prefix: '['
    suffix: ']'
    method: '_get$'

  '_get$': (path, property, command) ->
    if command.nodeType
      id = GSS.setupId(command)
    else if command.absolute is 'window'
      return ['get',"::window[#{prop}]", path]

  
    # intrinsics
    if property.indexOf("intrinsic-") is 0
      if @register "$" + id + "[intrinsic]", context
        val = @engine.measureByGssId(id, property)
        # intrinsics always need remeasurement
        engine.setNeedsMeasure true
        if engine.vars[k] isnt val
          return ['suggest', ['get', property, id, path], ['number', val], 'required'] 
      
    return ['get', property, '$' + id, path]
  

    
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
    match: (value, node) ->
      return node if node.webkitMatchesSelector(value)
    group: '$query'
  
  '$class':
    prefix: '.'
    method: "getElementsByClassName"
    match: (value, node) ->
      return node if node.classList.contains(value)
    group: '$query'

  '$tag':
    prefix: ''
    method: "getElementsByTagName"
    group: '$query'
    match: (value, node) ->
      return node if node.tagName == value.toUpperCase()

  '$id':
    prefix: '#'
    method: "getElementById"
    group: '$query'
    match: (value, node) ->
      return node if node.id == name

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

  '$pseudo': (path, name) ->
    return @[name] || @[':get']

  '$combinator': (path, name) ->
    return @[name]

  '$reserved': (path, name) ->
    return @[name]

  'number': (path, value) ->
    return parseFloat(value)


  # CSS Combinators with reversals

  ' ':
    prefix: ' '
    group: '$query'
    valueOf: (node) ->
      return node.getElementsByTagName("*")

  '!':
    prefix: '!'
    valueOf: (node) ->
      nodes = undefined
      while node = node.parentNode
        if node.nodeType == 1
          (nodes ||= []).push(node)
      return nodes

  '>':
    prefix: '>'
    group: '$query'
    valueOf: (node) ->
      return node.children

  '!>':
    prefix: '!>'
    valueOf: (node) ->
      return node.parentNode

  '+':
    prefix: '+'
    valueOf: (node) ->
      return node.nextElementSibling

  '!+':
    prefix: '!+'
    valueOf: (node) ->
      return node.previousElementSibling

  '~':
    prefix: '~'
    group: '$query'
    valueOf: (node) ->
      nodes = undefined
      while node = node.nextElementSibling
        (nodes ||= []).push(node)
      return node

  '!~':
    prefix: '~'
    group: '$query'
    valueOf: (node) ->
      nodes = undefined
      while node = node.previousElementSibling
        (nodes ||= []).push(node)
      return node

  # Pseudo classes

  ':value':
    valueOf: (node) ->
      return node.value
    watch: "oninput"

  ':get':
    valueOf: (node, property) ->
      console.log(property  )
      return node[property]




  # Pseudo elements

  '::this':
    prefix: ''
    valueOf: (node) ->
      return node

  '::parent':
    prefix: '::parent'
    valueOf: (node) ->
      return node

  '::scope':
    prefix: "::scope"
    valueOf: (node) ->
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
