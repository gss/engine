Command = require('../concepts/Command')

class Transformation extends Command
  type: 'Transformation'
  
  @Matrix: require('../../vendor/gl-matrix')

  matrix: ->

  matrix3d: ->

  _transform: (matrix, method, a, b, c) ->
    if matrix.length == 9
      return mat3[method](matrix, matrix, a, b, c)
    else
      return mat4[method](matrix, matrix, a, b, c)

  _transform3d: (matrix, method, a, b, c) ->
    if matrix.length == 9
      matrix = mat4.fromMat3(matrix)
    return mat4[method](matrix, matrix, a, b, c)

  translate: [
    (matrix, x, y = x) ->
      @_transform matrix, 'translate', [x, y]
    "3d": (matrix, x, y = x, z = 0) ->
      if z == 0
        @_transform matrix, 'translate', [x, y]
      else
        @_transform3d matrix, 'translate', [x, y, z]
    x: (matrix, x) ->
      @_transform matrix, 'translate', [x, 1, 1]
    y: (matrix, y) ->
      @_transform matrix, 'translate', [1, y, 1]
    z: (matrix, z) ->
      @_transform3d matrix, 'translate', [1, 1, z]
  ]

  rotate: [
    (matrix, x, y, angle) ->
      @_transform matrix, 'rotate', [x, y], angle
    "3d": (matrix, x, y, z, angle) ->
      @_transform3d matrix, 'rotate', [x, y, z], angle
    x: (matrix, x) ->
      @_transform matrix, 'rotateX', x
    y: (matrix, y) ->
      @_transform matrix, 'rotateY', y
    z: (matrix, z) ->
      @_transform3d matrix, 'rotateZ', z
  ]

  scale: [
    (matrix, x, y = x, z = 1) ->
      if z == 1
        @_transform matrix, 'scale', [x, y]
      else
        @_transform3d matrix, 'scale', [x, y, z]
    x: (matrix, x) ->
      @_transform matrix, 'scale', [x, 1, 1]
    y: (matrix, y) ->
      @_transform matrix, 'scale', [1, y, 1]
    z: (matrix, z) ->
      @_transform3d matrix, 'scale', [1, 1, z]
  ]
###
  skew: [
    x:
    y:
  ]###
  

module.exports = Transformation