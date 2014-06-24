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
    engine = new GSS(scope, '../dist/worker.js')     

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

      engine.once 'solved', ->
        done()

      engine.add [
        ['eq', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'],'[x]']]
      ]
      
      
    it '100 intrinsics at once', (done) ->

      innerHTML = "" 
      for i in [0...100] 
        innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>"
      scope.innerHTML = innerHTML

      engine.once 'solved', ->     
        done()

      engine.add [
          ['eq', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'], '[intrinsic-width]']]
        ]
      
        
    
    it '100 serially', (done) ->
      scope.innerHTML = ""
      

      count = 1
      
      # first one here otherwise, nothing to solve
      scope.insertAdjacentHTML 'beforeend', """
          <div class='box' id='gen-35346#{count}'>One</div>
        """    
      console.profile('1')  
      listener = (e) ->       
        count++
        scope.insertAdjacentHTML 'beforeend', """
            <div class='box' id='gen-35346#{count}'>One</div>
          """
        if count is 100
          engine.removeEventListener 'solved', listener
          done()
          console.profileEnd('1')

      engine.addEventListener 'solved', listener
    

      engine.add [
        ['eq', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'],'[x]']]
      ]

    it '100 intrinsics serially', (done) ->
      scope.innerHTML = ""

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
          engine.removeEventListener 'solved', listener
          done()
          
      engine.addEventListener 'solved', listener

      engine.add [
          ['eq', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'], '[intrinsic-width]']]
        ]
      