expect = chai.expect
assert = chai.assert



describe 'Signatures', ->
    
    


  
  
  engine = null
  describe 'dispatched by argument types', ->
    PrimitiveCommand = GSS.Engine::Command.extend {
      signature: [
        left: ['String', 'Variable']
        right: ['Number']
      ]
    }, {
      'primitive': () ->
    }
  
    before ->
      engine = new GSS
      engine.input.PrimitiveCommand = PrimitiveCommand
      engine.compile()
    
    describe 'with primitive', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['primitive', 'test'])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', 'test', 10])).to.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', 'test', 'test'])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['undeclared', 'test', 10])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['undeclared', 'test', 'test'])).to.be.an.instanceof(engine.input.Default)

    describe 'with variables', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['primitive', ['get', 'test']])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', ['get', 'test'], 10])).to.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', ['get', 'test'], 'test'])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', ['get', 'test'], ['get', 'test']])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['undeclared', ['get', 'test'], 10])).to.be.an.instanceof(engine.input.Default)
    
    describe 'with expressions', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['primitive', ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', ['+',  ['get', 'test'], 1], 10])).to.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', ['+',  ['get', 'test'], 1], 'test'])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['primitive', ['+',  ['get', 'test'], 1], ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(PrimitiveCommand.primitive)
        expect(engine.input.Command(['undeclared', ['+',  ['get', 'test'], 1], 10])).to.be.an.instanceof(engine.input.Default)
  
  
  
  describe 'dispatched with optional arguments', ->
    UnorderedCommand = GSS.Engine::Command.extend {
      signature: [[
        left: ['String', 'Variable']
        right: ['Number']
        mode: ['Number']
      ]]
    }, {
      'unordered': () ->
    } 

    before ->
      engine = new GSS
      engine.input.UnorderedCommand = UnorderedCommand
      
      engine.compile()
    
    describe 'and no required arguments', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['unordered', 'test'])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', 'test', 10])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', 'test', 10, 20])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', 10, 'test', 20])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', 10, 20, 'test'])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', 10, 20, 'test', 30])).to.not.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', 'test', 'test'])).to.not.be.an.instanceof(UnorderedCommand.unordered)

    describe 'with variables', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['unordered', ['get', 'test']])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', ['get', 'test'], 10])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', ['get', 'test'], 'test'])).to.not.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', ['get', 'test'], ['get', 'test']])).to.not.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['undeclared', ['get', 'test'], 10])).to.be.an.instanceof(engine.input.Default)
    
    describe 'with expressions', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['unordered', ['+',  ['get', 'test'], 1]])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', ['+',  ['get', 'test'], 1], 10])).to.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', ['+',  ['get', 'test'], 1], 'test'])).to.not.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['unordered', ['+',  ['get', 'test'], 1], ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(UnorderedCommand.unordered)
        expect(engine.input.Command(['undeclared', ['+',  ['get', 'test'], 1], 10])).to.be.an.instanceof(engine.input.Default)

  describe 'optional group with order specific type declaration', ->
    before ->
      engine = new GSS
      engine.input.FancyTypes = GSS.Engine::Command.extend {
        signature: [[
          left: ['String', 'Variable']
          right: ['Number', 'String']
          mode: ['Number', 'Variable']
        ]]
      }, {
        'fancy': () ->
      } 
      engine.compile()


    it 'should respect type order', ->
      expect(engine.input.Command(['fancy', 'test']).permutation).to.eql([0])
      expect(engine.input.Command(['fancy', 'test', 'test']).permutation).to.eql([0, 1])
      expect(engine.input.Command(['fancy', 1]).permutation).to.eql([1])
      expect(engine.input.Command(['fancy', 1, 1]).permutation).to.eql([1, 2])
      expect(engine.input.Command(['fancy', 1, 'a']).permutation).to.eql([1, 0])
      expect(engine.input.Command(['fancy', 1, 'a', 1]).permutation).to.eql([1, 0, 2])
      #expect(engine.input.Command(['fancy', 1, 'a', 'b']).permutation).to.eql(undefined)
      expect(engine.input.Command(['fancy', 'a', 1]).permutation).to.eql([0, 1])
      expect(engine.input.Command(['fancy', 'a', 1, 2]).permutation).to.eql([0, 1, 2])

  describe 'optional groups and mixed with optional groups', ->
    OptionalGroupCommand = GSS.Engine::Command.extend {
      signature: [
        left: ['Variable', 'String']
        [
          a: ['String']
          b: ['Number']
        ]
        right: ['Number']
        [
          c: ['Number']
        ]
      ]
    }, {
      'optional': () ->
    }
  
    before ->
      engine = new GSS
      engine.input.OptionalGroupCommand = OptionalGroupCommand
      engine.compile()
      
    describe 'and no required arguments', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['optional', 'test'])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', 'test', 10])).to.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', 'test', 10, 20])).to.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', 'test', 10, 'test', 20])).to.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', 'test', 10, 20, 'test'])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', 'test', 10, 'test', 20, 30])).to.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', 'test', 'test'])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', 'test', 10, 'test', 20, 30]).permutation).to.eql([0,2,1,3,4])
        expect(engine.input.Command(['optional', 'test', 10, 'test', 20]).permutation).to.eql([0,2,1,3])
        expect(engine.input.Command(['optional', 'test', 10, 20]).permutation).to.eql([0,2,3])

    describe 'with variables', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['optional', ['get', 'test']])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', ['get', 'test'], 10])).to.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', ['get', 'test'], 'test'])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', ['get', 'test'], ['get', 'test']])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['undeclared', ['get', 'test'], 10])).to.be.an.instanceof(engine.input.Default)
    
    describe 'with expressions', ->
      it 'should match property function definition', ->
        expect(engine.input.Command(['optional', ['+',  ['get', 'test'], 1]])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', ['+',  ['get', 'test'], 1], 10])).to.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', ['+',  ['get', 'test'], 1], 'test'])).to.not.be.an.instanceof(OptionalGroupCommand.optional)
        expect(engine.input.Command(['optional', ['+',  ['get', 'test'], 1], 'test', 10])).to.be.an.instanceof(OptionalGroupCommand.optional)

  describe 'dispatched subclassed with dynamic condition', ->

    WrapperCommand = GSS.Engine::Command.extend {
      signature: [
        left: ['DynamicCommand']
        right: ['Number']
      ]
    }, {
      'wrapper': (a) ->
        return ['wrapper', a]
    }


    DynamicCommand = GSS.Engine::Command.extend {
      type: 'DynamicCommand'
      signature: []
    }, {
      'dynamic': (a) ->
        return [666]
    }

    DynamicCommand.Positive = DynamicCommand.extend {
      kind: 'auto'
      condition: (engine, operation) ->
        return operation.parent[2] > 0

    }

    DynamicCommand.Negative = DynamicCommand.extend {
      kind: 'auto'
      condition: (engine, operation) ->
        return operation.parent[2] < 0
    }
    
    before ->
      engine = new GSS
      engine.input.WrapperCommand = WrapperCommand
      engine.input.DynamicCommand = DynamicCommand
      engine.compile()

    it 'should dispatch command', ->
      engine.input.Command(cmd = ['wrapper', ['dynamic'], 0])
      expect(cmd[1].command).to.be.an.instanceof DynamicCommand.dynamic
      engine.input.Command(cmd = ['wrapper', ['dynamic'], +1])
      expect(cmd[1].command).to.be.an.instanceof DynamicCommand.Positive
      engine.input.Command(cmd = ['wrapper', ['dynamic'], -1])
      expect(cmd[1].command).to.be.an.instanceof DynamicCommand.Negative
      


  describe 'dispatched with object as callee', ->
    ObjectCommand = GSS.Engine::Command.extend {
      signature: [
        left: ['Variable', 'String']
        [
          c: ['Number']
        ]
      ]
    }, {
      'object': (a,b,c) ->
        return [a,b,c]
    }
    
    before ->
      engine = new GSS
      engine.input.ObjectCommand = ObjectCommand
      engine.compile()

    it 'should dispatch command', ->
      z = {title: 'God Object'}
      expect(engine.input.Command([z, 1, 'v'])).to.not.be.an.instanceof ObjectCommand.object
      expect(engine.input.Command([z, 'v', 1])).to.be.an.instanceof ObjectCommand.object


