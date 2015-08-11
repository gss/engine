Command = require('../Command')

class Range extends Command
  type: 'Range'

  signature: [
    from: ['Boolean', 'Number', 'Variable', 'Range']
    [
      to:   ['Boolean', 'Number', 'Variable', 'Range']
      now:  ['Number']
    ]
  ]

  extras: 0

  # Create a range
  @define
    '...': (from, to, progress) ->
      if to?
        if to == false
          range = [from]
        else
          range = [from, to]
      else
        range = [false, from]

      if size = @size
        range.length = size

      if progress?
        range[2] = progress

      @wrap range
        
      return range

  # Convert range to number
  valueOf: ->
    start = @[0]
    end = @[1]
    return @[2] * ((end - start) || 1) + start


  wrap: (range) ->
    range.valueOf = @valueOf
    return range

  # Store range meta data
  pause: (range, engine, operation, continuation, scope) ->
    range.operation = operation
    range.continuation = continuation
    range.scope = scope
    return range

  resume: (range, engine) ->
    @start(range, engine, range.operation, range.continuation, range.scope)

    range.operation.command.update(range, engine, range.operation, range.continuation, range.scope)

  copy: (range) ->
    copy = range.slice()
    copy.valueOf = range.valueOf
    if range.operation
      copy.operation = range.operation
      copy.continuation = range.continuation
      copy.scope = range.scope
    return copy

  # Schedule range for update
  start: (range, engine, operation, continuation, scope) ->
    ranges = (engine.engine.ranges ||= {})[continuation] ||= []
    if (index = ranges.indexOf(operation)) == -1
      i = 0
      # Solve transitions before springs
      while (other = ranges[i]) && other.length < range.length
        i += 3
      ranges.splice(i, 0, operation, scope, range)
    else
      ranges[index + 2] = range
    return range

  # 1 modify
  # scale

class Range.Modifier extends Range
  signature: [[
    from: ['Boolean', 'Number', 'Variable', 'Range']
    to:   ['Boolean', 'Number', 'Variable', 'Range']
  ]]

  before: (args, domain, operation, continuation, scope, ascender, ascending) ->
    if typeof args[0] != 'number' || typeof args[1] == 'number'
      if operation[0].indexOf('>') == -1
        return @scale(args[0], null, args[1])
      else if typeof args[1] == 'number'
        return @scale(args[0], args[1], null)
    else
      if operation[0].indexOf('>') == -1
        return @scale(args[1], args[0], null)
    return @scale(args[1], null, args[0])

  # Convert range to number
  valueOf: ->
    if (value = @[2])?
      if ((start = @[0]) == false || value > 0)
        if (end = @[1]) == false
          if value != 1 || start == 0 #YF: Ambiguous (A=1)>0 and (A=50)>50
            return value * ((end - start) || 1) + start
        else
          if value < 1
            return value * ((end - start) || 1) + start
            
  # Scale range to given start/end, update progress, register overshooting
  scale: (range, start, finish) ->
    unless range.push
      if start?
        if start <= range
          return @wrap [start, false, range / (start || 1)]
        else
          return @wrap [start, false, range / (start || 1) - 1]
      else if finish?
        return @wrap [false, finish, range / finish]
      else
        return @wrap [start, false,  range / start]

    reversed = +((range[0] > range[1]) && range[1]?)
    from = range[reversed]
    to   = range[1 - reversed]


    if start != null && !(from > start)
      range = @copy(range)
      if (value = range[2])?
        to ||= 0
        progress = value * (to - from)
        range[2] = (progress - (start - from)) / (to - start)
      range[+reversed] = from = start


    if finish != null && !(to < finish)
      range = @copy(range)
      if (value = range[2])?
        from ||= 0
        to ||= 0
        progress = value * (to - from)
        range[2] = progress / (finish - from)
      range[1 - reversed] = finish

    if range[2] < 0 || range[2] > 1
      #range[2] = Math.round(range[2])
      range.valueOf = @execute

    return range

  after: (args, result) ->
    if result == false
      return 

    return result


  @define

    # Repeat
    #'=': (from, to, progress) ->
    #  return progress % 1

    # Extend
    '-': (from, to, progress) ->
      return progress

    # Alternate
    '~': (from, to, progress) ->
      if Math.floor(progress % 2)
        return 1 - progress % 1
      else
        return progress % 1 

    # Closest
    '|': (from, to, progress) ->
      if progress > to
        return to
      if progress < from
        return from

    '<': (from, to, progress) ->
      return


    '>': (from, to, progress) ->
      return

