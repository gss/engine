# Define a style (family) from JSON definition
# Creates matcher function that validates and identifies 
# values against defined property types and keywords

# Style family shorthands produce family object instance 
# that has default values set in the prototype.
# It can be used to merge and serialize partial updates.


Style = (definition, name, styles,
         keywords = {}, types = [], keys = [], properties = [], required = {}
         optional, depth = 0) ->

  requirement = true
  pad = initial = previous = undefined
  max = depth
  # Group of properties
  if definition.length == undefined
    for key, def of definition
      continue unless typeof def == 'object'
      property = key.indexOf('-') > -1 && styles[key] && key || name + '-' + key
      style = @Style(def, property, styles, null, null, null, null, null, null, null, depth)
      unless optional == true
        required[property] = optional || requirement
        requirement = property
      if style.types
        for type, index in style.types
          types.push type
          prop = style.keys?[index] || property
          keys.push prop
          if properties.indexOf(prop) == -1
            properties.push prop
      if style.keywords
        for prop, value of style.keywords
          for item in value
            for p in (item.push && item || [item])
              if properties.indexOf(p) == -1
                properties.push p
          (keywords[prop] ||= []).push value
  else
    for property, index in definition
      # Optional group
      switch typeof property
        when "object"
          substyle = @Style(property, name, styles, keywords, types, keys, properties, required, 
                          (property.push && (requirement || true)) || optional, depth + 1)
          pad = property.pad || substyle.pad
          max = Math.max(substyle.depth, max)
        when "string"
          # Predefined value type
          if type = @[property]
            types.push(type)
            if storage = type.Keywords
              for key of storage
                initial = key
                break
            
            initial ?= 0
          # Keyword
          else
            initial ?= property
            (keywords[property] ||= []).push(name)
        else
          initial ?= property  

  if typeof initial == 'function'
    callback = initial
    initial = undefined

  if initial == undefined
    initial = new Shorthand
    initial.displayName = initial::property = name
    for property in properties
      initial::[property] = styles[property].initial
  else if keys.length == 0
    keys = undefined

  matcher = new Matcher(name, keywords, types, keys, required, pad, max, initial, callback)
  if initial?.displayName
    initial::style = matcher
    initial::styles = styles
    initial::properties = properties


  matcher.format = (value) ->
    return Shorthand::toExpressionString(name, value, false, styles)

  return styles[name] = matcher

# Class that holds matched properties. 
# Its prototype is extended with default values inferred from style definition
# Called every time shorthand is parsed, can be a singleton 
class Shorthand
  constructor: (callback) ->
    callback ||= (options) ->
      if options
        for key, value of options
          @[key] = value
      @
    callback.prototype = @
    return callback

  # Serialize given styles respecting default and instance values.
  format: (styles, number) ->
    string = undefined
    if @style.keys
      while style = @[i = (i ? -1) + 1]
        string = (string && string + ', ' || '') + style.format(styles, i + 1)

      pad = @style.pad
      for key, index in keys = @properties
        if index && pad
          if index > 2
            continue if @equals(key, keys[1])
          else if index > 1
            continue if @equals(key, keys[0]) &&
                       (!@hasOwnProperty[keys[3]] || @equals(keys[3], keys[1]))
          else 
            continue if @equals(key, keys[0]) && 
                        @equals(keys[1], keys[2]) && 
                        @equals(keys[2], keys[3])
        else

          if styles && number && (value = styles[key + '-' + number])?
            prefix = previous = undefined
            if typeof value != 'string'
              keys = @style.keys
              types = @style.types
              for index in [keys.indexOf(key) - 1 ... 0] by -1
                if (k = keys[index]) != previous
                  break if @hasOwnProperty(k)
                  if types[index] == @styles.engine.Length
                    expression = @toExpressionString(k, @[k])
                    prefix = ((string || prefix) && ' ' || '') + expression + (prefix && ' ' + prefix || '')
                    previous = k

            string += prefix if prefix


          else
            continue unless @hasOwnProperty(key)
            value = @[key]

        expression = @toExpressionString(key, value)
        string = (string && string + ' ' || '') + expression

    return string 

  # Compare values of two properties
  equals: (first, second) ->
    a = @[first]
    b = @[second]
    if typeof a != 'object'
      return a == b
    else
      return a[0] == b[0] && a[1] == b[1] && a[2] == b[2]

  # Serialize expression to string, cast integers to pixels when applicable
  toExpressionString: (key, operation, expression, styles = @styles) ->
    switch typeof operation
      when 'object'
        name = operation[0]
        if @styles.engine.signatures[name]?.Number?.resolved
          return @toExpressionString(key, operation[1], true) + name
        else
          string = name + '('
          for index in [1 .. operation.length - 1]
            string += ',' unless index == 1
            string += @toExpressionString(key, operation[index], true)
          return string + ')'
      when 'number'
        if !expression
          types = styles[key].types
          if operation
            for type in types
              if type.formatNumber
                if (expression = type.formatNumber(operation))?
                  return expression
          return operation
    return operation


# Generate a function that will match set of parsed tokens against style definition
Matcher = (name, keywords, types, keys, required, pad, depth, initial, callback) ->
  matcher = ->
    result = matched = undefined

    if pad && arguments.length < 4
      args = [
        arguments[0]
        arguments[1] ? arguments[0]
        arguments[2] ? arguments[0]
        arguments[1] ? arguments[0]
      ]

    for argument, i in (args || arguments)
      # Match keyword
      switch typeof argument
        when 'object'
          if typeof argument[0] != 'string' || argument.length == 1
            if matched = matcher.apply(@, argument)
              (result ||= new initial)[i] = matched
            else return

        when 'string'
          if props = keywords[argument]
            if keys
              j = pad && i || 0
              while (property = props[j++])?
                if !result || !result.hasOwnProperty(property)
                  if !required[property] || (result && result[required[property]] != undefined)
                    matched = (result ||= new initial)[property] = argument
                    break
                # Unique keyword for property resolved as value. Use keyword, re-match value
                else if props.length == 1 && argument != result[property]
                  arg = argument
                  argument = result[property]
                  result[property] = arg
                  if typeof argument == 'string' && (props = keywords[argument])
                    j = pad && i || 0
                    continue
                  break
                if pad
                  break
            else
              return argument

      # Match argument by type
      if types && !matched?
        if keys
          for property, index in keys
            if !result || (!result.hasOwnProperty(property) &&
                          (!(req = required[property]) || result.hasOwnProperty(req)))
              if (matched = types[index](argument)) != undefined
                (result ||= new initial)[property] = argument
                break
        else
          for type, index in types
            if type(argument) != undefined
              return argument

      return unless matched?
      matched = undefined

    if callback && (returned = callback(result))?
      return returned
    return result
  matcher.matcher     = true
  matcher.displayName = name
  matcher.keywords    = keywords if keywords?
  matcher.types       = types    if types?
  matcher.keys        = keys     if keys?
  matcher.pad         = pad      if pad?
  matcher.depth       = depth    if depth?
  matcher.initial     = initial  if initial?
  matcher.callback    = callback if callback?
  return matcher


module.exports = Style

