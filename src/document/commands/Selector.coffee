### Selectors with custom combinators 
inspired by Slick of mootools fame (shout-out & credits)

Combinators fetch new elements, while qualifiers filter them.

###

Query   = require('../../engine/Query')

require '../../../vendor/weakmap.js'
require '../../../vendor/MutationObserver.js'

class Selector extends Query
  type: 'Selector'
  
  constructor: (operation) ->
    @key = @path = @serialize(operation)

  # Build lookup tables for selector operations to match against mutations
  prepare: (operation, parent) ->
    return if @prepared
    @prepared = true
    prefix = @getIndexPrefix(operation, parent)
    name = @getIndex(operation, parent)
    suffix = @getIndexSuffix(operation, parent)
    (((parent || @)[prefix + name] ||= {})[suffix] ||= []).push operation
    
    # Register every selector step within a composite selector
    if @tail
      for argument in operation
        if argument.command?.head == (parent || @).head
          argument.command.prepare(argument, parent || @)
    return

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
    command.log(args, engine, operation, continuation, scope, command.selecting && 'select' || 'match')
    result  = command.before(args, engine, operation, continuation, scope)
    node = args[0] || scope
    if command.selecting
      result ?= node.querySelectorAll(args[1])
    else if (result != node) && node.matches(args[1])
      result ?= node
    command.unlog(engine, result)
    if result = command.after(args, result, engine, operation, continuation, scope)
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

  # Methods to build mutation lookup keys:
  # Format is `@[prefix + index][suffix]`
  # Example: Composite selector `h1>div` will generate 
  # `@[' >']['DIV']` and `@[' ']['H1']` as lookup structures
  getIndexPrefix: (operation, parent) ->
    return (parent || @selecting) && ' ' || ''

  getIndex: (operation) ->
    return @prefix ? operation[0]
  
  getIndexSuffix: (operation) ->
    return operation[2] || operation[1]

  getKey: ->
    return @selector || @key

  @options:
    subtree: true
    childList: true
    attributes: true
    characterData: true
    attributeOldValue: true


  @observe: (engine) ->
    if @Observer
      @listener = new @Observer @onMutations.bind(engine)
      @connect(engine)

  @Observer: 
    window? && (window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver)

  @connect: (engine, temporary) ->
    return if temporary && window.JsMutationObserver == @Observer
    @listener.observe engine.scope, @options 

  @disconnect: (engine, temporary) ->
    return if temporary && window.JsMutationObserver == @Observer
    @listener.disconnect()

  @filterMutation: (mutation)->
    parent = mutation.target
    while parent
      if parent.nodeType == 1 && @filterNodeMutation(parent) == false
        return false
      parent = parent.parentNode
    return true

  @filterNodeMutation: (target) ->
    if target._gss
      return false
    return true


  # Listen to changes in DOM to broadcast them all around, update queries in batch
  @onMutations: (mutations) ->
    unless @running
      return if @scope.nodeType == 9
      return @solve('Kick', ->)

    
    result = @solve 'Mutate', String(mutations.length), ->
      if @updating.index > -1
        @updating.reset()

      for mutation in mutations
        if Selector.filterMutation(mutation) == false
          continue
        switch mutation.type
          when "attributes"
            Selector.mutateAttribute(@, mutation.target, mutation.attributeName, mutation.oldValue || '')
          when "childList"
            Selector.mutateChildList(@, mutation.target, mutation)
          when "characterData"
            Selector.mutateCharacterData(@, mutation.target, mutation)
        
        @updating.reflown ||= @scope
      return

    if !@scope.parentNode && @scope.nodeType == 1
      @destroy()
    return result

  @mutateChildList: (engine, target, mutation) ->
    # Invalidate sibling observers
    added = []

    removed = []
    for child in mutation.addedNodes
      if child.nodeType == 1 && @filterNodeMutation(child) != false
        added.push(child)
    for child in mutation.removedNodes
      if child.nodeType == 1 && @filterNodeMutation(child) != false
        if (index = added.indexOf(child)) > -1
          added.splice index, 1
        else
          removed.push(child)
    changed = added.concat(removed)
    if target.tagName == 'STYLE' && mutation.addedNodes[0]?.nodeType != 1
      @mutateCharacterData(engine, target, target)
    if !changed.length
      return

    changedTags = []
    for node in changed
      tag = node.tagName
      if changedTags.indexOf(tag) == -1
        changedTags.push(tag)

    prev = next = mutation
    firstPrev = firstNext = true
    queries = engine.queries
    while (prev = prev.previousSibling)
      if prev.nodeType == 1
        if firstPrev
          @prototype.match(engine, prev, '+', undefined, '*') 
          @prototype.match(engine, prev, '++', undefined, '*')
          firstPrev = false
        @prototype.match(engine, prev, '~', undefined, changedTags)
        @prototype.match(engine, prev, '~~', undefined, changedTags)
        next = prev
    while (next = next.nextSibling)
      if next.nodeType == 1
        if firstNext
          @prototype.match(engine, next, '!+', undefined, '*') 
          @prototype.match(engine, next, '++', undefined, '*')
          firstNext = false
        @prototype.match(engine, next, '!~', undefined, changedTags)
        @prototype.match(engine, next, '~~', undefined, changedTags)


    # Invalidate descendants observers
    @prototype.match(engine, target, '>', undefined, changedTags)
    allAdded = []
    allRemoved = []
    allMoved = []
    moved = []

    for child in added
      @prototype.match(engine, child, '!>', undefined, target)
      allAdded.push(child)
      for el in child.getElementsByTagName('*')
        allAdded.push(el)
    for child in removed
      allRemoved.push(child)
      for el in child.getElementsByTagName('*')
        allRemoved.push(el)
    allChanged = allAdded.concat(allRemoved, allMoved)

    # Generate map of qualifiers to invalidate (to re-query native selectors)
    update = {}
    for node in allChanged
      if node.className
        for kls in node.classList || node.className.split(/\s+/)
          @index update, ' .', kls
      if node.id
        @index update, ' #', node.id

      for attribute in node.attributes
        if attribute.name == 'class' || attribute.name == 'id'
          continue
        @index update, ' attribute', attribute.name
      prev = next = node  
      while prev = prev.previousSibling
        if prev.nodeType == 1
          @index update, ' +', prev.tagName
          break
      while next = next.nextSibling
        if next.nodeType == 1
          break

      @index update, ' :', 'first-child' unless prev
      @index update, ' :', 'last-child' unless next
      @index update, ' +', child.tagName

    parent = target
    while parent#.nodeType == 1
      # Let parents know about inserted nodes
      @prototype.match(engine, parent, ' ', undefined, allChanged)
      for child in allChanged
        @prototype.match(engine, child, '!', undefined, parent)

      for prop, values of update
        for value in values
          if prop.charAt(1) == '$' # qualifiers
            @prototype.match(engine, parent, prop, value)
          else
            @prototype.match(engine, parent, prop, undefined, value)

      break if parent == engine.scope
      break unless parent = parent.parentNode

    # Clean removed elements by id
    for removed in allRemoved
      if allAdded.indexOf(removed) == -1
        if id = engine.identity.find(removed)
          (engine.removed ||= []).push(id)

    if engine.removed
      for added in allAdded
        if (j = engine.removed.indexOf(engine.identity.find(added))) > -1
          engine.removed.splice(j, 1)
    return true

  @mutateCharacterData: (engine, target, parent = target.parentNode) ->
    if id = engine.identity.find(parent)
      if parent.tagName == 'STYLE' 
        if parent.getAttribute('type')?.indexOf('text/gss') > -1
          engine.import(parent)

  @mutateAttribute: (engine, target, name, changed) ->

    # Notify parents about class and attribute changes
    if name == 'class' && typeof changed == 'string'
      klasses = target.classList || target.className.split(/\s+/)
      old = changed.split(' ')
      changed = []
      for kls in old
        changed.push kls unless kls && ((klasses.indexOf && klasses.indexOf(kls) > -1) ? klasses.contains(kls))
      for kls in klasses
        changed.push kls unless kls && old.indexOf(kls) > -1

    parent = target
    while parent
      $attribute = target == parent && 'attribute' || ' attribute'
      @prototype.match(engine, parent, $attribute, name, target)
      if changed?.length && name == 'class'
        $class = target == parent && '.' || ' .'
        for kls in changed
          @prototype.match(engine, parent, $class, kls, target)
      break if parent == engine.scope
      break unless parent = parent.parentNode
    @


  @index: (update, type, value) ->
    if group = update[type]
      return unless group.indexOf(value) == -1
    else
      update[type] = []
    update[type].push(value)


