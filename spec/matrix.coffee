
expect = chai.expect
assert = chai.assert


describe 'Matrix', ->
  engine = null
  before ->
    container = document.createElement('div')
    engine = new GSS(container)
    engine.compile()
    
  describe 'dispatched by argument types', ->
    it 'should properly recognize matrix operations', ->
      expect(engine.data.Command(['translateX', 3])).to.be.an.
        instanceof(engine.data.Matrix.Transformation1)
      expect(engine.data.Command(['translateX', 3])).to.be.an.
        instanceof(engine.data.Matrix)

      expect(-> engine.data.Command(['translateX', 3, 3])).to.
        throw(/Too many/)

      expect(-> engine.data.Command(['translateX', 'a'])).to.
        throw(/Unexpected argument/)

  describe 'when executed', ->
    describe 'independently', ->
      it 'should initialize matrix', ->
        rotated = engine.data.Matrix::_mat4.create()
        rotated = engine.data.Matrix::_mat4.rotateZ(rotated, rotated, 180 * (Math.PI / 180))
        rotate = ['rotateZ', 0.5]
        expect(engine.data.Command(rotate).solve(engine.data, rotate)).
          to.eql rotated

    describe 'as nested commands', ->
      it 'should return final matrix', ->
        rotated = engine.data.Matrix::_mat4.create()
        rotated = engine.data.Matrix::_mat4.rotateY(rotated, rotated, - 18 * (Math.PI / 180))
        rotated = engine.data.Matrix::_mat4.rotateZ(rotated, rotated, 180 * (Math.PI / 180))
        rotate = ['rotateZ', ['rotateY', -0.05], 0.5]
        expect(engine.data.Command(rotate).solve(engine.data, rotate)).
          to.eql rotated

    describe 'as flat commands', ->
      it 'should return final matrix', ->
        rotated = engine.data.Matrix::_mat4.create()
        rotated = engine.data.Matrix::_mat4.rotateY(rotated, rotated, - 18 * (Math.PI / 180))
        rotated = engine.data.Matrix::_mat4.rotateZ(rotated, rotated, 180 * (Math.PI / 180))
        rotate = [['rotateY', -0.05], ['rotateZ', 0.5]]
        expect(engine.data.Command(rotate).solve(engine.data, rotate)).
          to.eql rotated

  describe 'defined as a sequence of matrix operations', ->
    it 'should group together', ->
      sequence = [
        ['translateX', 3],
        ['rotateZ', 2]
      ]
      expect(engine.data.Command(sequence)).to.be.an.
        instanceof(engine.data.Matrix::Sequence)
      expect(engine.data.Command(['translateX', 3])).to.eql(sequence[0].command)
      expect(engine.data.Command(['rotateZ', 3])).to.not.eql(sequence[1].command)
      expect(engine.data.Command(['rotateZ', ['translateX', 3], 3])).to.eql(sequence[1].command)
      expect(->
        engine.data.Command([
          1,
          ['rotateZ', 2]
        ])
      ).to.throw(/Undefined/)

  describe 'when used with variables', ->
    it 'should update and recompute matrix', (done) ->
      expect(engine.solve([
        ['translateX', 3]
        ['rotateZ', ['get', 'a']]
      ])).to.eql(1)
