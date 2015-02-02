
chai = require 'chai' if not chai?
assert = chai.assert
expect = chai.expect

Engine = require('../../src/Engine.coffee');

describe 'On node.js', ->
  engine = null

  beforeEach ->
    engine = new Engine()
    return
  afterEach ->
    engine.destroy() if engine
    engine = null

  describe 'single solving domain', ->
    it 'should find solutions', ->
      expect(engine.solve [
        ['==',
          ['get', 'result']
          ['+',
            ['get', 'a']
            1
          ]
        ]
      ]).to.eql 
        result: 0
        a: -1


