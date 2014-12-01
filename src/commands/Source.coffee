Parser = require('ccss-compiler')
Command = require('../concepts/Command')

class Source extends Command
  type: 'Source'
  
  signature: [
    'source': ['Selector', 'String', 'Node']
    [
      'type': ['String']
      'text': ['String']
    ]
  ]
  
  
      
  types:
    "text/gss-ast": (source) ->
      return JSON.parse(source)

    "text/gss": (source) ->
      return Parser.parse(source)?.commands
  
Source.define
  # Evaluate stylesheet
  "eval": (node, type = 'text/gss', text, engine, operation, continuation, scope) ->
    if node.nodeType
      if nodeType = node.getAttribute('type')
        type = nodeType
      source = text || node.textContent || node 
      if (nodeContinuation = node._continuation)?
        engine.queries.clean(nodeContinuation)
        continuation = nodeContinuation
      else
        continuation = node._continuation = @continuate(continuation, @DESCEND)
      if node.getAttribute('scoped')?
        scope = node.parentNode

    rules = engine.clone @types[type](source)
    engine.console.row('rules', rules)
    engine.engine.solve(rules, continuation, scope)

    return



  # Load & evaluate stylesheet
  "load": (node, type, method, engine, operation, continuation, scope) ->
      src = node.href || node.src || node
      type ||= node.type || 'text/gss'
      xhr = new XMLHttpRequest()
      engine.requesting = (engine.requesting || 0) + 1
      xhr.onreadystatechange = =>
        if xhr.readyState == 4 && xhr.status == 200
          --engine.requesting
          op = ['eval', node, type, xhr.responseText]
          engine.Command(op).solve(engine, op, continuation, scope)
      xhr.open('GET', method && method.toUpperCase() || src)
      xhr.send()
      

module.exports = Source