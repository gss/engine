###

Root commands, if bound to a dom query, will spawn commands
to match live results of query.

###

# Commander
# ======================================================== 
#
# transforms & generates needed commands for engine

Processor = require('./Processor.js')
Observer = require('./Observer.js')
Memory = require('./Memory.js')


class Commander extends Processor

  constructor: (engine) ->
    @engine = engine
    @memory = new Memory(@)
    @observer = new Observer(@)
    super()

  toId: (value) ->
    return value && value.nodeType && "$" + GSS.setupId(value)
    
  execute: (ast) ->
    if ast.commands?
      for command in ast.commands 
        if ast.isRule
          command.parentRule = ast
        @evaluate command

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
    
  'get$':
    prefix: '['
    suffix: ']'
    command: (path, object, property) ->
      console.log(path, object, property)
      if object.nodeType
        id = GSS.setupId(object)
      else if object.absolute is 'window'
        return ['get',"::window[#{prop}]", path]

    
      # intrinsics
      if property.indexOf("intrinsic-") is 0
        if @register "$" + id + "[intrinsic]", context
          val = @engine.measureByGssId(id, property)
          # intrinsics always need remeasurement
          engine.setNeedsMeasure true
          if engine.vars[k] isnt val
            return ['suggest', ['get', property, id, path], ['number', val], 'required'] 
      debugger
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
    group: '$query'
    1: "querySelectorAll"
    2: (node, value) ->
      return node if node.webkitMatchesSelector(value)
    
  
  '$class':
    prefix: '.'
    group: '$query'
    type: 'qualifier'
    1: "getElementsByClassName"
    2: (node, value) ->
      return node if node.classList.contains(value)

  '$tag':
    prefix: ''
    group: '$query'
    type: 'qualifier'
    1: "getElementsByTagName"
    2: (node, value) ->
      return node if node.tagName == value.toUpperCase()

  '$id':
    prefix: '#'
    group: '$query'
    type: 'qualifier'
    1: "getElementById"
    2: (node, value) ->
      return node if node.id == name

  '$virtual':
    prefix: '"'
    suffix: '"'

  '$nth':
    prefix: ':nth('
    suffix: ')'
    command: (node, divisor, comparison) ->
      nodes = []
      for i, node in node
        if i % parseInt(divisor) == parseInt(comparison)
          nodes.push(nodes)
      return nodes


  # Commands that look up other commands
  
  '$attribute': 
    type: 'qualifier'
    prefix: '['
    suffix: ']'
    lookup: true

  '$pseudo': 
    type: 'qualifier'
    prefix: ':'
    lookup: true

  '$combinator':
    type: 'combinator'
    lookup: true

  '$reserved':
    type: 'combinator'
    prefix: '::'
    lookup: true

  'number': (operation) ->
    return parseFloat(operation[1])


  # CSS Combinators with reversals

  ' ':
    group: '$query'
    1: (node) ->
      return node.getElementsByTagName("*")

  '!':
    1: (node) ->
      nodes = undefined
      while node = node.parentNode
        if node.nodeType == 1
          (nodes ||= []).push(node)
      return nodes

  '>':
    group: '$query'
    1: (node) ->
      return node.children

  '!>':
    1: (node) ->
      return node.parentNode

  '+':
    group: '$query'
    1: (node) ->
      return node.nextElementSibling

  '!+':
    1: (node) ->
      return node.previousElementSibling

  '++':
    1: (node) ->
      nodes = undefined
      if prev = node.previousElementSibling
        (nodes ||= []).push(prev)
      if next = node.nextElementSibling
        (nodes ||= []).push(next)
      return nodes;

  '~':
    group: '$query'
    1: (node) ->
      nodes = undefined
      while node = node.nextElementSibling
        (nodes ||= []).push(node)
      return nodes

  '!~':
    1: (node) ->
      nodes = undefined
      while node = node.previousElementSibling
        (nodes ||= []).push(node)
      return nodes
  
  '~~':
    1: (node) ->
      nodes = undefined
      while node = node.previousElementSibling
        (nodes ||= []).push(node)
      while node = node.nextElementSibling
        (nodes ||= []).push(node)
      return nodes

  # Pseudo classes

  ':value':
    1: (node) ->
      return node.value
    watch: "oninput"

  ':get':
    2: (node, property) ->
      console.log(node, property)
      debugger
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
  
  'get': true

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
