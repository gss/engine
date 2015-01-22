# Algorithms are used as they are from chroma.js by Gregor Aisch (BSD License).

Command = require '../../engine/Command'

class Color extends Command
  @Keywords: {'transparent', 'currentColor'}

  constructor: (obj) ->
    switch typeof obj
      when 'string'
        if Color.Keywords[obj]
          return obj
        else if obj.charAt(0) == '#'
          return obj
      when 'object'
        if Color[obj[0]]
          return obj

  @define
    hsl: (h, s, l) ->
      if s == 0
        r = g = b = l*255
      else
        t3 = [0,0,0]
        c = [0,0,0]
        t2 = if l < 0.5 then l * (1+s) else l+s-l*s
        t1 = 2 * l - t2
        h /= 360
        t3[0] = h + 1/3
        t3[1] = h
        t3[2] = h - 1/3
        for i in [0..2]
          t3[i] += 1 if t3[i] < 0
          t3[i] -= 1 if t3[i] > 1
          if 6 * t3[i] < 1
            c[i] = t1 + (t2 - t1) * 6 * t3[i]
          else if 2 * t3[i] < 1
            c[i] = t2
          else if 3 * t3[i] < 2
            c[i] = t1 + (t2 - t1) * ((2 / 3) - t3[i]) * 6
          else
            c[i] = t1
        [r,g,b] = [Math.round(c[0]*255),Math.round(c[1]*255),Math.round(c[2]*255)]
      ['rgb', r,g,b]

    hsla: (h, s, l, a) ->
      return Type.Color.hsl.execute(h, s, l).concat[a]

    rgb: (r, g, b) ->
      return ['rgb', r, g, b]

    rgba: (r, g, b, a) ->
      return ['rgba', r, g, b, a]

    hex: (hex) ->
      if hex.match /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
        if hex.length == 4 or hex.length == 7
          hex = hex.substr(1)
        if hex.length == 3
          hex = hex.split("")
          hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
        u = parseInt(hex, 16)
        r = u >> 16
        g = u >> 8 & 0xFF
        b = u & 0xFF
        return ['rgb', r,g,b]

      # match rgba hex format, eg #FF000077
      if hex.match /^#?([A-Fa-f0-9]{8})$/
        if hex.length == 9
          hex = hex.substr(1)
        u = parseInt(hex, 16)
        r = u >> 24 & 0xFF
        g = u >> 16 & 0xFF
        b = u >> 8 & 0xFF
        a = u & 0xFF
        return ['rgba', r,g,b,a]

module.exports = Color