var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Signatures', function() {
  var engine;
  engine = null;
  describe('dispatched by argument types', function() {
    var PrimitiveCommand;
    PrimitiveCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['String', 'Variable'],
          right: ['Number']
        }
      ]
    }, {
      'primitive': function() {}
    });
    before(function() {
      engine = new GSS;
      engine.abstract.PrimitiveCommand = PrimitiveCommand;
      return engine.compile(true);
    });
    describe('with primitive', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['primitive', 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', 'test', 10])).to.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', 'test', 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['undeclared', 'test', 10])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        return expect(engine.abstract.Command(['undeclared', 'test', 'test'])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    describe('with variables', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['primitive', ['get', 'test']])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['get', 'test'], 10])).to.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['get', 'test'], 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['get', 'test'], ['get', 'test']])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        return expect(engine.abstract.Command(['undeclared', ['get', 'test'], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    return describe('with expressions', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1], 'test'])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        expect(engine.abstract.Command(['primitive', ['+', ['get', 'test'], 1], ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](PrimitiveCommand.primitive);
        return expect(engine.abstract.Command(['undeclared', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
  });
  describe('dispatched with optional arguments', function() {
    var UnorderedCommand;
    UnorderedCommand = GSS.prototype.Command.extend({
      signature: [
        [
          {
            left: ['String', 'Variable'],
            right: ['Number'],
            mode: ['Number']
          }
        ]
      ]
    }, {
      'unordered': function() {}
    });
    before(function() {
      engine = new GSS;
      engine.abstract.UnorderedCommand = UnorderedCommand;
      return engine.compile(true);
    });
    describe('and no required arguments', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['unordered', 'test'])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 'test', 10])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 'test', 10, 20])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 10, 'test', 20])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 10, 20, 'test'])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', 10, 20, 'test', 30])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        return expect(engine.abstract.Command(['unordered', 'test', 'test'])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
      });
    });
    describe('with variables', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['unordered', ['get', 'test']])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['get', 'test'], 10])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['get', 'test'], 'test'])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['get', 'test'], ['get', 'test']])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        return expect(engine.abstract.Command(['undeclared', ['get', 'test'], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    return describe('with expressions', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1]])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1], 'test'])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        expect(engine.abstract.Command(['unordered', ['+', ['get', 'test'], 1], ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](UnorderedCommand.unordered);
        return expect(engine.abstract.Command(['undeclared', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
  });
  describe('optional group with order specific type declaration', function() {
    before(function() {
      engine = new GSS;
      engine.abstract.FancyTypes = GSS.prototype.Command.extend({
        signature: [
          [
            {
              left: ['String', 'Variable'],
              right: ['Number', 'String'],
              mode: ['Number', 'Variable']
            }
          ]
        ]
      }, {
        'fancy': function() {}
      });
      return engine.compile(true);
    });
    return it('should respect type order', function() {
      expect(engine.abstract.Command(['fancy', 'test']).permutation).to.eql([0]);
      expect(engine.abstract.Command(['fancy', 'test', 'test']).permutation).to.eql([0, 1]);
      expect(engine.abstract.Command(['fancy', 1]).permutation).to.eql([1]);
      expect(engine.abstract.Command(['fancy', 1, 1]).permutation).to.eql([1, 2]);
      expect(engine.abstract.Command(['fancy', 1, 'a']).permutation).to.eql([1, 0]);
      expect(engine.abstract.Command(['fancy', 1, 'a', 1]).permutation).to.eql([1, 0, 2]);
      expect(engine.abstract.Command(['fancy', 1, 'a', 'b']).permutation).to.eql(void 0);
      expect(engine.abstract.Command(['fancy', 'a', 1]).permutation).to.eql([0, 1]);
      return expect(engine.abstract.Command(['fancy', 'a', 1, 2]).permutation).to.eql([0, 1, 2]);
    });
  });
  describe('optional groups and mixed with optional groups', function() {
    var OptionalGroupCommand;
    OptionalGroupCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['Variable', 'String']
        }, [
          {
            a: ['String'],
            b: ['Number']
          }
        ], {
          right: ['Number']
        }, [
          {
            c: ['Number']
          }
        ]
      ]
    }, {
      'optional': function() {}
    });
    before(function() {
      engine = new GSS;
      engine.abstract.OptionalGroupCommand = OptionalGroupCommand;
      return engine.compile(true);
    });
    describe('and no required arguments', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['optional', 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 20])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 20, 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20, 30])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20, 30]).permutation).to.eql([0, 2, 1, 3, 4]);
        expect(engine.abstract.Command(['optional', 'test', 10, 'test', 20]).permutation).to.eql([0, 2, 1, 3]);
        return expect(engine.abstract.Command(['optional', 'test', 10, 20]).permutation).to.eql([0, 2, 3]);
      });
    });
    describe('with variables', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['optional', ['get', 'test']])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['get', 'test'], 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['get', 'test'], 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['get', 'test'], ['get', 'test']])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        return expect(engine.abstract.Command(['undeclared', ['get', 'test'], 10])).to.be.an["instanceof"](engine.abstract.Default);
      });
    });
    return describe('with expressions', function() {
      return it('should match property function definition', function() {
        expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1]])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1], 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
        expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1], 'test'])).to.not.be.an["instanceof"](OptionalGroupCommand.optional);
        return expect(engine.abstract.Command(['optional', ['+', ['get', 'test'], 1], 'test', 10])).to.be.an["instanceof"](OptionalGroupCommand.optional);
      });
    });
  });
  describe('dispatched subclassed with dynamic condition', function() {
    var DynamicCommand, WrapperCommand;
    WrapperCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['DynamicCommand'],
          right: ['Number']
        }
      ]
    }, {
      'wrapper': function(a) {
        return ['wrapper', a];
      }
    });
    DynamicCommand = GSS.prototype.Command.extend({
      type: 'DynamicCommand',
      signature: []
    }, {
      'dynamic': function(a) {
        return [666];
      }
    });
    DynamicCommand.Positive = DynamicCommand.extend({
      kind: 'auto',
      condition: function(engine, operation) {
        return operation.parent[2] > 0;
      }
    });
    DynamicCommand.Negative = DynamicCommand.extend({
      kind: 'auto',
      condition: function(engine, operation) {
        return operation.parent[2] < 0;
      }
    });
    before(function() {
      engine = new GSS;
      engine.abstract.WrapperCommand = WrapperCommand;
      engine.abstract.DynamicCommand = DynamicCommand;
      return engine.compile(true);
    });
    return it('should dispatch command', function() {
      var cmd;
      engine.abstract.Command(cmd = ['wrapper', ['dynamic'], 0]);
      expect(cmd[1].command).to.be.an["instanceof"](DynamicCommand.dynamic);
      engine.abstract.Command(cmd = ['wrapper', ['dynamic'], +1]);
      expect(cmd[1].command).to.be.an["instanceof"](DynamicCommand.Positive);
      engine.abstract.Command(cmd = ['wrapper', ['dynamic'], -1]);
      return expect(cmd[1].command).to.be.an["instanceof"](DynamicCommand.Negative);
    });
  });
  return describe('dispatched with object as callee', function() {
    var ObjectCommand;
    ObjectCommand = GSS.prototype.Command.extend({
      signature: [
        {
          left: ['Variable', 'String']
        }, [
          {
            c: ['Number']
          }
        ]
      ]
    }, {
      'object': function(a, b, c) {
        return [a, b, c];
      }
    });
    before(function() {
      engine = new GSS;
      engine.abstract.ObjectCommand = ObjectCommand;
      return engine.compile(true);
    });
    return it('should dispatch command', function() {
      var z;
      z = {
        title: 'God Object'
      };
      expect(engine.abstract.Command([z, 1, 'v'])).to.not.be.an["instanceof"](ObjectCommand.object);
      return expect(engine.abstract.Command([z, 'v', 1])).to.be.an["instanceof"](ObjectCommand.object);
    });
  });
});
