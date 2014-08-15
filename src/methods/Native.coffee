class Native

  camelize: (string) ->
    return string.toLowerCase().replace /-([a-z])/gi, (match) ->
      return match[1].toUpperCase()

  dasherize: (string) ->
    return string.replace /[A-Z]/g, (match) ->
      return '-' + match[0].toLowerCase()

  indexOfTriplet: (array, a, b, c) ->
    if array
      for op, index in array by 3
        if op == a && array[index + 1] == b && array[index + 2] == c
          return index
    return -1

  setImmediate: setImmediate ? setTimeout

  # Combine classes into one
  mixin: (proto) ->
    Context = () ->
    if proto.prototype
      Context.prototype = new proto
      constructor = proto
    else
      Context.prototype = proto
    Mixin = () ->
      if constructor
        if constructor.push
          for ctor in constructor
            ctor.apply(@, arguments)
          return
        else
          return constructor.apply(@, arguments)
    Mixin.prototype = new Context

    for mixin, index in arguments
      continue if !mixin || index == 0
      if prototype = mixin::
        if (fn = mixin::constructor) != Function
          if constructor
            if constructor.push
              constructor.push fn
            else
              constructor = [constructor, fn]
          else
            constructor = fn
      for name, fn of (prototype || mixin)
        Mixin::[name] = fn

    if constructor && constructor.push
      Mixin.prototype.constructor = Mixin

    return Mixin

  time: (other, time) ->
    time ||= performance?.now() || Date.now?() || + (new Date)
    return time if time && !other
    return Math.floor((time - other) * 100) / 100
    
  clone: (object) -> 
    if object && object.map
      return object.map @clone, @
    return object

module.exports = Native