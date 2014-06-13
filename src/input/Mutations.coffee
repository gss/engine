# Listens for changes in DOM, invalidates cached DOM Queries
# MutationEvent -> Expressions

class Mutations
  options:
    subtree: true
    childList: true
    attributes: true
    characterData: true
    # attributeOldValue: true

  Observer: 
    window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver

  constructor: (@engine, @output) ->
    @_watchers = {}
    @references = @engine.references
    @listener = new @Observer @read.bind(this)
    @listener.observe @engine.scope, @options 

  # Re-evaluate updated queries
  write: (queries) ->
    for query, index in queries by 2
      @output.read query, undefined, queries[index + 1]
    
  # Listen to changes in DOM to broadcast them all around
  read: (mutations) ->
    queries = []
    for mutation in mutations
      target = parent = mutation.target
      switch mutation.type

        when "attributes"
          # Notify parents about class and attribute changes
          if mutation.attributeName == 'class'
            klasses = parent.classList
            old = mutation.oldValue.split(' ')
            changed = []
            for kls in old
              changed.push kls unless kls && klasses.contains(kls)
            for kls in klasses
              changed.push kls unless kls && old.contains(kls)
            while parent.nodeType == 1
              for kls in changed
                @match(queries, parent, '$class', kls, target) 
              parent = parent.parentNode
            parent = target

          while parent.nodeType == 1
            @match(queries, parent, '$attribute', mutation.attributeName, target)
            parent = parent.parentNode

        when "childList"
          # Invalidate sibling observers
          changed = []
          for child in mutation.addedNodes
            if child.nodeType == 1
              changed.push(child)
          for child in mutation.removedNodes
            if child.nodeType == 1
              changed.push(child)
          prev = next = mutation
          firstPrev = firstNext = true
          while (prev = prev.previousSibling)
            if prev.nodeType == 1
              if firstPrev
                @match(queries, prev, '+') 
                @match(queries, prev, '++')
                firstPrev = false
              @match(queries, prev, '~', undefined, changed)
              @match(queries, prev, '~~', undefined, changed)
          while (next = next.nextSibling)
            if next.nodeType == 1
              if firstNext
                @match(queries, next, '!+') 
                @match(queries, next, '++')
                firstNext = false
              @match(queries, next, '!~', undefined, changed)
              @match(queries, next, '~~', undefined, changed)


          # Invalidate descendants observers
          @match(queries, parent, '>', undefined, changed)
          allChanged = []

          for child in changed
            @match(queries, child, '!>', undefined, parent)
            allChanged.push(child)
            allChanged.push.apply(allChanged, undefined, child.getElementsByTagName('*'))

          while parent && parent.nodeType == 1
            @match(queries, parent, ' ', undefined, allChanged)

            for child in allChanged
              prev = child
              while prev = prev.previousSibling
                if prev.nodeType == 1
                  @match(queries, parent, ' +', undefined, prev)
                  break
              @match(queries, parent, ' +', undefined, child)
              @match(queries, child, '!', undefined, parent)
            parent = parent.parentNode

    return true

  # Filters out old values from DOM collections
  filter: (node, result, operation, continuation) ->
    path = (continuation || '') + operation.path
    old = @[path]
    if result == old
      return

    if id = @references.identify(node || @engine.scope)
      watchers = @_watchers[id] ||= []
      if watchers.indexOf(operation) == -1
        watchers.push(operation, continuation)
      
    isCollection = result && result.length != undefined

    if old && old.length
      removed = undefined
      for child in old
        if !result || old.indexOf.call(result, child) == -1
          @references.remove path, child
          removed = true
      if continuation && (!isCollection || !result.length)
        @references.remove continuation, path

    if isCollection
      added = undefined
      for child in result
        if !old || watchers.indexOf.call(old, child) == -1
          @references.append path, child
          (added ||= []).push child if old

      if continuation && (!old || !old.length)
        @references.append continuation, path

      # Snapshot live node list for future reference
      if result && result.item && (!old || removed || added)
        result = watchers.slice.call(result, 0)
    else if result != undefined || old != undefined
      @references.set path, result

    @[path] = result
    if result
      console.log('found', result.nodeType == 1 && 1 || result.length, ' by' ,path)
    return added || result

  match: (queries, node, group, qualifier, changed) ->
    return unless id = node._gss_id
    return unless watchers = @_watchers[id]
    for operation, index in watchers by 2
      if groupped = operation[group]
        if qualifier
          if indexed = groupped[qualifier]
            if queries.indexOf(operation) == -1
              queries.push(operation, watchers[index + 1])
        else
          for change in changed
            if indexed = groupped[change.tagName] || groupped["*"]
              if queries.indexOf(operation) == -1
                queries.push(operation, watchers[index + 1])
    @

module.exports = Mutations