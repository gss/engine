dummy = document.createElement('_')

class Selectors
  # Set up DOM observer and filter out old elements 
  onDOMQuery: (engine, scope, args, result, operation, continuation) ->
    return @engine.mutations.filter(scope || operation.func && args[0], result, operation, continuation)
  
  # Clean up nested when parent selector doesnt match anymore
  onRemove: (continuation, value, id) ->
    if watchers = @input._watchers[id]
      for watcher, index in watchers by 2
        continue unless watcher
        path = (watchers[index + 1] || '') + watcher.path
        watchers[index] = null

        if result = @input[path]
          delete @input[path]
          if result.length != undefined
            for child in result
              @engine.references.remove(path, child)
          else
            @engine.references.remove(path, result)

      delete @input._watchers[id]
    @


  # Selector commands

  '$query':
    group: '$query'
    1: "querySelectorAll"
    2: (node, value) ->
      return node if node.webkitMatchesSelector(value)
      
    # Create a shortcut operation to get through a group of operations
    perform: (object, operation) ->
      name = operation.group
      shortcut = [name, operation.promise]
      shortcut.parent = (operation.head || operation).parent
      shortcut.index = (operation.head || operation).index
      object.preprocess(shortcut)
      tail = operation.tail
      global = tail.arity == 1 && tail.length == 2
      op = operation
      while op
        @.analyze op, shortcut
        break if op == operation.tail
        op = op[1]
      if (operation.tail.parent == operation)
        unless global
          shortcut.splice(1, 0, tail[1])
      return shortcut


    # Walk through commands in selector to make a dictionary used by Observer
    analyze: (operation, parent) ->
      switch operation[0]
        when '$tag'
          if !parent || operation == operation.tail
            group = ' '
            index = (operation[2] || operation[1]).toUpperCase()
        when '$combinator'
          group = parent && ' ' ||  operation.name
          index = operation.parent.name == "$tag" && operation.parent[2].toUpperCase() || "*"
        when '$class', '$pseudo', '$attribute'
          group = operation[0]
          index = operation[2] || operation[1]
      (((parent || operation)[group] ||= {})[index] ||= []).push operation
      index = group = null

    # Native selectors cant start with a non-space combinator or qualifier
    attempt: (operation) ->
      @analyze(operation)
      if operation.name == '$combinator'
        if group[group.skip] != ' '
          return false
      else if operation.arity == 2
        return false
      return true

  
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
      return node if node.tagName == value.toUpperCase()

  '$id':
    prefix: '#'
    group: '$query'
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
    1: 
      if "children" in dummy 
        (node) -> 
          return node.children
      else 
        (node) ->
          child for child in node.childNodes when child.nodeType == 1

  '!>':
    1: 
      if dummy.hasOwnProperty("parentElement") 
        (node) ->
          return node.parentElement
      else
        (node) ->
          if parent = node.parentNode
            return parent if parent.nodeType == 1

  '+':
    group: '$query'
    1: 
      if dummy.hasOwnProperty("nextElementSibling")
        (node) ->
          return node.nextElementSibling
      else
        (node) ->
          while node = node.nextSibling
            return node if node.nodeType == 1

  '!+':
    1:
      if dummy.hasOwnProperty("previousElementSibling")
        (node) ->
          return node.previousElementSibling
      else
        (node) ->
          while node = node.previousSibling
            return node if node.nodeType == 1

  '++':
    1: (node) ->
      nodes = undefined
      while node = node.previousSibling
        if node.nodeType == 1
          (nodes ||= []).push(node)
          break
      while node = node.nextSibling
        if node.nodeType == 1
          (nodes ||= []).push(node)
          break
      return nodes;

  '~':
    group: '$query'
    1: (node) ->
      nodes = undefined
      while node = node.nextSibling
        (nodes ||= []).push(node) if node.nodeType == 1
      return nodes

  '!~':
    1: (node) ->
      nodes = undefined
      while node = node.previousSibling
        (nodes ||= []).push(node) if node.nodeType == 1
      return nodes
  
  '~~':
    1: (node) ->
      nodes = undefined
      while node = node.previousSibling
        (nodes ||= []).push(node) if node.nodeType == 1
      while node = node.nextSibling
        (nodes ||= []).push(node) if node.nodeType == 1
      return nodes

  # Pseudo classes

  ':value':
    1: (node) ->
      return node.value
    watch: "oninput"

  ':get':
    2: (node, property) ->
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

for property, command of Selectors::
  if typeof command == 'object'
    command.callback = 'onDOMQuery'
module.exports = Selectors