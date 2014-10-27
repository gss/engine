### 

Generate lookup structures to match methods by name and argument type signature

Signature for `['==', ['get', 'a'], 10]` would be `engine.signatures['==']['Value']['Number']`

Dispatcher support css-style typed optional argument groups, but has no support for keywords yet
### 
class Signatures
  
  constructor: (@engine) ->
    
  # Register signatures defined in a given object
  sign: (command, types, object, step) ->
    if signature = object.signature
      @set command, types, signature, step, 0
    else if signatures = object.signatures
      for signature in signatures
        @set command, types, signature, step, 0
        
  permute: (arg, permutation) ->
    keys = Object.keys(arg)
    return keys unless permutation
    values = Object.keys(arg)
    group = []
    
    # Put keys at their permuted places
    for position, index in permutation
      unless position == -1
        group[position] = keys[index]
    
    # Fill blank spots with     
    for i in [permutation.length ... keys.length] by 1
      for j in [0 ... keys.length] by 1
        group[keys[j]] ||= keys[j]
          
    # Validate that there're no holes
    for arg in group
      if arg == undefined
        return
        
    return group
    
  # Check if argument can be removed or moved around within its group
  isPermutable: (group, property, keys) ->
    types = group[property]
    for prop, value of group
      if property == prop
        break
      for type in value
        if types.indexOf(type) > -1
          if keys.indexOf(prop) == -1
            return -1 #can only be ommited
          else
            return 0 #omitable
          
    return 1 #movable
        
    
  # Generate a lookup structure to find method definition by argument signature
  set: (command, types, signature, method, index, permutation, shifts) ->
    # Lookup subtype and catch-all signatures
    unless signature
      for type of types
        if command[type]
          @sign command, types, typed[type].prototype, method
      @sign command, types, command, method
      return
      
    i = index
    
    # Find argument by index in definition
    `seeker: {`
    for arg in signature
      if arg.push
        for obj, k in arg
          j = 0
          group = arg
          for property of obj
            unless --i
              unless keys = @permute(arg,  permutation)
                return
              arg = obj
              argument = arg[property]
              `break seeker`
            j++
      else
        j = undefined
        for property of arg
          unless --i
            argument = arg[property]
            `break seeker`
    `}`
    
    # End of signature
    unless argument
      step.resolved = command
      return
      
    # Permute optional argument within its group
    if keys
      if j?
        permutation ||= []
        permutable = @isPermutable(arg, property, keys)
        if permutable > 0
          for i in [0 ... keys.length] by 1
            if i != j && permutation.indexOf(i) == -1
              @set command, types, signature, step, index + 1, permutation.concat(i), shifts
      
        @set command, types, signature, step, index + 1, permutation.concat(-1), shifts
        if permutable < 0
          return
      else 
    
    # Register all input types for given arguments
    for type in argument
      next = step[type] = {}
      @set command, types, signature, next, index + 1, permutation, shifts
  
module.exports = Signatures