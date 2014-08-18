# Create a getter property from a tree-like dictionary

Property = (property, reference, properties) ->
  if typeof property == 'object'
    if property.push
      return properties[path] = @Style(property, reference, properties)
    else
      for key, value of property
        if (index = reference.indexOf('[')) > -1
          path = reference.replace(']', '-' + key + ']')
          left = reference.substring(0, index)
          right = path.substring(index + 1, path.length - 1)
          properties[left][right] ||= @Property(value, path, properties)
        else if reference.match(/^[a-z]/i) 
          path = reference + '-' + key
        else
          path = reference + '[' + key + ']'


        properties[path] = @Property(value, path, properties)
  return property

Property.compile = (properties, engine) ->
  properties.engine ||= engine
  console.log(properties, 444444)
  for own key, property of properties
    continue if key == 'engine'
    prop = @call(engine, property, key, properties)
    engine['_' + key] ?= prop

  for own key, property of properties
    engine['_' + key] ?= property
  return properties

module.exports = Property