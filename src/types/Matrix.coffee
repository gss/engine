Command = require ('../Command')

class Matrix extends Command
  type: 'Matrix'
  
  @Matrix: require('../../vendor/gl-matrix')

  matrix: ->

  matrix3d: ->

  mat3: (matrix, method, a, b, c) ->
    if matrix.length == 9
      return mat3[method](matrix, matrix, a, b, c)
    else
      return mat4[method](matrix, matrix, a, b, c)

  mat4: (matrix, method, a, b, c) ->
    if matrix.length == 9
      matrix = mat4.fromMat3(matrix)
    return mat4[method](matrix, matrix, a, b, c)

# 1-axis transform
class Matrix.Transformation1 extends Matrix
  signature: [
    [matrix: ['Matrix']]
    x:       ['Variable', 'Number']
  ]

  @define

    translateX:  (matrix, x) ->
      @mat3       matrix, 'translate', [x, 1, 1]
 
    translateY:  (matrix, y) ->
      @mat3       matrix, 'translate', [1, y, 1]
 
    translateZ:  (matrix, z) ->
      @mat4       matrix, 'translate', [1, 1, z]
 
    translate:   (matrix, x) ->
      @mat3       matrix, 'translate', [x, x]

    rotateX:     (matrix, x) ->
      @mat3       matrix, 'rotateX', x
    
    rotateY:     (matrix, y) ->
      @mat3       matrix, 'rotateY', y
    
    rotateZ:     (matrix, z) ->
      @mat4       matrix, 'rotateZ', z
    
    scaleX:      (matrix, x) ->
      @mat3       matrix, 'scale',  [x, 1, 1]
    
    scaleY:      (matrix, y) ->
      @mat3       matrix, 'scale',  [1, y, 1]
    
    scaleZ:      (matrix, z) ->
      @mat4       matrix, 'scale',  [1, 1, z]
    
    scale:  (    matrix,  x) ->
      @mat4       matrix, 'scale',  [x, x, 1]
    
    rotate:      (matrix, angle) ->
      @mat3       matrix, 'rotate', [1, 1], angle

# 2 axis transforms
class Matrix.Transformation2 extends Matrix
  signature: [
    [matrix: ['Matrix']]
    x:       ['Variable', 'Number']
    y:       ['Variable', 'Number']
  ]

  @define
    translate:   (matrix, x, y) ->
      @mat3       matrix, 'translate', [x, y]

    scale:       (matrix, x, y) ->
      @mat3       matrix, 'translate', [x, y]

# 3 axis transforms
class Matrix.Transformation3 extends Matrix
  signature: [
    [matrix: ['Matrix']]
    x:       ['Variable', 'Number']
    y:       ['Variable', 'Number']
    z:       ['Variable', 'Number']
  ]

  @define
    translate3d: (matrix, x, y = x, z = 0) ->
      if z == 0
        @mat3     matrix, 'translate', [x, y]
      else
        @mat4     matrix, 'translate', [x, y, z]

    scale3d:     (matrix, x, y = x, z = 1) ->
      if z == 1
        @mat3     matrix, 'scale', [x, y]
      else
        @mat4     matrix, 'scale', [x, y, z]

# 3 axis + angle
class Matrix.Transformation3A extends Matrix
  signature: [
    [matrix: ['Matrix']]
    x:       ['Variable', 'Number']
    y:       ['Variable', 'Number']
    z:       ['Variable', 'Number']
    a:       ['Variable', 'Number']
  ]

  @define
    rotate3d:    (matrix, x, y = x, z = 0, angle) ->
      if z == 0
        @mat3     matrix, 'rotate', [x, y],    angle
      else
        @mat4     matrix, 'rotate', [x, y, z], angle

module.exports = Matrix