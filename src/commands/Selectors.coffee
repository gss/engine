# Selectors with custom combinators inspired by Slick of mootools fame (shout-out & credits)

class Selectors

  # Set up DOM observer and filter out old elements 

  onQuery: (node, args, result, operation, continuation, scope) ->
    return result if operation.def.hidden
    return @queries.update(node, args, result, operation, continuation, scope)

  remove: (id, continuation, operation) ->
    @queries.remove(id, continuation, operation)
    return

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
      @expressions.analyze(shortcut)
      tail = operation.tail
      unless global = tail.arity == 1 && tail.length == 2
        shortcut.splice(1, 0, tail[1])
      op = head
      while op
        @commands['$query'].analyze.call @, op, shortcut
        break if op == tail
        op = op[1]
      if (tail.parent == operation)
        unless global
          shortcut.splice(1, 0, tail[1])
      return shortcut


    # Walk through commands in selector to make a dictionary used by Observer
    analyze: (operation, parent) ->
      prefix = (parent || (operation[0] != '$combinator' && typeof operation[1] != 'object')) && ' ' || ''
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

    # Add * to a combinator at the end of native selector (e.g. `+` transforms to `+ *`)
    promise: (operation, parent) ->
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
    1: "getElementById"
    2: (node, value) ->
      return node if node.id == value

  # Live collections index their nodes by id in NodeList object
  # We use a single document.all-like collection on sub-engines
  # But numeric ids need workaround: Keys are set, but not values
  # So we fall back to querySelect 
  'getElementById': (node, id = node) ->
    if !(found = @all[id]) && isFinite(parseInt(id))
      return (node.nodeType && node || @scope).querySelector('[id="' + id + '"]')
    return found

  '$virtual':
    prefix: '"'
    suffix: '"'

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
    prefix: ''
    type: 'combinator'
    lookup: true

  '$reserved':
    type: 'combinator'
    prefix: '::'
    lookup: true

  # Comma combines found elements from multiple selectors without duplicates
  ',':
    # If all sub-selectors are native, make a single comma separated selector
    group: '$query'

    # Separate arguments with commas during serialization
    separator: ','

    # Dont let undefined arguments stop execution
    eager: true

    # Comma needs to know its scope element to generate proper cache key
    scoped: true

    # Commas disregard continuation path, because their path is global
    # - comma separated list of selectors. So we prepend scope id to disambiguate 
    serialize: (scope, operation) ->
      if scope && scope != @scope
        return @recognize(scope) + operation.path
      else
        return operation.path

    # Return deduplicated collection of all found elements
    command: (scope, operation) ->
      continuation = @commands[','].serialize.call(@, scope, operation)
      return @queries.get(continuation)

    # Recieve a single element found by one of sub-selectors
    # Duplicates are stored separately, they dont trigger callbacks
    capture: (result, operation, continuation, scope) -> 
      continuation = @commands[','].serialize.call(@, scope, operation)
      @queries.add(result, continuation, scope, scope)
      return

    # Remove a single element that was found by sub-selector
    # Doesnt trigger callbacks if it was also found by other selector
    release: (result, operation, scope, child) ->
      continuation = @commands[','].serialize.call(@, scope, operation)
      @queries.remove(result, continuation, child, scope)
      return

  # CSS Combinators with reversals

  # All descendant elements
  ' ':
    group: '$query'
    1: (node) ->
      return node.getElementsByTagName("*")

  # All parent elements
  '!':
    1: (node) ->
      nodes = undefined
      while node = node.parentNode
        if node.nodeType == 1
          (nodes ||= []).push(node)
      return nodes

  # All children elements
  '>':
    group: '$query'
    1: (node) -> 
      return node.children

  # Parent element
  '!>':
    1: (node) ->
      return node.parentElement

  # Next element
  '+':
    group: '$query'
    1: (node) ->
      return node.nextElementSibling

  # Previous element
  '!+':
    1: (node) ->
      return node.previousElementSibling

  # All direct sibling elements
  '++':
    1: (node) ->
      nodes = undefined
      if prev = node.previousElementSibling
        (nodes ||= []).push(prev)
      if next = node.nextElementSibling
        (nodes ||= []).push(next)
      return nodes

  # All succeeding sibling elements
  '~':
    group: '$query'
    1: (node) ->
      nodes = undefined
      while node = node.nextElementSibling
        (nodes ||= []).push(node)
      return nodes

  # All preceeding sibling elements
  '!~':
    1: (node) ->
      nodes = undefined
      prev = node.parentNode.firstElementChild
      while prev != node
        (nodes ||= []).push(prev)
        prev = prev.nextElementSibling
      return nodes

  # All sibling elements
  '~~':
    1:(node) ->
      nodes = undefined
      prev = node.parentNode.firstElementChild
      while prev
        if prev != node
          (nodes ||= []).push(prev) 
        prev = prev.nextElementSibling
      return nodes

  # Pseudo classes

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



  # Pseudo elements

  '::this':
    scoped: true
    hidden: true
    1: (node) ->
      return node

  # Parent element (alias for !> *)
  '::parent':
    1: Selectors::['!>'][1]

  # Current engine scope (defaults to document)
  '::scope':
    1: (node) ->
      return @scope

  # Return abstract reference to window
  '::window': ->
    return '::window' 

# Set up custom trigger for all selector operations
# to filter out old elements from collections
for property, command of Selectors::
  if typeof command == 'object'
    command.callback = '_onQuery'
    command.serialized = true


# Add shims for IE<=8 that dont support some DOM properties
dummy = document.createElement('_')

unless dummy.hasOwnProperty("parentElement") 
  Selectors::['!>'][1] = Selectors::['::parent'][1] = (node) ->
    if parent = node.parentNode
      return parent if parent.nodeType == 1
unless dummy.hasOwnProperty("nextElementSibling")
  Selectors::['>'][1] = (node) ->
      child for child in node.childNodes when child.nodeType == 1
  Selectors::['+'][1] = (node) ->
    while node = node.nextSibling
      return node if node.nodeType == 1
  Selectors::['!+'][1] = ->
    while node = node.previousSibling
      return node if node.nodeType == 1
  Selectors::['++'][1] = (node) ->
    nodes = undefined
    while prev = node.previousSibling
      if prev.nodeType == 1
        (nodes ||= []).push(prev)
        break
    while next = node.nextSibling
      if next.nodeType == 1
        (nodes ||= []).push(next)
        break
    return nodes;
  Selectors::['~'][1] = (node) ->
    nodes = undefined
    while node = node.nextSibling
      (nodes ||= []).push(node) if node.nodeType == 1
    return nodes
  Selectors::['!~'][1] = (node) ->
    nodes = undefined
    prev = node.parentNode.firstChild
    while prev != node
      (nodes ||= []).push(prev) if pref.nodeType == 1
      node = node.nextSibling
    return nodes
  Selectors::['~~'][1] = (node) ->
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
      return child == node


module.exports = Selectors