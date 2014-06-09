class Observer
  constructor: (@object) ->

  preprocess: (operation) ->
    op = operation
    group = operation.group
    while (op.type == 'combinator' || op.type == 'qualifier') && group == operation.group
      group = (commands ||= operation.commands = {})[op.name] = {}
      op = op[1]
    operation

  update: (node, command, key, added, removed) ->
    return unless id = node._gss_id
    return unless watchers = @watchers[id]
    for operation, index in watchers by 2
      commands = operation.commands ? @preprocess(operation).commands
      if group = commands[command]
        if 
      if watcher.name == command
        @evaluate watcher
      watcher = watcher[1]

  add: (node, operation, continuation) ->
    console.log(node, operation)
    if id = @object.toId(node)
      (@[id] ||= []).push(operation, continuation)

  observer: (mutations) ->
    target = parent = mutation.target
    for mutation in mutations
      switch mutation.type

        when "attributes"

          # Notify parents about class and attribute changes
          if mutation.attributeName == 'class'
            klasses = parent.classList
            old = mutation.oldValue.split(' ')
            added = []
            removed = []
            for kls in old
              removed.push kls unless kls && klasses.contains(kls)
            for kls in klasses
              added.push kls unless kls && old.contains(kls)
            while parent.nodeType == 1
              for add in added
                @update(parent, '$class', add, target, undefined) 
              for remove in removed
                @update(parent, '$class', remove, undefined, target) 
              parent = parent.parentNode
            parent = target

          while parent.nodeType == 1
            @update(parent, '$attribute', mutation.attributeName, target, undefined)
            parent = parent.parentNode

        when "childList"

          # Invalidate sibling observers
          added = mutation.addedNodes
          removed = mutation.removedNodes
          prev = next = mutation
          firstPrev = firstNext = true
          while (prev = prev.previousSibling)
            if prev.nodeType == 1
              unless firstPrev
                @update(prev, '+', added[0], removed[0]) 
                @update(prev, '++', added[0], removed[0])
                firstPrev = false
              @update(prev, '~', added, removed)
              @update(prev, '~~', added, removed)
          while (next = next.nextSibling)
            if next.nodeType == 1
              unless firstNext
                @update(prev, '!+', added[added.length - 1], removed[removed.length - 1]) 
                @update(prev, '++', added[added.length - 1], removed[removed.length - 1])
                firstNext = false
              @update(prev, '!~', added, removed)
              @update(prev, '~~', added, removed)


          # Invalidate descendants observers
          @update(parent, '>', added, removed)
          allAdded = []
          for child in added
            @update(child, '!>', parent)
            allAdded.push(child)
            allAdded.push.apply(allAdded, child.getElementsByTagName('*'))
          allRemoved = []
          for child in removed
            @update(child, '!>', undefined, parent)
            allRemoved.push(child)
            allRemoved.push.apply(allRemoved, child.getElementsByTagName('*'))


          while parent && parent.nodeType == 1
            @update(parent, ' ', allAdded, allRemoved)
            for child in allAdded
              @update(child, '!', parent, parent)
            for child in allRemoved
              @update(child, '!', parent, undefined, parent)
            parent = parent.parentNode

module.exports = Observer
