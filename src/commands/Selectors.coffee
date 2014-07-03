# Selectors with custom combinators inspired by Slick of mootools fame (shout-out & credits)

class Selectors

  # Set up DOM observer and filter out old elements 

  onQuery: (node, args, result, operation, continuation, scope) ->
    return result if operation.def.hidden
    return @queries.update(node, args, result, operation, continuation, scope)

  remove: (id, continuation, operation, scope) ->
    @queries.remove(id, continuation, operation, scope)
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
      console.error('shortcutting', head.groupped)
      shortcut.parent = head.parent
      shortcut.index = head.index
      shortcut.bound = head.bound if head.bound
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
    scoped: true
    serialized: false
    1: (node, value) ->
      console.error(arguments)
      return @identify(node) + '"' + value + '"'

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
    scoped: true
    hidden: true
    1: (node) ->
      return node

  # Parent element (alias for !> *)
  '::parent':
    1: Selectors::['$!>'][1]

  # Current engine scope (defaults to document)
  '::scope':
    1: (node) ->
      return @scope

  # Return abstract reference to window
  '::window': ->
    return '::window' 


  '$attribute':
    lookup: true
    group: '$query'
    type: 'qualifier'
    prefix: '['
    suffix: ']'
    serialize: -> (operation, args) ->
      name = operation.name
      return (args[1]) + name.substring(1, name.length - 1) + '"' + (args[2] || '') + '"'

  '[=]': (node, attribute, value, operator) ->
    return node if node.getAttribute(attribute) == value

  '[*=]': (node, attribute, value, operator) ->
    return node if  node.getAttribute(attribute)?.indexOf(value) > -1
  
  '[|=]': (node, attribute, value, operator) ->
    return node if  node.getAttribute(attribute)?
  
  '[]': (node, attribute, value, operator) ->
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
      
# Set up custom trigger for all selector operations
# to filter out old elements from collections
for property, command of Selectors::
  if typeof command == 'object' && command.serialized != false
    command.callback = '_onQuery'
    command.serialized = true


# Add shims for IE<=8 that dont support some DOM properties
dummy = document.createElement('_')

unless dummy.hasOwnProperty("parentElement") 
  Selectors::['$!>'][1] = Selectors::['::parent'][1] = (node) ->
    if parent = node.parentNode
      return parent if parent.nodeType == 1
unless dummy.hasOwnProperty("nextElementSibling")
  Selectors::['$>'][1] = (node) ->
      child for child in node.childNodes when child.nodeType == 1
  Selectors::['$+'][1] = (node) ->
    while node = node.nextSibling
      return node if node.nodeType == 1
  Selectors::['$!+'][1] = ->
    while node = node.previousSibling
      return node if node.nodeType == 1
  Selectors::['$++'][1] = (node) ->
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
  Selectors::['$~'][1] = (node) ->
    nodes = undefined
    while node = node.nextSibling
      (nodes ||= []).push(node) if node.nodeType == 1
    return nodes
  Selectors::['$!~'][1] = (node) ->
    nodes = undefined
    prev = node.parentNode.firstChild
    while prev != node
      (nodes ||= []).push(prev) if pref.nodeType == 1
      node = node.nextSibling
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
      return child == node


module.exports = Selectors