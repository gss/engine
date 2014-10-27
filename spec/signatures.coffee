expect = chai.expect
assert = chai.assert

describe 'Signatures', ->
  scope = null
  engine = null
    
  PrimitiveCommand = GSS.Command.extend {
    signature: [
      left: ['String', 'Value']
      right: ['Number']
    ]
  }, {
    'primitive': () ->
  }
    
  UnorderedCommand = GSS.Command.extend {
    signature: [[
      left: ['String', 'Value']
      right: ['Number']
      mode: ['Number']
    ]]
  }, {
    'unordered': () ->
  }
  

  engine = new GSS
  engine.CMD = CMD
  engine.compile()
  
  
  
  decsribe 'dispatched by argument types', ->
    describe 'with primitive', ->
      it 'should match property function definition', ->
        expect(engine.Command(['primitive', 'test'])).to.not.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['primitive', 'test', 10])).to.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['primitive', 'test', 'test'])).to.not.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['undeclared', 'test', 10])).to.not.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['undeclared', 'test', 'test'])).to.be.an.instanceof(GSS.Command)

    describe 'with variables', ->
      it 'should match property function definition', ->
        expect(engine.Command(['primitive', ['get', 'test']])).to.not.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['primitive', ['get', 'test'], 10])).to.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['primitive', ['get', 'test'], 'test'])).to.not.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['primitive', ['get', 'test'], ['get', 'test']])).to.not.be.an.instanceof(PrimtiveCommand.primitive)
        expect(engine.Command(['undeclared', ['get', 'test'], 10])).to.be.an.instanceof(GSS.Command)
    
    describe 'with expressions', ->
      it 'should match property function definition', ->
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1], 10])).to.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1], 'test'])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1], ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['undeclared', ['+',  ['get', 'test'], 1] 10])).to.be.an.instanceof(GSS.Command)
  
  
  
  decsribe 'dispatched with optional arguments', ->
    describe 'and no required arguments', ->
      it 'should match property function definition', ->
        expect(engine.Command(['primitive', 'test'])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', 'test', 10])).to.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', 'test', 'test'])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['undeclared', 'test', 10])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['undeclared', 'test', 'test'])).to.be.an.instanceof(GSS.Command)

    describe 'with variables', ->
      it 'should match property function definition', ->
        expect(engine.Command(['primitive', ['get', 'test']])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['get', 'test'], 10])).to.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['get', 'test'], 'test'])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['get', 'test'], ['get', 'test']])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['undeclared', ['get', 'test'], 10])).to.be.an.instanceof(GSS.Command)
    
    describe 'with expressions', ->
      it 'should match property function definition', ->
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1], 10])).to.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1], 'test'])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['primitive', ['+',  ['get', 'test'], 1], ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(PrimtiveCommand.a)
        expect(engine.Command(['undeclared', ['+',  ['get', 'test'], 1] 10])).to.be.an.instanceof(GSS.Command)
  