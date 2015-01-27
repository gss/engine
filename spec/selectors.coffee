
expect = chai.expect
assert = chai.assert

describe 'Selectors', ->
  engine = null
  before ->
    container = document.createElement('div')
    engine = new GSS(container)
    engine.compile()
    
  describe 'dispatched by argument types', ->
    it 'should create command instance for each operation', ->
      expect(engine.input.Command(['tag', 'div'])).to.be.an.instanceof(engine.input.Selector.Selecter)
      expect(engine.input.Command(['tag', 'div'])).to.be.an.instanceof(engine.input.Selector)
      expect(engine.input.Command(['tag', 'div'])).to.be.an.instanceof(engine.input.Selector)
      expect(engine.input.Command(['tag', ['tag', 'div'], 'div'])).to.be.an.instanceof(engine.input.Selector.Qualifier)

    it 'should have absolute and relative path set for each command', ->
      expect(engine.input.Command(['tag', 'div']).path).to.eql('div')
      expect(engine.input.Command(['tag', 'h1']).key).to.eql('h1')
      expect(engine.input.Command(['tag', ['&'], 'h1']).path).to.eql('&h1')
      
      expect(engine.input.Command(['.', ['tag', 'p'], 'active']).path).to.eql('p.active')
      expect(engine.input.Command(['.', ['tag', 'p'], 'active']).key).to.eql('.active')
      
      expect(engine.input.Command(['tag', ['+', ['.', ['tag', 'p'], 'active']], 'em']).path).to.eql('p.active+em')

      expect(engine.input.Command(['[*=]', ['+', ['.', ['tag', 'p'], 'active']], 'em', 'v']).path).to.eql('p.active+[em*="v"]')
    
    it 'should group commands by tags', ->
      expect(engine.input.Command(['#', [' ', ['.', ['tag', ['>'], 'p'], 'active']], 'button']).selector).to.eql(' #button')
      expect(engine.input.Command(['#', [' ', ['.', ['tag', ['>'], 'p'], 'active']], 'button']).path).to.eql('>p.active #button')
      expect(engine.input.Command(['.', ['tag', 'p'], 'active']).selector).to.eql('p.active')
      expect(engine.input.Command(['.', ['tag', ['~~'], 'p'], 'active']).path).to.eql('~~p.active')
      expect(engine.input.Command(['.', ['tag', ['~~'], 'p'], 'active']).selector).to.eql('p.active')
      expect(engine.input.Command(['!~', ['.', ['tag', ['~~'], 'p'], 'active']]).selector).to.eql(undefined)
      expect(engine.input.Command(['!~', ['.', ['tag', ['~~'], 'p'], 'active']]).path).to.eql('~~p.active!~')
      expect(engine.input.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).head.command.path).to.eql('~~ p.active')
      expect(engine.input.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).tail.command.path).to.eql('~~ ')
      expect(engine.input.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).selector).to.eql(' p.active')
    
    it 'should group elements in comma', ->
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active']]).path).to.eql('p.active')
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active']]).selector).to.eql('p.active')
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active']]).tail.command.path).to.eql('p')
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active']]).head.command.path).to.eql('p.active')
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active'], ['tag', 'p']]).selector).to.eql('p.active,p')
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active'], ['tag', 'p']]).path).to.eql('p.active,p')
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).path).to.eql('p.active,p~~')
      expect(engine.input.Command([',', ['.', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).selector).to.eql(undefined)

      expect(engine.input.Command([',', ['.', ['~~'], 'active'], ['.', ['++'], 'active']]).selector).to.eql(undefined)
      expect(engine.input.Command([',', ['.', 'a'], ['.', [' ', ['$']], 'b']]).selector).to.eql(undefined)
      expect(engine.input.Command([',', ['.', 'a'], ['.', ['$'], 'b']]).selector).to.eql(undefined)