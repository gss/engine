### Selectors with custom combinators 
inspired by Slick of mootools fame (shout-out & credits)

Combinators/qualifiers are map/reduce of DOM tree.
Selectors are parsed into individual functional steps.
Steps are combined when possible into querySelectorAll calls

Map: If step returns collection, the rest of selector 
is executed for each element in collection 

Filter: If step returns single element, e.g. it matches qualifier,
or points to a another element, execution is continued (reduce)

Reduce: Otherwise, the selector branch doesnt match, execution stops.
Found elements are collected into a shared collection 

When it hits the end of selector, parent expression is evaluated 
with found element.
###

class Selectors
  # Return cached for DOM queries that we updated this tick
  onBeforeQuery: (node, args, operation, continuation, scope) ->
    return if operation.def.hidden
    return @queries.fetch(node, args, operation, continuation, scope)

  # Observe hits to DOM, subscribe elements to query 
  onQuery: (node, args, result, operation, continuation, scope) ->
    return result if operation.def.hidden
    return @queries.update(node, args, result, operation, continuation, scope)

   # Walk through commands in selector to make a dictionary used by Observer
  onSelector: (operation, parent, def) ->
    prefix = ((parent && operation.name != ' ') || 
              (operation[0] != '$combinator' && typeof operation[1] != 'object')) && 
              ' ' || ''
    switch operation[0]
      when '$tag'
        if (!parent || operation == operation.tail) && operation[1][0] != '$combinator'
          group = ' '
          index = (operation[2] || operation[1]).toUpperCase()
      when '$combinator'
        group = prefix +  operation.name
        index = operation.parent.name == "$tag" && operation.parent[2].toUpperCase() || "*"
      when '$class', '$pseudo', '$attribute', '$id'
        group = prefix + operation[0]
        index = (operation[2] || operation[1])
    return unless group
    (((parent || operation)[group] ||= {})[index] ||= []).push operation

  # Selector commands

  '$first': 
    group: '$query'
    1: "querySelector"

  '$query':
    group: '$query'
    1: "querySelectorAll"
    2: (node, value) ->
      return node if node.webkitMatchesSelector(value)
      
    # Create a shortcut operation to get through a group of operations
    perform: (operation) ->
      head = operation.head || operation
      name = operation.def.group
      shortcut = [name, head.groupped]
      shortcut.parent = head.parent
      shortcut.index = head.index
      shortcut.bound = head.bound if head.bound
      @Operation.analyze(shortcut)
      tail = operation.tail
      unless global = tail.arity == 1 && tail.length == 2
        shortcut.splice(1, 0, tail[1])
      op = head
      while op?.push
        @onSelector op, shortcut, op.def
        break if op == tail
        op = op[1]
      unless global
        if (tail.parent == operation)
          shortcut.splice(1, 0, tail[1])
      if shortcut.length > 2
        if operation.marked
          shortcut.marked = operation.marked
          shortcut.path = shortcut.key = head.path

      return shortcut

    # Add * to a combinator at the end of native selector (e.g. `+` transforms to `+ *`)
    promise: (operation, parent) ->
      if operation.def.separator
        for arg, index in operation
          continue unless index
      promise = operation.groupped
      if operation.tail
        if operation[0] == '$combinator' && (parent[0] == '$combinator' || parent[0] == ',')
          promise += "*"
      return promise

    # Native selectors cant start with a non-space combinator or qualifier
    condition: (operation) ->
      if operation[0] == '$combinator'
        if operation.name != ' '
          return false
      else if operation.arity == 2
        return false
      return true

  # Live collections

  '$class':
    prefix: '.'
    group: '$query'
    1: "getElementsByClassName"
    2: (node, value) ->
      return node if node.classList.contains(value)

  '$tag':
    prefix: ''
    group: '$query'
    1: "getElementsByTagName"
    2: (node, value) ->
      return node if value == '*' || node.tagName == value.toUpperCase()

  # DOM Lookups

  '$id':
    prefix: '#'
    group: '$query'
    scoped: true
    1: "getElementById"
    2: (node, value) ->
      return node if node.id == value

  # Live collections index their nodes by id in NodeList object
  # We use a single document.all-like collection on sub-engines
  # But numeric ids need workaround: Keys are set, but not values
  # So we fall back to querySelect 
  'getElementById': (node, id = node) ->
    return (node.nodeType && node || @scope).querySelector('[id="' + id + '"]')

  '$virtual':
    prefix: '"'
    suffix: '"'
    virtual: true
    1: (value) ->
      return '"' + value + '"'
    command: (o,c,s,m, scope, value) ->
      if c?.charAt(0) == @Continuation.PAIR
        collection = [@identity.provide(scope) + '"' + value + '"']
        collection.isCollection = true
        collection
      else
        @identity.provide(scope) + '"' + value + '"'

  # Filters

  '$nth':
    prefix: ':nth('
    suffix: ')'
    command: (node, divisor, comparison) ->
      nodes = []
      for i, node in node
        if i % parseInt(divisor) == parseInt(comparison)
          nodes.push(nodes)
      return nodes

  # CSS Combinators with reversals

  '$combinator':
    prefix: ''
    type: 'combinator'
    lookup: '$'

  # All descendant elements
  '$ ':
    group: '$query'
    1: (node) ->
      return node.getElementsByTagName("*")

  # All parent elements
  '$!':
    1: (node) ->
      nodes = undefined
      while node = node.parentNode
        if node.nodeType == 1
          (nodes ||= []).push(node)
      return nodes

  # All children elements
  '$>':
    group: '$query'
    1: (node) -> 
      return node.children

  # Parent element
  '$!>':
    1: (node) ->
      return node.parentElement

  # Next element
  '$+':
    group: '$query'
    1: (node) ->
      return node.nextElementSibling

  # Previous element
  '$!+':
    1: (node) ->
      return node.previousElementSibling

  # All direct sibling elements
  '$++':
    1: (node) ->
      nodes = undefined
      if prev = node.previousElementSibling
        (nodes ||= []).push(prev)
      if next = node.nextElementSibling
        (nodes ||= []).push(next)
      return nodes

  # All succeeding sibling elements
  '$~':
    group: '$query'
    1: (node) ->
      nodes = undefined
      while node = node.nextElementSibling
        (nodes ||= []).push(node)
      return nodes

  # All preceeding sibling elements
  '$!~':
    1: (node) ->
      nodes = undefined
      prev = node.parentNode.firstElementChild
      while prev != node
        (nodes ||= []).push(prev)
        prev = prev.nextElementSibling
      return nodes

  # All sibling elements
  '$~~':
    1:(node) ->
      nodes = undefined
      prev = node.parentNode.firstElementChild
      while prev
        if prev != node
          (nodes ||= []).push(prev) 
        prev = prev.nextElementSibling
      return nodes



  # Pseudo elements

  '$reserved':
    type: 'combinator'
    prefix: '::'
    lookup: true

  '::this':
    hidden: true
    mark: 'ASCEND'
    command: (operation, continuation, scope, meta, node) ->
      return node || scope

  # Parent element (alias for !> *)
  '::parent':
    1: Selectors::['$!>'][1]

  # Current engine scope (defaults to document)
  '::scope':
    hidden: true
    1: (node) ->
      return @scope

  # Return abstract reference to window
  '::window': 
    hidden: true
    command: ->
      return '::window' 



  '[=]': 
    binary: true
    quote: true
    group: '$query'
    prefix: '['
    suffix: ']'
    command: (operation, continuation, scope, meta, node, attribute, value, operator) ->
      return node if node.getAttribute(attribute) == value

  '[*=]': 
    binary: true
    quote: true
    prefix: '['
    suffix: ']'
    group: '$query'
    command: (operation, continuation, scope, meta, node, attribute, value, operator) ->
      return node if node.getAttribute(attribute)?.indexOf(value) > -1
  
  '[|=]': 
    binary: true
    quote: true
    group: '$query'
    prefix: '['
    suffix: ']'
    command: (operation, continuation, scope, meta, node, attribute, value, operator) ->
      return node if  node.getAttribute(attribute)?
  
  '[]': 
    group: '$query'
    prefix: '['
    suffix: ']'
    command: (operation, continuation, scope, meta, node, attribute, value, operator) ->
      return node if  node.getAttribute(attribute)?



  # Pseudo classes

  '$pseudo': 
    type: 'qualifier'
    prefix: ':'
    lookup: true

  ':value':
    1: (node) ->
      return node.value
    watch: "oninput"

  ':get':
    2: (node, property) ->
      return node[property]

  ':first-child':
    group: '$query'
    1: (node) ->
      return node unless node.previousElementSibling

  ':last-child':
    group: '$query'
    1: (node) ->
      return node unless node.nextElementSibling

  ':next':
    relative: true
    command: (operation, continuation, scope, meta, node) ->
      collection = @queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return if !index? || index == -1 || index == collection.length - 1
      return collection[index + 1]

  ':previous':
    relative: true
    command: (operation, continuation, scope, meta, node) ->
      collection = @queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return if index == -1 || !index
      return collection[index - 1]

  ':last':
    relative: true
    singular: true
    command: (operation, continuation, scope, meta, node) ->
      collection = @queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return if !index?
      return node if index == collection.length - 1

  ':first':
    relative: true
    singular: true
    command: (operation, continuation, scope, meta, node) ->
      collection = @queries.getScopedCollection(operation, continuation, scope)
      index = collection?.indexOf(node)
      return if !index?
      return node if index == 0
      
