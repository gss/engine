{expect} = chai

describe 'Selectors', ->
  engine = null
  before ->
    container = document.createElement('div')
    engine = new GSS(container)
    engine.compile()
    
  describe 'dispatched by argument types', ->
    it 'should create command instance for each operation', ->
      expect(engine.document.Command(['tag', 'div'])).to.be.an.instanceof(engine.document.Selector.Selecter)
      expect(engine.document.Command(['tag', 'div'])).to.be.an.instanceof(engine.document.Selector)
      expect(engine.document.Command(['tag', 'div'])).to.be.an.instanceof(engine.document.Selector)
      expect(engine.document.Command(['tag', ['tag', 'div'], 'div'])).to.be.an.instanceof(engine.document.Selector.Qualifier)
