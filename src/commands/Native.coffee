class Native

  camelize: (string) ->
    return string.toLowerCase().replace /-([a-z])/i, (match) ->
      return match[1].toUpperCase()

  dasherize: (string) ->
    return string.replace /[A-Z]/, (match) ->
      return '-' + match[0].toLowerCase()

module.exports = Native