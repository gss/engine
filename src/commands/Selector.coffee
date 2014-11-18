### Selectors with custom combinators 
inspired by Slick of mootools fame (shout-out & credits)

Combinators fetch new elements, while qualifiers filter them.

###

Command = require('../concepts/Command')
Query   = require('./Query')

class Selector extends Query
  type: 'Selector'
  
  constructor: (operation) ->
    @key = @path = @serialize(operation)

  # Build lookup tables for selector operations to match against mutations
  prepare: (operation, parent) ->
    prefix = @getIndexPrefix(operation, parent)
    name = @getIndex(operation, parent)
    suffix = @getIndexSuffix(operation, parent)
    (((parent || @)[prefix + name] ||= {})[suffix] ||= []).push operation
    
    # Register every selector step within a composite selector
    if @tail
      for argument in operation
        if argument.command?.head == (parent || @).head
          argument.command.prepare(argument, parent || @)

  # Do an actual DOM lookup by composed native selector
  perform: (engine, operation, continuation, scope, ascender, ascending) ->
    command = operation.command
    selector = command.selector
    args = [
      if ascender?
        ascending
      else
        scope

      selector
    ]
    command.log(args, engine, operation, continuation, scope, 'qsa')
    result  = command.before(args, engine, operation, continuation, scope)
    result ?= args[0].querySelectorAll(args[1])
    if result  = command.after(args, result, engine, operation, continuation, scope)
      return command.ascend(engine, operation, continuation + selector, scope, result, ascender)


    
  # String to be used to join tokens in a list
  separator: ''
  # Does selector start with &?
  scoped: undefined

  # Redefined function name for serialized key
  prefix: undefined
  # Trailing string for a serialized key
  suffix: undefined

  # String representation of current selector operation
  key: undefined
  # String representation of current selector operation chain
  path: undefined

  # Reference to first operation in tags
  tail: undefined
  # Reference to last operation in tags
  head: undefined

  # Does the selector return only one element?
  singular: undefined
  
  relative: undefined

  # Check if query was already updated
  before: (args, engine, operation, continuation, scope, ascender, ascending) ->
    return engine.queries.fetch(args, operation, continuation, scope)

  # Subscribe elements to query 
  after: (args, result, engine, operation, continuation, scope) ->
    return engine.queries.update(args, result, operation, continuation, scope)
  
  # Methods to build mutation lookup keys:
  # Format is `@[prefix + index][suffix]`
  # Example: Composite selector `h1>div` will generate 
  # `@[' >']['DIV']` and `@[' ']['H1']` as lookup structures
  getIndexPrefix: (operation, parent) ->
    return (parent || @selecting) && ' ' || ''

  getIndex: (operation) ->
    return operation[0]
  
  getIndexSuffix: (operation) ->
    return operation[2] || operation[1]

Selector::checkers.selector = (command, other, parent, operation) ->
  if !other.head
    # Native selectors cant start with combinator other than whitespace
    if other instanceof Selector.Combinator && operation[0] != ' '
      return

  if !command.key && !other.selector && other.key != other.path
    return

  # Can't append combinator to qualifying selector 
  if selecting = command.selecting
    return unless other.selecting

  # Comma can only combine multiple native selectors
  if parent[0] == ','
    return unless (other.selector || other.key) == other.path

  return true



# Logic to combine native selector steps into a single QSA query
Selector::mergers.selector = (command, other, parent, operation, inherited) ->
  if other.selecting
    command.selecting ||= true

  other.head = parent
  command.head = parent
  command.tail = other.tail ||= operation
  command.tail.command.head = parent
  
  left = other.selector || other.key
  right = command.selector || command.key
  command.selector = 
    if inherited
      right + command.separator + left
    else
      left + right
  return true

# Indexed collection
Selector.Selecter = Selector.extend
  signature: [
    query: ['String']
  ]
  
  selecting: true

  getIndexPrefix: ->
    return ' '

# Scoped indexed collections
Selector.Combinator = Selector.Selecter.extend
  signature: [[
    context: ['Selector']
    #query: ['String']
  ]]
  
  getIndexSuffix: (operation) ->
    return operation.parent[0] == 'tag' && operation.parent[2].toUpperCase() || "*"

  getIndexPrefix: (operation, parent)->
    return parent && ' ' || ''
    
    
# Filter elements by key
Selector.Qualifier = Selector.extend
  signature: [
    context: ['Selector']
    matcher: ['String']
  ]

# Filter elements by key with value
Selector.Search = Selector.extend
  signature: [
    [context: ['Selector']]
    matcher: ['String']
    query: ['String']
  ]

Selector.Attribute = Selector.Search.extend
  getIndex: ->
    return 'attribute'
  
# Reference to related element
Selector.Element = Selector.extend
  signature: []