class Selector::Sequence extends Query.Sequence
  type: 'Selector'
  
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

# Indexed collection
Selector.Selecter = Selector.extend
  signature: [
    [context: ['Selector']]
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
    
Selector.Virtual = Selector.extend
  signature: [
    [context: ['Selector']]
    query: ['String']
  ]

# Reference to related element
Selector.Element = Selector.extend
  signature: [[
    parameter: ['Number', 'String']
  ]]

# Optimized element reference outside of selector context
Selector.Reference = Selector.Element.extend
  excludes: ['Selector', 'Iterator']

  condition: (engine, operation) ->
    return @excludes.indexOf(operation.parent.command.type) == -1

  # Optimize methods that provide Element signature 
  kind: 'Element'

  # Invisible in continuation
  prefix: ''

  # Does not create DOM observer
  after: ->
    return result

  # Bypasses cache and pairing
  retrieve: (args...)->
    args.unshift args[1][1]
    return @execute args ...

  reference: true

Selector.define
  # Live collections

  '.':
    helpers: ['class', 'getElementsByClassName']
    tags: ['selector']
      
    Qualifier: (node, value) ->
      if node.classList.contains(value)
        return node 
    
    Selecter: (node = scope, value, engine, operation, continuation, scope) ->
      return node.getElementsByClassName(value)

  'tag':
    helpers: ['getElementsByTagName']
    tags: ['selector']
    prefix: ''

    Selecter: (node = scope, value, engine, operation, continuation, scope) ->
      return node.getElementsByTagName(value)
    
    Qualifier: (node, value) ->
      if value == '*' || node.tagName == value.toUpperCase()
        return node

    getIndexSuffix: (operation) ->
      return operation[operation.length - 1].toUpperCase() 

  # DOM Lookups

  '#':
    helpers: ['id', 'getElementById']
    tags: ['selector']
    
    Selecter: (node = scope, id, engine, operation, continuation, scope = engine.scope) ->
      return node.getElementById?(id) || node.querySelector('[id="' + id + '"]')
      
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

    serialize: (operation) ->
      # A little cheat code to serialize `&.filter` properly
      if Selector[operation.parent[0]]?::Qualifier
        return '&'
      else
        return ''

    log: ->
    unlog: ->

    # Dont leave trace in a continuation path
    hidden: true

    Element: (parameter, engine, operation, continuation, scope) ->
      return scope

    retrieve: ->
      return @execute arguments ...

    # A little hack to avoid adding & multiple times
    continue: (engine, operation, continuation = '') ->
      if (key = @key) == '&' && continuation.charAt(continuation.length - 1) == '&'
        return continuation
      return continuation + @key

  # Parent element (alias for !> *)
  '^':
    Element: (parameter = 1, engine, operation, continuation, scope) ->
      return @getParentScope(engine, scope, continuation, parameter)


  # Current engine scope (defaults to document)
  '$':
    Element: (parameter, engine, operation, continuation, scope) ->
      return engine.scope

  # Return abstract reference to window
  '::document':
    Reference: ->
      return document


  # Return abstract reference to window
  '::window':
    Reference: ->
      return window
  
  'virtual':
    localizers: ['Selector', 'Iterator']

    Virtual: (node, value, engine, operation, continuation, scope) ->
      if !node && @localizers.indexOf(operation.parent.command.type) > -1
        if scope != engine.scope
          node = scope

      prefix = @getScope(engine, node, continuation) || '$'
      return prefix + '"' + value + '"'

    prefix: '"'

    #after: (args, result) ->
    #  return result

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
      
# Collection combinators
Selector.define
  ':next':
    relative: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = @getCanonicalCollection(engine, continuation)
      index = collection?.indexOf(node)
      return if !index? || index == -1 || index == collection.length - 1
      return collection[index + 1]

  ':previous':
    relative: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = @getCanonicalCollection(engine, continuation)
      index = collection?.indexOf(node)
      return if index == -1 || !index
      return collection[index - 1]

  ':last':
    relative: true
    singular: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = @getCanonicalCollection(engine, continuation)
      index = collection?.indexOf(node)
      return unless index?
      return node if index == collection.length - 1

  ':first':
    relative: true
    singular: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      collection = @getCanonicalCollection(engine, continuation)
      index = collection?.indexOf(node)
      return if !index?
      return node if index == 0
  
# Viewport visibility pseudos
Selector.define
      
  ':visible':
    singular: true
    deferred: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      return Selector[':visible-y']::Combinator.apply(@, arguments) && 
             Selector[':visible-x']::Combinator.apply(@, arguments)
    
  ':visible-y': 
    singular: true
    deferred: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      ey = engine.data.watch(node,         'computed-y',      operation, continuation, scope)
      eh = engine.data.watch(node,         'computed-height', operation, continuation, scope)
      sy = engine.data.watch(engine.scope, 'scroll-top',      operation, continuation, scope)
      sh = engine.data.watch(engine.scope, 'computed-height', operation, continuation, scope)
        
      if (ey <= sy && ey + eh > sy + sh)  || # mid
         (ey > sy && ey < sy + sh)        || # top
         (ey + eh > sy && ey + eh < sy + sh) # bottom
        return node

  ':visible-x':
    singular: true
    deferred: true
    Combinator: (node = scope, engine, operation, continuation, scope) ->
      ex = engine.data.watch(node,         'computed-x',     operation, continuation, scope)
      ew = engine.data.watch(node,         'computed-width', operation, continuation, scope)
      sx = engine.data.watch(engine.scope, 'scroll-left',    operation, continuation, scope)
      sw = engine.data.watch(engine.scope, 'computed-width', operation, continuation, scope)

      if (ex <= sx && ex + ew > sx + sw)  || # mid
         (ex > sx && ex < sx + sw)        || # left
         (ex + ew > sx && ex < sx + sw)      # right
        return node


Selector.define
  # Comma combines results of multiple selectors without duplicates
  ',':
    # If all sub-selectors are selector, make a single comma separated selector
    tags: ['selector']

    # Match all kinds of arguments
    signature: false

    separator: ','

    # Comma only serializes arguments
    serialize: ->
      return ''

    # Recieve a single element found by one of sub-selectors
    # Duplicates are stored separately, they dont trigger callbacks
    # Actual ascension is defered to make sure collection order is correct 
    yield: (result, engine, operation, continuation, scope, ascender) ->

      contd = @getPrefixPath(engine, continuation) + operation.parent.command.path
      @add(engine, result, contd, operation.parent, scope, operation, continuation)
      @defer(engine, operation.parent, contd, scope)
      return true

    # Remove a single element that was found by sub-selector
    # Doesnt trigger callbacks if it was also found by other selector
    release: (result, engine, operation, continuation, scope) ->
      contd = @getPrefixPath(engine, continuation) + operation.parent.command.path
      @remove(engine, result, contd, operation.parent, scope, operation, undefined, continuation)
      return true
    
    # Evaluate arguments without stopping on undefined
    descend: (engine, operation, continuation, scope, ascender, ascending) ->
      for index in [1 ... operation.length] by 1
        if (argument = operation[index]) instanceof Array
          argument.parent ||= operation
          # Evaluate argument
          engine.Command(argument).solve(operation.domain || engine, argument, continuation, scope)
      return false



if document?
  # Add shims for IE<=8 that dont support some DOM properties
  dummy = Selector.dummy = document.createElement('_')

  unless dummy.hasOwnProperty("classList")
    Selector['.']::Qualifier = (node, value) ->
      return node if node.className.split(/\s+/).indexOf(value) > -1
      
  if dummy.parentElement != undefined
    Selector['!>']::Combinator = (node = scope, engine, operation, continuation, scope) ->
      if parent = node.parentNode
        return parent if parent.nodeType == 1
  if dummy.nextElementSibling != undefined
    Selector['+']::Combinator = (node = scope, engine, operation, continuation, scope) ->
      while node = node.nextSibling
        return node if node.nodeType == 1
    Selector['!+']::Combinator = (node = scope, engine, operation, continuation, scope) ->
      while node = node.previousSibling
        return node if node.nodeType == 1
    Selector['++']::Combinator = (node = scope, engine, operation, continuation, scope) ->
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
    Selector['~']::Combinator = (node = scope, engine, operation, continuation, scope) ->
      nodes = undefined
      while node = node.nextSibling
        (nodes ||= []).push(node) if node.nodeType == 1
      return nodes
    Selector['!~']::Combinator = (node = scope, engine, operation, continuation, scope) ->
      nodes = undefined
      prev = node.parentNode.firstChild
      while prev && (prev != node)
        (nodes ||= []).push(prev) if prev.nodeType == 1
        prev = prev.nextSibling
      return nodes
    Selector['~~']::Combinator = (node = scope, engine, operation, continuation, scope) ->
      nodes = undefined
      prev = node.parentNode.firstChild
      while prev
        if prev != node && prev.nodeType == 1
          (nodes ||= []).push(prev) 
        prev = prev.nextSibling
      return nodes
    Selector[':first-child']::Selecter = (node = scope, engine, operation, continuation, scope) ->
      if parent = node.parentNode
        child = parent.firstChild
        while child && child.nodeType != 1
          child = child.nextSibling
        return node if child == node
    Selector[':last-child']::Qualifier = (node = scope, engine, operation, continuation, scope) ->
      if parent = node.parentNode
        child = parent.lastChild
        while child && child.nodeType != 1
          child = child.previousSibling
        return mpde if child == node

module.exports = Selector