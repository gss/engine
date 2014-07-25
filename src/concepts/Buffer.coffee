# Simple base class for pseudo-streams with buffering capabilities
# Allows to reflow synchronously after all side effects are computed

class Buffer

  push: ->
    if output = @output
      return output.pull.apply(output, arguments)

  pull: ->
    if @puller || input = @input
      captured = @capture arguments[0]
      if input.pull
        pulled = input.pull.apply(input, arguments)
      else
        pulled = @[input].apply(@, arguments)
      @release() if captured
      return pulled

  flush: ->
    if input = @input
      return input.flush.apply(input, arguments)

  run: ->
    return @pull.apply(@, arguments)

  release: () ->
    @capturer?.onRelease()
    @endTime = @engine.time()
    @flush()
    return @endTime

  capture: (reason) ->
    if @buffer == undefined
      @capturer?.onCapture()
      @buffer = null
      @engine.start()
      fmt = '%c%s%c'
      
      if typeof reason != 'string'
        reason = @engine.clone(reason) if reason?.slice
        fmt += '\t\t%O'
      else
        fmt += '\t%s'
      if @engine.onDOMContentLoaded
        name = 'GSS.Document'
      else
        name = 'GSS.Solver'

        method = 'groupCollapsed'
      @engine.console[method || 'group'](fmt, 'font-weight: normal', name, 'color: #666; font-weight: normal', reason)
      @startTime = @engine.time()
    if arguments.length > 1
      result = @pull.apply(@, Array.prototype.slice.call(arguments, 1))
      if name
        @release()
      return result
    return !!name

  # Schedule execution of expressions to the next tick, buffer input
  defer: (reason) ->
    if @capture.apply(@, arguments)
      @deferred ?= (window.setImmediate || window.setTimeout)( =>
        @deferred = undefined
        @flush()
      , 0)

module.exports = Buffer