# Engine is a base class for scripting environments.
# It includes interpreter and reference tracker. 
# Input, output and method definitions are set in subclasses

# simplistic pipe-like I/O, connects engines and modules together
class Pipe
  constructor: (@input, @output) ->

  pipe: (pipe) ->
    @output = pipe

  read: ->
    if @input
      if @input.write
        return @input.write.apply(@input, arguments)
      else
        return @input.apply(this, arguments)
    if @process
      return @process.apply(this, arguments)

  write: ->
    if @output.read
      return @output.read.apply(@output, arguments)
    else
      return @output.apply(this, arguments)

class Engine extends Pipe
  Expressions:  require('./Expressions.js')
  References:   require('./References.js')

  constructor: (scope) ->
    # GSS(node) finds parent nearest engine or makes one on root
    if scope && scope.nodeType
      unless @References
        while scope
          if id = Document::References.get(scope)
            if engine = Engine[id]
              return engine
          break unless scope.parentNode
          scope = scope.parentNode
        return new Document(scope)

      # new GSS(node) assigns engine to node if it doesnt have one
      id = @References.get(scope, true)
      if engine = Engine[id]
        return engine

      Engine[id] = @
      @scope   = scope

    # Create a new engine
    if @References
      @expressions = new @Expressions(@)
      @references  = new @References(@)
      return
    else
      return new arguments.callee(scope)

  # Hook: Clean up nested stuff when removing something
  clean: ->
    return @context.clean.apply(@context, arguments)

  # Hook: Should interpreter iterate given object?
  isCollection: (object) ->
    if typeof object == 'object' && object.length != undefined
      unless typeof object[0] == 'string' && !@context[object[0]]
        return true

  # Delegate: Pass input to expressions input
  read: ->
    return @expressions.read.apply(this, arguments)
    
  # Delegate: Reference tracking, helps with bookkeeping
  set: ->
    return @references.set.apply(@references, arguments)
  add: ->
    return @references.add.apply(@references, arguments)
  remove: ->
    return @references.remove.apply(@references, arguments)

  handleEvent: (e) ->
    method = 'on' + e.type
    if method in @
      return @[method](e)

Engine.Pipe = Pipe

module.exports = Engine