class Range.Modifier.Including extends Range.Modifier

  # Convert range to number, including boundaries
  valueOf: ->
    if (value = @[2])?
      if ((start = @[0]) == false || value >= 0)
        if ((end = @[1]) == false || value <= 1)
          return value * ((end - start) || 1) + start

  @define

    # Clip
    '<=': (from, to, progress) ->
      return

    # Clip inverted
    '>=': (from, to, progress) ->
      return

# Range updating over time
class Range.Progress extends Range
  
  after: (args, result, engine, operation, continuation, scope) ->
    if operation.anonymous
      @start(result, engine, operation, continuation, scope)
    else
      @pause(result, engine, operation, continuation, scope)

    return result

  advices: [
    (engine, operation, command) ->
      op = operation
      while parent = op.parent
        if parent[0] == 'map'
          operation.anonymous = true
        op = parent
      return
  ]


class Range.Easing extends Range.Progress
  constructor: (obj) ->
    if typeof obj == 'string'
      if obj = @Type.Timings[obj]
        return obj
    else if obj[0] == 'steps' || obj[0] == 'cubic-bezier'
      return obj

  @define
    'ease':        ['cubic-bezier', .42, 0, 1,   1]
    'ease-in':     ['cubic-bezier', .42, 0, 1,   1]
    'ease-out':    ['cubic-bezier', 0,   0, .58, 1]
    'ease-in-out': ['cubic-bezier', .42, 0, .58, 1]
    'linear':      ['cubic-bezier', 0,   0, 1,   1]

    'step-start': (value) ->
      return Math.floor(value)
    
    'step-end': (value) ->
      return Math.ceil(value)

    out: (value) ->
      return 1 - value 

    # Thanks mootools

    linear: (value) ->
      return value

    quad: (value) ->
      return Math.pow(value, 2)

    cubic: (value) ->
      return Math.pow(value, 3)

    quart: (value) ->
      return Math.pow(value, 4)

    expo: (value) ->
      return Math.pow(2, 8 * (value - 1))

    circ: (value) ->
      return 1 - Math.sin(Math.acos(value))

    sine: (value) ->
      return 1 - Math.cos(value * Math.PI / 2)

    back: (value) ->
      return Math.pow(value, 2) * ((1.618 + 1) * value - 1.618)

    elastic: (value) ->
      return Math.pow(2, 10 * --value) * Math.cos(20 * value * Math.PI * 1 / 3)



class Range.Mapper extends Range
  signature: [
    from: ['Number', 'Variable', 'Range']
    to:   ['Number', 'Variable', 'Range']
  ]

  extras: null


  # [continuation] = [operation, left, right]
  @define
    map: (left, right, engine, operation, continuation, scope, ascender, ascending) ->
      if ascender == 2
        # Undershooting
        if (start = left[2] ? left[0])?
          if start != false && right <  start
            right = start
          else if (end = if left.push then left[1] else left) < right
            right = end
        # Overshooting
        else if (end = if left.push then left[1] else left) < right
          right = end
        # Implicit out of range (e.g.. delayed transformation) 
        else if right < 0
          return
        return right
      else
        engine.updating.ranges = true
        
        # Static range start transitions
        if left.length < 4
          if left[0]? && left[1]?
            right[2] = left[0] || null
            right[3] = (left[2] ? left[1] ? left) || 0

        # 
        else 
          if right.length < 4
            right[2] = +left
          else
            right[3] = +left || 0

        if right.operation
          @resume(right, engine)
          #right.operation = right.continuation = right.scope = undefined

        unless left.push
          return @valueOf.call right
        else
          return right


module.exports = Range
