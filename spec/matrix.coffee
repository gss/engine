
expect = chai.expect
assert = chai.assert


describe 'Matrix', ->
  engine = null
  before ->
    container = document.createElement('div')
    engine = new GSS(container)
    engine.compile()
    
  describe 'dispatched by argument types', ->
    it 'should create command instance for each operation', ->
      expect(engine.intrinsic.Command(['translateX', 3])).to.be.an.
        instanceof(engine.intrinsic.Matrix.Transformation1)
      expect(engine.intrinsic.Command(['translateX', 3])).to.be.an.
        instanceof(engine.intrinsic.Matrix)

      expect(-> engine.intrinsic.Command(['translateX', 3, 3])).to.
        throw()
      #expect(engine.intrinsic.Command(['translateX', 3])).to.be.an.instanceof(engine.document.Selector)
      #expect(engine.intrinsic.Command(['translateX', ['tag', 'div'], 'div'])).to.be.an.instanceof(engine.document.Selector.Qualifier)
