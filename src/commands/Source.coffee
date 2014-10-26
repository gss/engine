Parser = require('ccss-compiler')
Command = require('../concepts/command')

class Source extends Command
  
  signature: [
    'source': ['Object', 'String']
    [
      'type': ['String'],
      'label': ['String']
    ]
  ]
  
  
Command.define.call Source 
  # Evaluate stylesheet
  "eval": 
    command: (engine, operation, continuation, scope, 
              node, type = 'text/gss', source, label = type) ->
      if node.nodeType
        if nodeType = node.getAttribute('type')
          type = nodeType
        source ||= node.textContent || node 
        if (nodeContinuation = node._continuation)?
          engine.queries.clean(nodeContinuation)
          continuation = nodeContinuation
        else if !operation
          continuation = engine.Continuation(node.tagName.toLowerCase(), node)
        else
          continuation = node._continuation = engine.Continuation(continuation || '', null,  engine.Continuation.DESCEND)
        if node.getAttribute('scoped')?
          scope = node.parentNode

      rules = engine.clone @types['_' + type](source)
      engine.console.row('rules', rules)
      engine.engine.engine.solve(rules, continuation, scope)

      return


  # Load & evaluate stylesheet
  "load": 
    command: (engine, operation, continuation, scope, 
              node, type, method = 'GET') ->
      src = node.href || node.src || node
      type ||= node.type || 'text/gss'
      xhr = new XMLHttpRequest()
      engine.requesting = (engine.requesting || 0) + 1
      xhr.onreadystatechange = =>
        if xhr.readyState == 4 && xhr.status == 200
          --engine.requesting
          engine.commands.eval.call(@, engine, operation, continuation, scope,
                                node, type, xhr.responseText, src)


      xhr.open(method.toUpperCase(), src)
      xhr.send()
      
      
  types:
    "text/gss-ast": (source) ->
      return JSON.parse(source)

    "text/gss": (source) ->
      return Parser.parse(source)?.commands

module.exports = Source