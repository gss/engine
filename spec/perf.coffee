Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

remove = (el) ->
  el.parentNode.removeChild(el)

stringify = JSON.stringify
expect = chai.expect
assert = chai.assert

describe 'Perf', ->
  scope = null
  engine = null

  beforeEach ->
    fixtures = document.getElementById 'fixtures'
    scope = document.createElement 'div'
    fixtures.appendChild scope
    engine = GSS(scope:scope)      

  afterEach (done) ->
    remove(scope)
    engine.destroy()
    done()


  describe 'live command perfs', ->
    
    it '100 at once', (done) ->

      innerHTML = "" 
      for i in [0...100] 
        innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>"
      scope.innerHTML = innerHTML

      engine.run commands: [
          ['eq', ['get$','width',['$class','box']],['get$','x',['$class','box']]]
        ]
      
      listener = (e) ->
        scope.removeEventListener 'solved', listener        
        done()
      scope.addEventListener 'solved', listener
    
    it '100 intrinsics at once', (done) ->

      innerHTML = "" 
      for i in [0...100] 
        innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>"
      scope.innerHTML = innerHTML

      engine.run commands: [
          ['eq', ['get$','width',['$class','box']],['get$','intrinsic-width',['$class','box']]]
        ]
      
      listener = (e) ->
        scope.removeEventListener 'solved', listener        
        done()
      scope.addEventListener 'solved', listener
        
    
    it '100 serially', (done) ->
      scope.innerHTML = ""
      engine.run commands: [
          ['eq', ['get$','width',['$class','box']],['get$','x',['$class','box']]]          
          #['eq', ['get','.box[width]','box'],['get','.box[x]','.box']]
        ]

      count = 1
      
      # first one here otherwise, nothing to solve
      scope.insertAdjacentHTML 'beforeend', """
          <div class='box' id='35346#{count}'>One</div>
        """      
      listener = (e) ->        
        count++
        scope.insertAdjacentHTML 'beforeend', """
            <div class='box' id='35346#{count}'>One</div>
          """
        if count is 100
          scope.removeEventListener 'solved', listener
          done()

      scope.addEventListener 'solved', listener
    
    it '100 intrinsics serially', (done) ->
      scope.innerHTML = ""
      engine.run commands: [
          ['eq', ['get$','width',['$class','box']],['get$','intrinsic-width',['$class','box']]]          
          #['eq', ['get','.box[width]','box'],['get','.box[x]','.box']]
        ]

      count = 1
      
      # first one here otherwise, nothing to solve
      scope.insertAdjacentHTML 'beforeend', """
          <div class='box' id='35346#{count}'>One</div>
        """      
      listener = (e) ->        
        count++
        scope.insertAdjacentHTML 'beforeend', """
            <div class='box' id='35346#{count}'>One</div>
          """
        if count is 100
          scope.removeEventListener 'solved', listener
          done()

      scope.addEventListener 'solved', listener