
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
      expect(engine.intrinsic.Command(['translateX', 3])).to.be.an.
        instanceof(engine.intrinsic.Matrix.Transformation1)
      expect(engine.intrinsic.Command(['translateX', 3])).to.be.an.
        instanceof(engine.intrinsic.Matrix)

      expect(-> engine.intrinsic.Command(['translateX', 3, 3])).to.
        throw(/Too many/)

      expect(-> engine.intrinsic.Command(['translateX', 'a'])).to.
        throw(/Unexpected argument/)

  describe 'when executed', ->
    it 'should compute matrix', ->
      rotated = engine.intrinsic.Matrix::_mat4.create()
      rotated = engine.intrinsic.Matrix::_mat4.rotateZ(rotated, rotated, 180)
      rotate = ['rotateZ', 0.5]
      expect(engine.intrinsic.Command(rotate).solve(engine.intrinsic, rotate)).
        to.eql rotated

  describe 'defined as a sequence of matrix operations', ->
    it 'should group together', ->
      sequence = [
        ['translateX', 3],
        ['rotateZ', 2]
      ]
      expect(engine.intrinsic.Command(sequence)).to.be.an.
        instanceof(engine.intrinsic.Matrix::Sequence)
      expect(engine.intrinsic.Command(['translateX', 3])).to.eql(sequence[0].command)
      expect(engine.intrinsic.Command(['rotateZ', 3])).to.not.eql(sequence[1].command)
      expect(engine.intrinsic.Command(['rotateZ', 3])).to.not.eql(sequence[1].command)
      expect(engine.intrinsic.Command(['rotateZ', ['translateX', 3], 3])).to.eql(sequence[1].command)
      expect(->
        engine.intrinsic.Command([
          1,
          ['rotateZ', 2]
        ])
      ).to.throw(/Undefined/)