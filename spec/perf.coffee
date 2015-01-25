Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

remove = (el) ->
  el.parentNode.removeChild(el)

stringify = JSON.stringify
stringify = (o) -> o
expect = chai.expect
assert = chai.assert

describe 'Perf', ->
  ['with worker', 'without worker'].forEach (title, i) ->
    describe title, ->
      scope = null
      engine = null

      beforeEach ->
        fixtures = document.getElementById 'fixtures'
        scope = document.createElement 'div'
        fixtures.appendChild scope
        engine = new GSS(scope, i == 0)     

      afterEach (done) ->
        remove(scope)
        engine.destroy()
        done()

      @timeout 15000


      describe 'live command perfs1', ->
        
        it '100 at once', (done) ->

          innerHTML = "" 
          for i in [0...100] 
            innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>"
          scope.innerHTML = innerHTML
          #GSS.console.profile(123)

          engine.once 'solve', ->
            scope.innerHTML = ""
            engine.then ->
              done()

          engine.solve [
            ['==', ['get', ['.','box'], 'width'], ['get', ['.','box'],'x']]
          ]
          

        it '100 intrinsics at once', (done) ->

          innerHTML = "" 
          for i in [0...100] 
            innerHTML += "<div class='box' id='gen-00" + i + "'>One</div>"
          scope.innerHTML = innerHTML

          engine.once 'solve', ->     
            scope.innerHTML = ""
            engine.then ->
              done()
            
          engine.solve [
              ['==', ['get', ['.','box'], 'width'], ['get', ['.','box'], 'intrinsic-width']]
            ]
          
            
        
        it '100 serially', (done) ->
          scope.innerHTML = ""
          

          count = 1
          
          # first one here otherwise, nothing to solve
          scope.insertAdjacentHTML 'beforeend', """
              <div class='box' id='gen-35346#{count}'>One</div>
            """    
          GSS.console.profile('100 serially')  
          listener = (e) ->       
            count++
            #GSS.console.error(count)
            if count is 100
              engine.removeEventListener 'solve', listener
              GSS.console.profileEnd('100 serially')
              scope.innerHTML = ""
              engine.then ->
                done()
            else
              scope.insertAdjacentHTML 'beforeend', """
                <div class='box' id='gen-35346#{count}'>One</div>
              """

          engine.addEventListener 'solve', listener
        

          engine.solve [
            ['==', ['get', ['.','box'], 'width'], ['get', ['.','box'],'x']]
          ]

        it '100 intrinsics serially', (done) ->
          scope.innerHTML = ""

          count = 1
          
          # first one here otherwise, nothing to solve
          scope.insertAdjacentHTML 'beforeend', """
              <div class='box' id='35346#{count}'>One</div>
            """   
          GSS.console.profile('100 intrinsics serially')   
          listener = (e) ->        
            count++
            scope.insertAdjacentHTML 'beforeend', """
                <div class='box' id='35346#{count}'>One</div>
              """
            if count is 100
              engine.removeEventListener 'solve', listener
              GSS.console.profileEnd('100 intrinsics serially')
              scope.innerHTML = ""
              engine.then ->
                done()
              
          engine.addEventListener 'solve', listener

          engine.solve [
              ['==', ['get', ['.','box'], 'width'], ['get', ['.','box'], 'intrinsic-width']]
            ]
          