
expect = chai.expect
assert = chai.assert


describe 'Matrix', ->
  engine = null
  before ->
    container = document.createElement('div')
    engine = new GSS(container, {
      half: 0.5
      three: 3
    })
    engine.compile()
    
  describe 'dispatched by argument types', ->
    it 'should properly recognize matrix operations', ->
      expect(engine.output.Command(['translateX', 3])).to.be.an.
        instanceof(engine.output.Matrix.Transformation1)
      expect(engine.output.Command(['translateX', 3])).to.be.an.
        instanceof(engine.output.Matrix)

      expect(-> engine.output.Command(['translateX', 3, 3])).to.
        throw(/Too many/)

      expect(-> engine.output.Command(['translateX', 'a'])).to.
        throw(/Unexpected argument/)

  describe 'when executed', ->
    describe 'independently', ->
      it 'should initialize matrix', ->
        rotated = engine.output.Matrix::_mat4.create()
        rotated = engine.output.Matrix::_mat4.rotateZ(rotated, rotated, 180 * (Math.PI / 180))
        rotate = ['rotateZ', 0.5]
        expect(engine.output.Command(rotate).solve(engine.output, rotate)).
          to.eql rotated

    describe 'as nested commands', ->
      it 'should return final matrix', ->
        rotated = engine.output.Matrix::_mat4.create()
        rotated = engine.output.Matrix::_mat4.rotateY(rotated, rotated, - 18 * (Math.PI / 180))
        rotated = engine.output.Matrix::_mat4.rotateZ(rotated, rotated, 180 * (Math.PI / 180))
        rotate = ['rotateZ', ['rotateY', -0.05], 0.5]
        expect(engine.output.Command(rotate).solve(engine.output, rotate)).
          to.eql rotated

    describe 'as flat commands', ->
      it 'should return final matrix', ->
        rotated = engine.output.Matrix::_mat4.create()
        rotated = engine.output.Matrix::_mat4.rotateY(rotated, rotated, - 18 * (Math.PI / 180))
        rotated = engine.output.Matrix::_mat4.rotateZ(rotated, rotated, 180 * (Math.PI / 180))
        rotate = [['rotateY', -0.05], ['rotateZ', 0.5]]
        expect(engine.output.Command(rotate).solve(engine.output, rotate)).
          to.eql rotated

  describe 'defined as a sequence of matrix operations', ->
    it 'should group together', ->
      sequence = [
        ['translateX', 3],
        ['rotateZ', 2]
      ]
      expect(engine.output.Command(sequence)).to.be.an.
        instanceof(engine.output.Matrix::Sequence)
      expect(engine.output.Command(['translateX', 3])).to.eql(sequence[0].command)
      expect(engine.output.Command(['rotateZ', 3])).to.not.eql( sequence[1].command)
      expect(engine.output.Command(['rotateZ', ['translateX', 3], 3])).to.eql(sequence[1].command)
      expect(->
        engine.output.Command([
          1,
          ['rotateZ', 2]
        ])
      ).to.throw(/Undefined/)

  describe 'when used with unknown variables', ->
    it 'should update and recompute matrix', () ->
      expect(engine.solve(['set', 'transform', [
        ['translateX', 3]
        ['rotateZ', ['get', 'unknown']]
      ]])).to.eql(undefined)
      expect


  describe 'when used with known variables', ->
    it 'should update and recompute matrix', () ->
      M_tX3_rZ1of2 = engine.output.Matrix::_mat4.create()
      M_tX3_rZ1of2 = engine.output.Matrix::_mat4.translate(M_tX3_rZ1of2, M_tX3_rZ1of2, [3, 0, 0])
      M_tX3_rZ1of2 = engine.output.Matrix::_mat4.rotateZ(M_tX3_rZ1of2, M_tX3_rZ1of2, 180 * (Math.PI / 180))
      expect(engine.solve(['set', 'transform', [
        ['translateX', 3]
        ['rotateZ', ['get', 'half']]
      ]])).to.eql(undefined)
      T_tX3_rZ1of2 = engine.scope.style.transform
      engine.scope.style.transform = engine.output.Matrix::format(M_tX3_rZ1of2)
      expect(engine.scope.style.transform).to.eql(T_tX3_rZ1of2)

      M_tX3_rZ3of4 = engine.output.Matrix::_mat4.create()
      M_tX3_rZ3of4 = engine.output.Matrix::_mat4.translate(M_tX3_rZ3of4, M_tX3_rZ3of4, [3, 0, 0])
      M_tX3_rZ3of4 = engine.output.Matrix::_mat4.rotateZ(M_tX3_rZ3of4, M_tX3_rZ3of4, 270 * (Math.PI / 180))

      engine.data.merge({'half': 0.75})
      T_tX3_rZ3of4 = engine.scope.style.transform
      engine.scope.style.transform = engine.output.Matrix::format(M_tX3_rZ3of4)
      expect(engine.scope.style.transform).to.eql(T_tX3_rZ3of4)

      engine.data.merge({'half': 0.5})
      expect(engine.scope.style.transform).to.eql(T_tX3_rZ1of2)

  describe 'when used with multiple variables', ->
    it 'should update and recompute matrix', () ->
      M_tX3_rZ1of2 = engine.output.Matrix::_mat4.create()
      M_tX3_rZ1of2 = engine.output.Matrix::_mat4.translate(M_tX3_rZ1of2, M_tX3_rZ1of2, [3, 0, 0])
      M_tX3_rZ1of2 = engine.output.Matrix::_mat4.rotateZ(M_tX3_rZ1of2, M_tX3_rZ1of2, 180 * (Math.PI / 180))
      expect(engine.solve(['set', 'transform', [
        ['translateX', ['get', 'three']]
        ['rotateZ', ['get', 'half']]
      ]])).to.eql(undefined)
      T_tX3_rZ1of2 = engine.scope.style.transform
      engine.scope.style.transform = engine.output.Matrix::format(M_tX3_rZ1of2)
      expect(engine.scope.style.transform).to.eql(T_tX3_rZ1of2)

      M_tX3_rZ3of4 = engine.output.Matrix::_mat4.create()
      M_tX3_rZ3of4 = engine.output.Matrix::_mat4.translate(M_tX3_rZ3of4, M_tX3_rZ3of4, [3, 0, 0])
      M_tX3_rZ3of4 = engine.output.Matrix::_mat4.rotateZ(M_tX3_rZ3of4, M_tX3_rZ3of4, 270 * (Math.PI / 180))

      engine.data.merge({'half': 0.75})
      T_tX3_rZ3of4 = engine.scope.style.transform
      engine.scope.style.transform = engine.output.Matrix::format(M_tX3_rZ3of4)
      expect(engine.scope.style.transform).to.eql(T_tX3_rZ3of4)

      engine.data.merge({'three': -3})
      M_tXminus3_rZ3of4 = engine.output.Matrix::_mat4.create()
      M_tXminus3_rZ3of4 = engine.output.Matrix::_mat4.translate(M_tXminus3_rZ3of4, M_tXminus3_rZ3of4, [-3, 0, 0])
      M_tXminus3_rZ3of4 = engine.output.Matrix::_mat4.rotateZ(M_tXminus3_rZ3of4, M_tXminus3_rZ3of4, 270 * (Math.PI / 180))

      T_tXminus3_rZ3of4 = engine.scope.style.transform
      engine.scope.style.transform = engine.output.Matrix::format(M_tXminus3_rZ3of4)
      expect(engine.scope.style.transform).to.eql(T_tXminus3_rZ3of4)


      engine.data.merge({'half': 0.5, 'three': 3})
      expect(engine.scope.style.transform).to.eql(T_tX3_rZ1of2)