# Optimized element reference outside of selector context
Selector.Reference = Selector.Element.extend

  condition: (engine, operation) ->
    return !(operation.parent.command instanceof Selector)

  # Optimize methods that provide Element signature 
  kind: 'Element'

  # Invisible in continuation
  prefix: ''

  # Does not create DOM observer
  after: ->
    return result

  # Bypasses cache and pairing
  retrieve: ->
    return @execute arguments ...

  reference: true
  
Selector.define
  # Live collections

  '.':
    helpers: ['class', 'getElementsByClassName']
    tags: ['selector']
    
    Selecter: (value, engine, operation, continuation, scope) ->
      return scope.getElementsByClassName(value)
      
    Qualifier: (node, value) ->
      if node.classList.contains(value)
        return node 

  'tag':
    helpers: ['getElementsByTagName']
    tags: ['selector']
    prefix: ''

    Selecter: (value, engine, operation, continuation, scope) ->
      return scope.getElementsByTagName(value)
    
    Qualifier: (node, value) ->
      if value == '*' || node.tagName == value.toUpperCase()
        return node 

  # DOM Lookups

  '#':
    helpers: ['id', 'getElementById']
    tags: ['selector']
    
    Selecter: (id, engine, operation, continuation, scope = engine.scope) ->
      return scope.getElementById?(id) || scope.querySelector('[id="' + id + '"]')
      
    Qualifier: (node, value) ->
      if node.id == value
        return node

    singular: true


  # All descendant elements
  ' ':
    tags: ['selector']
    
    Combinator: 
      execute: (node, engine, operation, continuation, scope) ->
        return (node || scope).getElementsByTagName("*")
      
      getIndexPrefix: ->
        return ''
        
  # All parent elements
  '!':
    Combinator: (node, engine, operation, continuation, scope) ->
      nodes = undefined
      while node = (node || scope).parentNode
        if node.nodeType == 1
          (nodes ||= []).push(node)
      return nodes

  # All children elements
  '>':
    tags: ['selector']

    Combinator: (node, engine, operation, continuation, scope) ->
      return (node || scope).children

  # Parent element
  '!>':
    Combinator: (node, engine, operation, continuation, scope) ->
      return (node || scope).parentElement

  # Next element
  '+':
    tags: ['selector']
    Combinator: (node, engine, operation, continuation, scope) ->
      return (node || scope).nextElementSibling

  # Previous element
  '!+':
    Combinator: (node, engine, operation, continuation, scope) ->
      return (node || scope).previousElementSibling

  # All direct sibling elements
  '++':
    Combinator: (node) ->
      nodes = undefined
      if prev = node.previousElementSibling
        (nodes ||= []).push(prev)
      if next = node.nextElementSibling
        (nodes ||= []).push(next)
      return nodes

  # All succeeding sibling elements
  '~':
    tags: ['selector']

    Combinator: (node) ->
      nodes = undefined
      while node = node.nextElementSibling
        (nodes ||= []).push(node)
      return nodes

  # All preceeding sibling elements
  '!~':
    Combinator: (node) ->
      nodes = undefined
      prev = node.parentNode.firstElementChild
      while prev != node
        (nodes ||= []).push(prev)
        prev = prev.nextElementSibling
      return nodes

  # All sibling elements
  '~~':
    Combinator: (node) ->
      nodes = undefined
      prev = node.parentNode.firstElementChild
      while prev
        if prev != node
          (nodes ||= []).push(prev) 
        prev = prev.nextElementSibling
      return nodes


Selector.define
  # Pseudo elements
  '&':


    # Dont look
    before: ->
      return

    after: (args, result) ->
      return result

    log: ->

    # Dont leave trace in a continuation path
    hidden: true

    serialize: ->
      return ''

    Element: (engine, operation, continuation, scope) ->
      return scope

    retrieve: ->
      return @execute arguments ...

  # Parent element (alias for !> *)
  '^':
    Element: (engine, operation, continuation, scope) ->
      return engine.Continuation.getParentScope(scope, continuation)


  # Current engine scope (defaults to document)
  '$':
    Element: (engine, operation, continuation, scope) ->
      return engine.scope

  # Return abstract reference to window
  '::window':
    Reference: ->
      return '::window' 
      
    stringy: true
  

Selector.define  
  '[=]':
    tags: ['selector']
    prefix: '['
    separator: '="'
    suffix: '"]'
    Attribute: (node, attribute, value) ->
      return node if node.getAttribute(attribute) == value

  '[*=]':
    tags: ['selector']
    prefix: '['
    separator: '*="'
    suffix: '"]'
    Attribute: (node, attribute, value) ->
      return node if node.getAttribute(attribute)?.indexOf(value) > -1

  '[|=]':
    tags: ['selector']
    prefix: '['
    separator: '|="'
    suffix: '"]'
    Attribute: (node, attribute, value) ->
      return node if node.getAttribute(attribute)?

  '[]':
    tags: ['selector']
    prefix: '['
    suffix: ']'
    Attribute: (node, attribute) ->
      return node if node.getAttribute(attribute)?



# Pseudo classes

