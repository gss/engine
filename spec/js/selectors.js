describe('Selectors', function() {
  var engine;
  engine = null;
  before(function() {
    var container;
    container = document.createElement('div');
    engine = new GSS(container);
    return engine.compile(true);
  });
  return describe('dispatched by argument types', function() {
    it('should create command instance for each operation', function() {
      expect(engine.document.Command(['tag', 'div'])).to.be.an["instanceof"](engine.document.Selector.Selecter);
      expect(engine.document.Command(['tag', 'div'])).to.be.an["instanceof"](engine.document.Selector);
      expect(engine.document.Command(['tag', 'div'])).to.be.an["instanceof"](engine.document.Selector);
      return expect(engine.document.Command(['tag', ['tag', 'div'], 'div'])).to.be.an["instanceof"](engine.document.Selector.Qualifier);
    });
    it('should have absolute and relative path set for each command', function() {
      expect(engine.document.Command(['tag', 'div']).path).to.eql('div');
      expect(engine.document.Command(['tag', 'h1']).key).to.eql('h1');
      expect(engine.document.Command(['.', ['tag', 'p'], 'active']).path).to.eql('p.active');
      expect(engine.document.Command(['.', ['tag', 'p'], 'active']).key).to.eql('.active');
      expect(engine.document.Command(['tag', ['+', ['.', ['tag', 'p'], 'active']], 'em']).path).to.eql('p.active+em');
      return expect(engine.document.Command(['[*=]', ['+', ['.', ['tag', 'p'], 'active']], 'em', 'v']).path).to.eql('p.active+[em*="v"]');
    });
    it('should group commands by tags', function() {
      expect(engine.document.Command(['#', [' ', ['.', ['tag', ['>'], 'p'], 'active']], 'button']).selector).to.eql(' #button');
      expect(engine.document.Command(['#', [' ', ['.', ['tag', ['>'], 'p'], 'active']], 'button']).path).to.eql('>p.active #button');
      expect(engine.document.Command(['.', ['tag', 'p'], 'active']).selector).to.eql('p.active');
      expect(engine.document.Command(['.', ['tag', ['~~'], 'p'], 'active']).path).to.eql('~~p.active');
      expect(engine.document.Command(['.', ['tag', ['~~'], 'p'], 'active']).selector).to.eql('p.active');
      expect(engine.document.Command(['!~', ['.', ['tag', ['~~'], 'p'], 'active']]).selector).to.eql(void 0);
      expect(engine.document.Command(['!~', ['.', ['tag', ['~~'], 'p'], 'active']]).path).to.eql('~~p.active!~');
      expect(engine.document.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).head.command.path).to.eql('~~ p.active');
      expect(engine.document.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).tail.command.path).to.eql('~~ ');
      return expect(engine.document.Command(['.', ['tag', [' ', ['~~']], 'p'], 'active']).selector).to.eql(' p.active');
    });
    return it('should group elements in comma', function() {
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).path).to.eql('p.active');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).selector).to.eql('p.active');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).tail.command.path).to.eql('p');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active']]).head.command.path).to.eql('p.active');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['tag', 'p']]).selector).to.eql('p.active,p');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['tag', 'p']]).path).to.eql('p.active,p');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).path).to.eql('p.active,p~~');
      expect(engine.document.Command([',', ['.', ['tag', 'p'], 'active'], ['~~', ['tag', 'p']]]).selector).to.eql(void 0);
      expect(engine.document.Command([',', ['.', ['~~'], 'active'], ['.', ['++'], 'active']]).selector).to.eql(void 0);
      expect(engine.document.Command([',', ['.', 'a'], ['.', [' ', ['$']], 'b']]).selector).to.eql(void 0);
      return expect(engine.document.Command([',', ['.', 'a'], ['.', ['$'], 'b']]).selector).to.eql(void 0);
    });
  });
});
