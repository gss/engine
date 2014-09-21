class Mutations
  options:
    subtree: true
    childList: true
    attributes: true
    characterData: true
    attributeOldValue: true


  constructor: (@engine) ->
    @listener = new @Observer @solve.bind(this)

  Observer: 
    window? && (window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver)

  connect: ->
    @listener.observe @engine.scope, @options 

  disconnect: ->
    @listener.disconnect()

  # Listen to changes in DOM to broadcast them all around, update queries in batch
  solve: (mutations) ->
    return @engine.engine.compile(true) unless @engine.engine.running
    console.error(mutations)
    result = @engine.engine.solve 'mutations', ->
      @engine.updating.queries = undefined
      @engine.updating.reflown = undefined
      qualified = @queries.qualified = @engine.updating.qualified = []
      for mutation in mutations
        switch mutation.type
          when "attributes"
            @mutations.onAttributes(mutation.target, mutation.attributeName, mutation.oldValue)
          when "childList"
            @mutations.onChildList(mutation.target, mutation)
          when "characterData"
            @mutations.onCharacterData(mutation.target, mutation)

        @intrinsic.validate(mutation.target)
      return

    if !@engine.scope.parentNode && @engine.scope.nodeType == 1
      @engine.destroy()
    return result

  onChildList: (target, mutation) ->
    # Invalidate sibling observers
    added = []
    removed = []
    for child in mutation.addedNodes
      if child.nodeType == 1
        added.push(child)
    for child in mutation.removedNodes
      if child.nodeType == 1
        if (index = added.indexOf(child)) > -1
          added.splice index, 1
        else
          removed.push(child)
    changed = added.concat(removed)
    changedTags = []
    for node in changed
      tag = node.tagName
      if changedTags.indexOf(tag) == -1
        changedTags.push(tag)

    prev = next = mutation
    firstPrev = firstNext = true
    while (prev = prev.previousSibling)
      if prev.nodeType == 1
        if firstPrev
          @engine.queries.match(prev, '+', undefined, '*') 
          @engine.queries.match(prev, '++', undefined, '*')
          firstPrev = false
        @engine.queries.match(prev, '~', undefined, changedTags)
        @engine.queries.match(prev, '~~', undefined, changedTags)
        next = prev
    while (next = next.nextSibling)
      if next.nodeType == 1
        if firstNext
          @engine.queries.match(next, '!+', undefined, '*') 
          @engine.queries.match(next, '++', undefined, '*')
          firstNext = false
        @engine.queries.match(next, '!~', undefined, changedTags)
        @engine.queries.match(next, '~~', undefined, changedTags)


    # Invalidate descendants observers
    @engine.queries.match(target, '>', undefined, changedTags)
    allAdded = []
    allRemoved = []
    allMoved = []
    moved = []

    for child in added
      @engine.queries.match(child, '!>', undefined, target)
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
      for attribute in node.attributes
        switch attribute.name
          when 'class'
            for kls in node.classList
              @index update, ' $class', kls
          when 'id'
            @index update, ' $id', attribute.value

        @index update, ' $attribute', attribute.name
      prev = next = node  
      while prev = prev.previousSibling
        if prev.nodeType == 1
          @index update, ' +', prev.tagName
          break
      while next = next.nextSibling
        if next.nodeType == 1
          break

      @index update, ' $pseudo', 'first-child' unless prev
      @index update, ' $pseudo', 'last-child' unless next
      @index update, ' +', child.tagName

    parent = target
    while parent#.nodeType == 1
      # Let parents know about inserted nodes
      @engine.queries.match(parent, ' ', undefined, allChanged)
      for child in allChanged
        @engine.queries.match(child, '!', undefined, parent)

      for prop, values of update
        for value in values
          if prop.charAt(1) == '$' # qualifiers
            @engine.queries.match(parent, prop, value)
          else
            @engine.queries.match(parent, prop, undefined, value)

      break if parent == @engine.scope
      break unless parent = parent.parentNode

    # Clean removed elements by id
    for removed in allRemoved
      if allAdded.indexOf(removed) == -1
        if id = @engine.identity.find(removed)
          (@engine.removed ||= []).push(id)

    if @engine.removed
      for added in allAdded
        if (j = @engine.removed.indexOf(@engine.identity.find(added))) > -1
          @engine.removed.splice(j, 1)
    @

  index: (update, type, value) ->
    if group = update[type]
      return unless group.indexOf(value) == -1
    else
      update[type] = []
    update[type].push(value)

  onCharacterData: (target) ->
    parent = target.parentNode
    if id = @engine.identity.find(parent)
      if parent.tagName == 'STYLE' 
        if parent.getAttribute('type')?.indexOf('text/gss') > -1
          @engine.eval(parent)

  onAttributes: (target, name, changed) ->
    # Notify parents about class and attribute changes
    if name == 'class' && typeof changed == 'string'
      klasses = target.classList
      old = changed.split(' ')
      changed = []
      for kls in old
        changed.push kls unless kls && klasses.contains(kls)
      for kls in klasses
        changed.push kls unless kls && old.indexOf(kls) > -1

    parent = target
    while parent
      $attribute = target == parent && '$attribute' || ' $attribute'
      @engine.queries.match(parent, $attribute, name, target)
      if changed?.length && name == 'class'
        $class = target == parent && '$class' || ' $class'
        for kls in changed
          @engine.queries.match(parent, $class, kls, target)
      break if parent == @engine.scope
      break unless parent = parent.parentNode
    @

module.exports = Mutations