Selector.define
  ':value':
    Qualifier: (node) ->
      return node.value
    watch: "oninput"

  ':get':
    Qualifier: (node, property, engine, operation, continuation, scope) ->
      return node[property]

  ':first-child':
    tags: ['selector']
    Combinator: (node) ->
      return node unless node.previousElementSibling

  ':last-child':
    tags: ['selector']
    Combinator: (node) ->
      return node unless node.nextElementSibling


  ':next':
    relative: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = engine.queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return if !index? || index == -1 || index == collection.length - 1
      return collection[index + 1]

  ':previous':
    relative: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = engine.queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return if index == -1 || !index
      return collection[index - 1]

  ':last':
    relative: true
    singular: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = engine.queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return unless index?
      return node if index == collection.length - 1

  ':first':
    relative: true
    singular: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = engine.queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return if !index?
      return node if index == 0
  
  # Comma combines results of multiple selectors without duplicates
  ',':
    # If all sub-selectors are selector, make a single comma separated selector
    tags: ['selector']

    # Match all kinds of arguments
    signature: false

    separator: ','

    execute: ->

    # Comma only serializes arguments
    serialize: ->
      return ''

    # Recieve a single element found by one of sub-selectors
    # Duplicates are stored separately, they dont trigger callbacks
    # Actual ascension is defered to make sure collection order is correct 
    yield: (result, engine, operation, continuation, scope, ascender) ->
      contd = engine.Continuation.getScopePath(scope, continuation) + operation.parent.command.path
      engine.queries.add(result, contd, operation.parent, scope, operation, continuation)
      engine.queries.ascending ||= []
      if engine.indexOfTriplet(engine.queries.ascending, operation.parent, contd, scope) == -1
        engine.queries.ascending.push(operation.parent, contd, scope)
      return true

    # Remove a single element that was found by sub-selector
    # Doesnt trigger callbacks if it was also found by other selector
    release: (result, engine, operation, continuation, scope) ->
      contd = engine.Continuation.getScopePath(scope, continuation) + operation.parent.command.path
      engine.queries.remove(result, contd, operation.parent, scope, operation, undefined, continuation)
      return true
    
    # Evaluate arguments without stopping on undefined
    descend: (engine, operation, continuation, scope, ascender, ascending) ->
      for index in [1 ... operation.length] by 1
        if (argument = operation[index]) instanceof Array
          command = argument.command || engine.Command(argument)
          argument.parent ||= operation
          
          # Leave forking/pairing mark in a path when resolving next arguments
          contd = @connect(engine, operation, continuation, scope, undefined, ascender)

          # Evaluate argument
          argument = command.solve(operation.domain || engine, argument, contd || continuation, scope)
      return Array.prototype.slice.call(arguments, 0, 4)
if document?
  # Add shims for IE<=8 that dont support some DOM properties
  dummy = Selector.dummy = document.createElement('_')

  unless dummy.hasOwnProperty("classList")
    Selector['class']::Qualifier = (node, value) ->
      return node if node.className.split(/\s+/).indexOf(value) > -1
      
  unless dummy.hasOwnProperty("parentElement") 
    Selector['!>']::Combinator = Selector['^']::Element = (node) ->
      if parent = node.parentNode
        return parent if parent.nodeType == 1
  unless dummy.hasOwnProperty("nextElementSibling")
    Selector['+']::Combinator = (node) ->
      while node = node.nextSibling
        return node if node.nodeType == 1
    Selector['!+']::Combinator = (node) ->
      while node = node.previousSibling
        return node if node.nodeType == 1
    Selector['++']::Combinator = (node) ->
      nodes = undefined
      prev = next = node
      while prev = prev.previousSibling
        if prev.nodeType == 1
          (nodes ||= []).push(prev)
          break
      while next = next.nextSibling
        if next.nodeType == 1
          (nodes ||= []).push(next)
          break
      return nodes
    Selector['~']::Combinator = (node) ->
      nodes = undefined
      while node = node.nextSibling
        (nodes ||= []).push(node) if node.nodeType == 1
      return nodes
    Selector['!~']::Combinator = (node) ->
      nodes = undefined
      prev = node.parentNode.firstChild
      while prev && (prev != node)
        (nodes ||= []).push(prev) if prev.nodeType == 1
        prev = prev.nextSibling
      return nodes
    Selector['~~']::Combinator = (node) ->
      nodes = undefined
      prev = node.parentNode.firstChild
      while prev
        if prev != node && prev.nodeType == 1
          (nodes ||= []).push(prev) 
        prev = prev.nextSibling
      return nodes
    Selector[':first-child']::Selecter = (node) ->
      if parent = node.parentNode
        child = parent.firstChild
        while child && child.nodeType != 1
          child = child.nextSibling
        return node if child == node
    Selector[':last-child']::Qualifier = (node) ->
      if parent = node.parentNode
        child = parent.lastChild
        while child && child.nodeType != 1
          child = child.previousSibling
        return mpde if child == node

module.exports = Selector