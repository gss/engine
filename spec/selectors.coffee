
expect = chai.expect
assert = chai.assert

describe 'Selectors', ->
  engine = null
  before ->
    container = document.createElement('div')
    engine = new GSS(container)
    engine.compile()
    
  describe 'nested', ->
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


  describe 'flat', ->
    it 'should create command instance for each operation', ->
      engine.input.Command([
        first = ['tag', 'div']
        last = ['tag', 'div']
      ])
      expect(first.command).to.be.an.instanceof(engine.input.Selector.Selecter)
      expect(last.command).to.be.an.instanceof(engine.input.Selector.Qualifier)

    it 'should have absolute and relative path set for each command', ->
      engine.input.Command([
        ['&'], 
        last = ['tag', 'h1']
      ])
      #expect(last.command.path).to.eql('&h1')
      engine.input.Command([
        first = ['tag', 'p']
        last = ['.', 'active']
      ])
      expect(first.command.path).to.eql('p')
      expect(last.command.path).to.eql('p.active')
      
      engine.input.Command([
        first  = ['tag', 'p'], 
        second = ['.', 'active'], 
        third  = ['+'], 
        last   = ['tag', 'em']
      ])
      expect(first.command.path).to.eql('p')
      expect(second.command.path).to.eql('p.active')
      expect(third.command.path).to.eql('p.active+')
      expect(last.command.path).to.eql('p.active+em')


      engine.input.Command([
        first  = ['tag', 'p'], 
        second = ['.', 'active'], 
        third  = ['+'], 
        fourth = ['tag', 'em']
        last   = ['[*=]', 'em', 'v']
      ])
      expect(first.command.path).to.eql('p')
      expect(second.command.path).to.eql('p.active')
      expect(third.command.path).to.eql('p.active+')
      expect(fourth.command.path).to.eql('p.active+em')
      expect(last.command.path).to.eql('p.active+em[em*="v"]')
    
    it 'should group commands by tags', ->
      expect(engine.input.Command([
        a = ['>'], 
        b = ['tag', 'p'], 
        c = ['.', 'active']
        d = [' ']
        e = ['#', 'button']
      ]).path).to.eql('>p.active #button')
      expect(a.command.selector).to.eql(undefined)
      expect(b.command.selector).to.eql(undefined)
      expect(c.command.selector).to.eql('p.active')
      expect(d.command.selector).to.eql(undefined)
      expect(e.command.selector).to.eql(' #button')

      expect(a.command.path).to.eql('>')
      expect(b.command.path).to.eql('>p')
      expect(c.command.path).to.eql('>p.active')
      expect(d.command.path).to.eql('>p.active ')
      expect(e.command.path).to.eql('>p.active #button')

    it 'should group elements in comma', ->

      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']], [['tag', 'p'], ['~~']]]).path).to.eql('p.active,p~~')
      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']], ['tag', 'p']]).selector).to.eql('p.active,p')
      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']]]).path).to.eql('p.active')
      engine.input.Command(last = [',', [['tag', 'p'], ['.', 'active']]])
      expect(last.command.path).to.eql('p.active')

      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']]]).tail.command.path).to.eql('p.active')
      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']]]).head.command.path).to.eql('p.active')
      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']], ['tag', 'p']]).path).to.eql('p.active,p')
      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']], ['tag', 'p']]).selector).to.eql('p.active,p')
      expect(engine.input.Command([',', [['tag', 'p'], ['.', 'active']], [['tag', 'p'], ['~~']]]).selector).to.eql(undefined)

      expect(engine.input.Command([',', [['~~'], ['.', 'active']], [['++'], ['.', 'active']]]).selector).to.eql(undefined)
      expect(engine.input.Command([',', ['.', 'a'], [['$'], [' '], ['.', 'b']]]).selector).to.eql(undefined)
      expect(engine.input.Command([',', ['.', 'a'], [['$'], [' '], ['.', 'b']]]).path).to.eql('.a,$ .b')
      expect(engine.input.Command([',', ['.', 'a'], [['$'], ['.', 'b']]]).selector).to.eql(undefined)
      expect(engine.input.Command([',', ['.', 'a'], [['$'], ['.', 'b']]]).path).to.eql('.a,$.b')