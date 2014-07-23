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


  describe 'live command perfs1', ->
    
    it '100 at once', (done) ->
      console.timeline()

      innerHTML = "" 
      for i in [0...100] 
        innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>"
      scope.innerHTML = innerHTML
      #console.profile(123)
      console.profile('100 at once')

      console.timeStamp(321)

      engine.once 'solved', ->
        console.timeStamp(123)
        console.profileEnd('100 at once')
        #console.profileEnd(123)
        console.timeStamp(123)
        done()

      engine.run [
        ['==', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'],'[x]']]
      ]
      

  describe 'live command perfs', ->
    it '100 intrinsics at once', (done) ->

      innerHTML = "" 
      for i in [0...100] 
        innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>"
      scope.innerHTML = innerHTML

      console.profile('100 intrinsics at once')
      engine.once 'solved', ->     
        done()
        console.profileEnd('100 intrinsics at once')

      engine.run [
          ['==', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'], '[intrinsic-width]']]
        ]
      
        
    
    it '100 serially', (done) ->
      scope.innerHTML = ""
      

      count = 1
      
      # first one here otherwise, nothing to solve
      scope.insertAdjacentHTML 'beforeend', """
          <div class='box' id='gen-35346#{count}'>One</div>
        """    
      #console.profile('100 serially')  
      listener = (e) ->       
        count++
        #console.error(count)
        if count is 100
          engine.removeEventListener 'solved', listener
          #console.profileEnd('100 serially')
          done()
          debugger
        else
          scope.insertAdjacentHTML 'beforeend', """
              <div class='box' id='gen-35346#{count}'>One</div>
            """

      engine.addEventListener 'solved', listener
    

      engine.run [
        ['==', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'],'[x]']]
      ]

    it '100 intrinsics serially', (done) ->
      scope.innerHTML = ""

      count = 1
      
      # first one here otherwise, nothing to solve
      scope.insertAdjacentHTML 'beforeend', """
          <div class='box' id='35346#{count}'>One</div>
        """   
      console.profile('100 intrinsics serially')   
      listener = (e) ->        
        count++
        scope.insertAdjacentHTML 'beforeend', """
            <div class='box' id='35346#{count}'>One</div>
          """
        if count is 100
          engine.removeEventListener 'solved', listener
          console.profileEnd('100 intrinsics serially')
          done()
          
      engine.addEventListener 'solved', listener

      engine.run [
          ['==', ['get', ['$class','box'], '[width]'], ['get', ['$class','box'], '[intrinsic-width]']]
        ]
      