# Set up custom trigger for all selector operations
# to filter out old elements from collections
for property, command of Selectors::
  if (typeof command == 'object' && command.serialized != false) || command.serialized
    command.before = 'onBeforeQuery'
    command.after = 'onQuery'
    command.init = 'onSelector'
    command.serialized = true

if document?
  # Add shims for IE<=8 that dont support some DOM properties
  dummy = (@GSS || @Engine || Selectors).dummy = document.createElement('_')

  unless dummy.hasOwnProperty("classList")
    Selectors::['$class'][2] = (node, value) ->
      return node if node.className.split(/\s+/).indexOf(value) > -1
        
  unless dummy.hasOwnProperty("parentElement") 
    Selectors::['$!>'][1] = Selectors::['::parent'][1] = (node) ->
      if parent = node.parentNode
        return parent if parent.nodeType == 1
  unless dummy.hasOwnProperty("nextElementSibling")
    Selectors::['$+'][1] = (node) ->
      while node = node.nextSibling
        return node if node.nodeType == 1
    Selectors::['$!+'][1] = (node) ->
      while node = node.previousSibling
        return node if node.nodeType == 1
    Selectors::['$++'][1] = (node) ->
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
    Selectors::['$~'][1] = (node) ->
      nodes = undefined
      while node = node.nextSibling
        (nodes ||= []).push(node) if node.nodeType == 1
      return nodes
    Selectors::['$!~'][1] = (node) ->
      nodes = undefined
      prev = node.parentNode.firstChild
      while prev && (prev != node)
        (nodes ||= []).push(prev) if prev.nodeType == 1
        prev = prev.nextSibling
      return nodes
    Selectors::['$~~'][1] = (node) ->
      nodes = undefined
      prev = node.parentNode.firstChild
      while prev
        if prev != node && prev.nodeType == 1
          (nodes ||= []).push(prev) 
        prev = prev.nextSibling
      return nodes
    Selectors::[':first-child'][1] = (node) ->
      if parent = node.parentNode
        child = parent.firstChild
        while child && child.nodeType != 1
          child = child.nextSibling
        return node if child == node
    Selectors::[':last-child'][1] = (node) ->
      if parent = node.parentNode
        child = parent.lastChild
        while child && child.nodeType != 1
          child = child.previousSibling
        return mpde if child == node

for property, value of Selectors::
  Selectors::[property] = new Selector(value)

module.exports = Selectors