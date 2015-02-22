Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = null

describe 'GSS engine', ->

  container = null
  engine = null  

  describe 'new GSS(url) - scopeless with web worker', ->
    e = null
    it 'should initialize', ->
      e = new GSS(true)
    it 'should run commands', (done)->
      e.once 'solved', ->
        val = e.values['x']
        assert val == 222, "engine has wrong [x] value: #{val}"

        e.once 'solved', ->
          val = e.values['x']
          assert val == undefined, "engine has wrong [x] value: #{val}"

          done()
        
        e.solve ['remove', 'tracker']

      e.solve [
          ['==', ['get','x'], 222]
        ], 'tracker'
    it 'should destroy', (done)->
      e.destroy()
      done()
    
  describe 'GSS() - scopeless & no web workers', ->
    e = null
    it 'should initialize', ->
      e = new GSS()
    it 'should run commands', (done)->
      e.once 'solved', ->
        val = e.values['x']
        assert val == 222, "engine has wrong [x] value: #{val}"

        e.once 'solved', ->
          val = e.values['x']
          assert val == undefined, "engine has wrong [x] value: #{val}"


          done()
        
        e.solve ['remove', 'tracker']

      e.solve [
          ['==', ['get','x'], 222]
        ], 'tracker'
    it 'should destroy', (done)->
      e.destroy()
      done()
  

