
describe 'Selectors', ->
  engine = null
  before ->
    container = document.createElement('div')
    engine = new GSS(container)
    engine.compile(true)
    
  describe 'dispatched by argument types', ->
    it 'should create command instance for each operation', ->
      expect(engine.document.Command(['tag', 'div'])).to.be.an.instanceof(engine.document.Selector.Selecter)
      expect(engine.document.Command(['tag', 'div'])).to.be.an.instanceof(engine.document.Selector)
      expect(engine.document.Command(['tag', 'div'])).to.be.an.instanceof(engine.document.Selector)
      expect(engine.document.Command(['tag', ['tag', 'div'], 'div'])).to.be.an.instanceof(engine.document.Selector.Qualifier)

    it 'should have absolute and relative path set for each command', ->
      expect(engine.document.Command(['tag', 'div']).path).to.eql('div')
      expect(engine.document.Command(['tag', 'h1']).key).to.eql('h1')
      expect(engine.document.Command(['class', ['tag', 'p'], 'active']).path).to.eql('p.active')
      expect(engine.document.Command(['class', ['tag', 'p'], 'active']).key).to.eql('.active')
      
      expect(engine.document.Command(['tag', ['+', ['class', ['tag', 'p'], 'active']], 'em']).path).to.eql('p.active+em')

      expect(engine.document.Command(['[*=]', ['+', ['class', ['tag', 'p'], 'active']], 'em', 'v']).path).to.eql('p.active+[em*="v"]')
    
    it 'should group commands by tags', ->
      expect(engine.document.Command(['id', [' ', ['class', ['tag', ['>'], 'p'], 'active']], 'button']).selector).to.eql(' #button')
      expect(engine.document.Command(['id', [' ', ['class', ['tag', ['>'], 'p'], 'active']], 'button']).path).to.eql('>p.active #button')
      expect(engine.document.Command(['class', ['tag', 'p'], 'active']).selector).to.eql('p.active')
      expect(engine.document.Command(['class', ['tag', ['~~'], 'p'], 'active']).path).to.eql('~~p.active')
      expect(engine.document.Command(['class', ['tag', ['~~'], 'p'], 'active']).selector).to.eql('p.active')
      expect(engine.document.Command(['!~', ['class', ['tag', ['~~'], 'p'], 'active']]).selector).to.eql(undefined)
      expect(engine.document.Command(['!~', ['class', ['tag', ['~~'], 'p'], 'active']]).path).to.eql('~~p.active!~')
      expect(engine.document.Command(['class', ['tag', [' ', ['~~']], 'p'], 'active']).head.command.path).to.eql('~~ p.active')
      expect(engine.document.Command(['class', ['tag', [' ', ['~~']], 'p'], 'active']).tail.command.path).to.eql('~~ ')
      expect(engine.document.Command(['class', ['tag', [' ', ['~~']], 'p'], 'active']).selector).to.eql(' p.active')
    
    it 'should group elements in comma', ->
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active']]).path).to.eql('p.active')
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active']]).selector).to.eql('p.active')
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active']]).tail.command.path).to.eql('p')
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active']]).head.command.path).to.eql('p.active')
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active'], ['tag', 'p']]).selector).to.eql('p.active,p')
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active'], ['tag', 'p']]).path).to.eql('p.active,p')
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).path).to.eql('p.active,p~~')
      expect(engine.document.Command([',', ['class', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).selector).to.eql(undefined)