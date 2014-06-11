class Observer
  constructor: (@object) ->
    # Polyfill
    unless window.MutationObserver
      if window.WebKitMutationObserver
        window.MutationObserver = window.WebKitMutationObserver
      else
        window.MutationObserver = window.JsMutationObserver

    return unless window.MutationObserver
    @_watchers = {}
    @observer = new MutationObserver @listen.bind(this)
    @observer.observe(document.body, GSS.config.observerOptions)


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

  update: (operation, path) ->
    old = @[path]
    if operation.name == '$query'
      result = @object.evaluate operation, undefined, path

    if result == old
      return
    if (result && result.length) || (old && old.length)
      for child in old
        if old.indexOf.call(result, child) == -1
          1
        added = []
        for child in result
          added.push child if old.indexOf(child) == -1
        return added;
    return result

  compare: (path, result) ->
    added = []
    removed = []
    old = @values[path]


  set: (node, result, operation, path) ->
    old = @[id]

    console.log('observing', node, [GSS.setupId(node)], operation)
    if id = GSS.setupId(node)
      (@_watchers[id] ||= []).push(operation, path)
    if result && result.item
      result = Array.prototype.slice.call(result, 0)
    @[path] = result



  listen: (mutations) ->
    console.log('observer', mutations)
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
                @match(queries, prev, '!+') 
                @match(queries, prev, '++')
                firstNext = false
              @match(queries, prev, '!~', undefined, changed)
              @match(queries, prev, '~~', undefined, changed)


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
              @match(queries, child, '!', undefined, parent)
            parent = parent.parentNode

    console.log("Queries:", queries, queries.length) 
    for query, index in queries by 2
      @update query, queries[index + 1]
    return true
module.exports = Observer
