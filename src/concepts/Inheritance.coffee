
# Combine classes into one
Inheritance = ->
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
  
module.exports = Inheritance