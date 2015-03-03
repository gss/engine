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

  # Revert
  revert: ->
    1

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

      if progress?
        range[2] = progress

      return range

  # 1 modify
  # scale

class Range.Modifier extends Range
  signature: [[
    from: ['Boolean', 'Number', 'Variable', 'Range']
    to:   ['Boolean', 'Number', 'Variable', 'Range']
  ]]

  before: (args, domain, operation, continuation, scope, ascender, ascending) ->
    if operation[0].indexOf('>') > -1
      args.reverse()

    if typeof args[0] == 'number'
      return @scale(args[1], args[0], null)
    else
      return @scale(args[0], null, args[1])

  # Scale range to given start/end, update progress, register overshooting
  scale: (range, start, finish) ->
    unless range.push
      if start < range
        return [start, false, range / (start || 1)]
      else
        finish ?= start
        return [false, finish, range / finish]

    reversed = +((range[0] > range[1]) && range[1]?)
    from = range[reversed]
    to   = range[1 - reversed]


    if start != null && !(from > start)
      if (value = range[2])?
        to ||= 0
        progress = value * (to - from)
        range[2] = (progress - (start - from)) / (to - start)
        if range[2] < 0
          range.valueOf = @execute
      range[+reversed] = from = start


    if finish != null && !(to < finish)
      range = range.slice()
      if (value = range[2])?
        from ||= 0
        to ||= 0
        progress = value * (to - from)
        range[2] = progress / (finish - from)
        if range[2] > 1
          range.valueOf = @execute
      range[1 - reversed] = finish

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

    # Clip
    '<=': (from, to, progress) ->
      return

    '<': (from, to, progress) ->
      return

    # Clip inverted
    '>=': (from, to, progress) ->
      return

    '>': (from, to, progress) ->
      return

class Range.Progress extends Range
  
  after: (result, args, engine, operation, continuation, scope) ->
    ranges = (engine.engine.ranges ||= {})[continuation] ||= []
    if (index = ranges.indexOf(operation)) == -1
      ranges.push(operation, scope, result)
    else
      ranges[index + 2] = result
    return result


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
    'step-start':  'step-start'
    'step-end':    'step-end'

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
      # Static range starts animation
      if ascender == 2
        # Undershooting
        if (start = left[2] ? left[0])?
          if start != false && right <  start
            right = start
        # Overshooting
        else if (end = if left.push then left[1] else left) < right
          right = end
        # Implicit out of range (e.g.. delayed transformation) 
        else if right < 0
          return
        return right
      else
        engine.updating.ranges = true
        if left[0]? && left[1]?
          right[2] = left[0] || 0
          right[3] = (left[2] ? left[1] ? left) || 0
        return

module.exports = Range
