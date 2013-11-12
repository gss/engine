getTime = Date.now or ->
  return new Date().getTime()

_ = 

  defer: (func) ->
    setTimeout func, 1
    
  # Returns a function, that, as long as it continues to be invoked, will not
  # be triggered. The function will be called after it stops being called for
  # N milliseconds. If `immediate` is passed, trigger the function on the
  # leading edge, instead of the trailing.
  debounce: (func, wait, immediate) ->
    timeout = undefined
    args = undefined
    context = undefined
    timestamp = undefined
    result = undefined
    ->
      context = this
      args = [arguments...]
      timestamp = getTime()
      later = ->
        last = getTime() - timestamp
        if last < wait
          timeout = setTimeout(later, wait - last)
        else
          timeout = null
          result = func.apply(context, args)  unless immediate

      callNow = immediate and not timeout
      timeout = setTimeout(later, wait)  unless timeout
      result = func.apply(context, args)  if callNow
      result
  
module.exports = _