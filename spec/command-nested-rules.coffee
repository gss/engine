Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

stringify = (o) ->
  return JSON.stringify o, 1, 1

$  = () ->
  return document.querySelector arguments...
  
$$ = () -> 
  return document.querySelectorAll arguments...

remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = document.getElementById 'fixtures'

describe 'Nested Rules', ->
 
  describe 'Basic', ->
    container = null
    engine = null
  
    beforeEach ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
  
    afterEach ->
      remove(container)


    Scenario = (done, container, steps, i) ->
      i = i || 0
      if steps[i]
        container.addEventListener 'solved', callback = ->
          steps[i]()
          container.removeEventListener 'solved', callback
          Scenario(done, container, steps, i + 1)
      else
        done()

    describe 'flat', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'constraint', 
            cssText:'[target-size] == 100', 
            commands: [
              ["eq", ["get","[target-size]"], ["number",100]]
            ]
          }
        ]
        container.innerHTML =  ""
                              
        listener = (e) ->        
          expect(engine.lastWorkerCommands).to.eql [
              ["eq", ["get","[target-size]"], ["number",100]]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
    describe 'mixed selectors', ->
      it 'should support mixed selectors', (done) ->
        rules = [
          {
            type:'constraint', 
            cssText:'(header > h2.gizoogle ! section div:get("parentNode"))[target-size] == 100;
                     (div + main !~ div)[width] == 50', 
            commands: [
              ["eq", 
                ["get$",
                  ['$pseudo',
                    ['$tag',
                      ['$combinator', 
                        ['$tag', 
                          ['$combinator', 
                            ['$class',
                              ['$tag', 
                                ['$combinator', 
                                  ['$tag', 
                                    'header']
                                  '>']
                                'h2']
                              'gizoogle']
                            '!']
                          'section']
                        ' '] 
                      'div']
                    'get', 'parentNode']
                  "[target-size]"]
                ["number",100]
              ]
            ]
          }
        ]
        container.innerHTML =  """
          <section>
            <div>
              <header>
                <h2 class='gizoogle'>
                </h2>
              </header>
            </div>
          </section>
        """
        console.log(container.innerHTML)
        console.info(rules[0].cssText)
          
        Scenario done, container, [->        
          expect(engine.lastWorkerCommands).to.eql [
              ["eq", ["get","[target-size]", "$6", "header>h2.gizoogle$3!$6 $5"], ["number",100]]
            ]
        ]
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

    describe 'reversed sibling combinators', ->
      it 'should support mixed selectors', (done) ->
        rules = [
          {
            type:'constraint', 
            cssText:'(header > h2.gizoogle ! section div:get("parentNode"))[target-size] == 100;
                     (div + main !~ div)[width] == 50', 
            commands: [
              ["eq", 
                ["get$",
                  ['$tag',
                    ['$combinator', 
                      ['$tag', 
                        ['$combinator', 
                          ['$tag', 
                            'div']
                          '+']
                        'main']
                      '!~'] 
                    'div']
                  "[width]"]
                ["number",50]
              ]
            ]
          }
        ]
        container.innerHTML =  """
          <section>
            <div id="box0"></div>
            <main id="box1"></main>
          </section>
        """
        console.log(container.innerHTML)
        console.info(rules[0].cssText)
        main = container.getElementsByTagName('main')[0]

        Scenario done, container, [->        
          expect(engine.lastWorkerCommands).to.eql [
              ["eq", ["get","[width]", "$box0", "div+main$box1!~$box0"], ["number",50]]
            ]
          main.parentNode.removeChild(main)
        , ->


        ]
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

    describe '1 level w/ ::', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel .box']
            rules: [
              {
                type:'constraint', 
                cssText:'::[x] == 100', 
                commands: [
                  ["eq", ["get$","x",["$reserved","::this"]], ["number",100]]
                ]
              }
            ]
          }
        ]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        

          expect(stringify engine.lastWorkerCommands).to.eql stringify [
              ['eq', ['get$','x','$box1', '.vessel .box'], ['number',100]]
              ['eq', ['get$','x','$box2', '.vessel .box'], ['number',100]]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
      


      it 'should resolve selector on ::', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel']
            rules: [
              {
                type:'constraint', 
                cssText:'(:: .box)[x] == 100', 
                commands: [
                  ["eq", 
                    ["get$",
                      "x", 
                      ['$combinator', 
                        ' ', 
                        ["$class", 
                          "box", 
                          ["$reserved","::this"]], 
                      ["number",100]]]]
                ]
              }
            ]
          }
        ]

        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel" id="vessel0">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                        
        box1 = container.getElementsByClassName('box')[1]
        vessel0 = container.getElementsByClassName('vessel')[0] 

        Scenario done, container, [
          TwoElementsMatch = (e) ->  
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['eq', ['get$','x','$box1', '.vessel .box$vessel0'], ['number',100]]
              ['eq', ['get$','x','$box2', '.vessel .box$vessel0'], ['number',100]]
            ])
            box1.classList.remove('box')
          OneChildDoesntMatchAnymore = (e) ->  
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['remove', '.vessel .box$vessel0$box1']
            ])
            box1.classList.add('box')
          ChildMatchesAgain = (e) ->  
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['eq', ['get$','x','$box1', '.vessel .box$vessel0'], ['number',100]]
            ])
            vessel0.classList.remove('vessel')
          ParentDoesntMatchAnyMore = (e) ->  
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['remove', '.vessel$vessel0', '.vessel .box$vessel0']
            ])
            vessel0.classList.add('vessel')
          ParentMatchesAgain = (e) ->  
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['eq', ['get$','x','$box1', '.vessel .box$vessel0'], ['number',100]]
              ['eq', ['get$','x','$box2', '.vessel .box$vessel0'], ['number',100]]
            ])
        ]
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

    describe '1 level w/ multiple selectors and ::this', ->
      it 'should observe all matching elements', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel', '#group1']
            rules: [
              {
                type:'constraint', 
                cssText:'(:: .box:first-child)[x] == 100', 
                commands: [
                  ["eq", ["get$","x",["$reserved","::this", ".box:first-child"]], ["number",100]]
                ]
              }
            ]
          }
        ]

        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel" id="vessel0">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div class="group" id="group1">
            <div id="box3" class="box"></div>
            <div id="box4" class="box"></div>
          </div>
          """
        vessel0 = container.getElementsByClassName('vessel')[0]
        Scenario done, container, [
          TwoElementsMatch = (e) ->  
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['eq', ['get$','x','$box1', '.vessel, #group1 .box:first-child$vessel0'], ['number',100]]
              ['eq', ['get$','x','$box3', '.vessel, #group1 .box:first-child$group1'], ['number',100]]
            ])
            vessel0.classList.remove('vessel')
          OneOfParentSelectorsDoesntMatchAnymore = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['remove', ".vessel, #group1$vessel0", ".vessel, #group1 .box:first-child$vessel0"]
            ])
            vessel0.classList.add('vessel')
          ItMatchesAgain = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
              ['eq', ['get$','x','$box1', '.vessel, #group1 .box:first-child$vessel0'], ['number',100]]
            ])
        ]
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

    describe '1 level w/ ::scope', ->
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel .box']
            rules: [
              {
                type:'constraint', 
                cssText:'::[width] == ::scope[width]', 
                commands: [
                  ["lte", ["get$","width",["$reserved","::this"]], ["get$","width",["$reserved","::scope"]]]
                ]
              }
            ]
          }
        ]
        container.id = 'container0'
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div id="vessel1" class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        

          expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
              ['lte', ['get$','width','$box1', '.vessel .box'], ['get$','width','$container0','::scope']]
              ['lte', ['get$','width','$box2', '.vessel .box'], ['get$','width','$container0','::scope']]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()


      it 'should resolve selector on ::scope', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.group .vessel']
            rules: [
              {
                type:'constraint', 
                cssText:'(::parent .box:last-child)[width] == 100', 
                commands: [
                  ["lte", ["get$","width",["$reserved","scope", ".box:last-child"]], ["number",100]]
                ]
              }
            ]
          }
        ]
        container.id = 'container1'
        container.innerHTML =  """
          <div id="group1" class="group">
            <div id="box0" class="box"></div>
            <div id="vessel1" class="vessel">
              <div id="box1" class="box"></div>
              <div id="box2" class="box"></div>
            </div>
            <div id="box3" class="box"></div>
            <div id="box4" class="box"></div>
          </div>
          """
        clone = container.cloneNode()
        clone.innerHTML = container.innerHTML.replace /\d+/g, (d) ->
          return "1" + d

        Scenario done, container, [
                              
          TwoElementsMatchSelector = (e) ->        
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box2', '.group .vessel::scope .box:last-child$vessel1'], ["number",100]],
                ['lte', ['get$','width','$box4', '.group .vessel::scope .box:last-child$vessel1'], ["number",100]]
              ]
            newLast = document.createElement('div')
            newLast.id = 'box5'
            newLast.className = 'box'
            container.firstElementChild.appendChild(newLast)

          NewElementReplacesAnother = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ["remove",".group .vessel::scope .box:last-child$vessel1$box4"],
                ['lte', ['get$','width','$box5', '.group .vessel::scope .box:last-child$vessel1'], ["number",100]]
              ]
            container.firstElementChild.classList.remove('group')

          ParentDoesntMatchAnymore = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '.group .vessel$vessel1', '.group .vessel::scope .box:last-child$vessel1']
              ]
            container.firstElementChild.classList.add('group')

          ParentMatchesAgain = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box2', '.group .vessel::scope .box:last-child$vessel1'], ["number",100]],
                ['lte', ['get$','width','$box5', '.group .vessel::scope .box:last-child$vessel1'], ["number",100]]
              ]
            container.appendChild(clone)


          ParentIsCloned = (e) -> # Two selectors each match 4 same nodes
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box2', '.group .vessel::scope .box:last-child$vessel11'], ["number",100]]
                ['lte', ['get$','width','$box5', '.group .vessel::scope .box:last-child$vessel11'], ["number",100]]
                ['lte', ['get$','width','$box12', '.group .vessel::scope .box:last-child$vessel11'], ["number",100]]
                ['lte', ['get$','width','$box14', '.group .vessel::scope .box:last-child$vessel11'], ["number",100]]
                ['lte', ['get$','width','$box12', '.group .vessel::scope .box:last-child$vessel1'], ["number",100]],
                ['lte', ['get$','width','$box14', '.group .vessel::scope .box:last-child$vessel1'], ["number",100]]
              ]
            container.replaceChild(container.firstElementChild, container.lastElementChild)

          CloneIsReplaced = (e) -> # Also explicitly removes ids of removed boxes to remove constraint introduced by vessel1
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$vessel11',"$box12","$box14","$box12","$box14", '.group .vessel$vessel11', '.group .vessel::scope .box:last-child$vessel11']
              ]
            box2 = container.getElementsByClassName('box')[2]
            box2.parentNode.removeChild(box2)

          ChildIsRemovedAnotherMatches = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$box2'],
                ['lte', ['get$', 'width', '$box1', '.group .vessel::scope .box:last-child$vessel1'],["number",100]],
              ]
            vessel = container.getElementsByClassName('vessel')[0]
            vessel.parentNode.removeChild(vessel)

          IntermediateElementIsRemoved = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$vessel1', '$box1', '.group .vessel$vessel1', '.group .vessel::scope .box:last-child$vessel1'],
              ]
            container.innerHTML = ""

        ]
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
      
    describe '1 level w/ ::parent', ->
      it 'should resolve selector on ::parent', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.group .vessel']
            rules: [
              {
                type:'constraint', 
                cssText:'(::parent .box:last-child)[width] == 100', 
                commands: [
                  ["lte", ["get$","width",["$reserved","parent", ".box:last-child"]], ["number",100]]
                ]
              }
            ]
          }
        ]
        container.innerHTML =  """
          <div id="group1" class="group">
            <div id="box0" class="box"></div>
            <div id="vessel1" class="vessel">
              <div id="box1" class="box"></div>
              <div id="box2" class="box"></div>
            </div>
            <div id="box3" class="box"></div>
            <div id="box4" class="box"></div>
          </div>
          """
        clone = container.cloneNode()
        clone.innerHTML = container.innerHTML.replace /\d+/g, (d) ->
          return "1" + d

        Scenario done, container, [
                              
          TwoElementsMatchSelector = (e) ->        
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box2', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]],
                ['lte', ['get$','width','$box4', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]]
              ]
            newLast = document.createElement('div')
            newLast.id = 'box5'
            newLast.className = 'box'
            container.firstElementChild.appendChild(newLast)

          NewElementReplacesAnother = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ["remove",".group .vessel::parent .box:last-child$vessel1$box4"],
                ['lte', ['get$','width','$box5', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]]
              ]
            container.firstElementChild.classList.remove('group')

          ParentDoesntMatchAnymore = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '.group .vessel$vessel1', '.group .vessel::parent .box:last-child$vessel1']
              ]
            container.firstElementChild.classList.add('group')

          ParentMatchesAgain = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box2', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]],
                ['lte', ['get$','width','$box5', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]]
              ]
            container.appendChild(clone)

          ParentIsCloned = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box12', '.group .vessel::parent .box:last-child$vessel11'], ["number",100]],
                ['lte', ['get$','width','$box14', '.group .vessel::parent .box:last-child$vessel11'], ["number",100]]
              ]
            container.replaceChild(container.firstElementChild, container.lastElementChild)

          CloneIsReplaced = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$vessel11', '.group .vessel$vessel11', '.group .vessel::parent .box:last-child$vessel11']
              ]
            box2 = container.getElementsByClassName('box')[2]
            box2.parentNode.removeChild(box2)

          ChildIsRemovedAnotherMatches = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$box2'],
                ['lte', ['get$', 'width', '$box1', '.group .vessel::parent .box:last-child$vessel1'],["number",100]],
              ]
            vessel = container.getElementsByClassName('vessel')[0]
            vessel.parentNode.removeChild(vessel)

          IntermediateElementIsRemoved = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$vessel1', '$box1', '.group .vessel$vessel1', '.group .vessel::parent .box:last-child$vessel1'],
              ]
            container.innerHTML = ""

        ]
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel .box']
            rules: [
              {
                type:'constraint', 
                cssText:'::[width] == ::parent[width]', 
                commands: [
                  ["lte", ["get$","width",["$reserved","::this"]], ["get$","width",["$reserved","::parent"]]]
                ]
              }
            ]
          }
        ]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div id="vessel1" class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        

          expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
              ['lte', ['get$','width','$box1', '.vessel .box'], ['get$','width','$vessel1','.vessel .box::parent']]
              ['lte', ['get$','width','$box2', '.vessel .box'], ['get$','width','$vessel1','.vessel .box::parent']]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
    
      it 'should resolve selector on ::parent', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.group .vessel']
            rules: [
              {
                type:'constraint', 
                cssText:'(::parent .box:last-child)[width] == 100', 
                commands: [
                  ["lte", ["get$","width",["$reserved","parent", ".box:last-child"]], ["number",100]]
                ]
              }
            ]
          }
        ]
        container.innerHTML =  """
          <div id="group1" class="group">
            <div id="box0" class="box"></div>
            <div id="vessel1" class="vessel">
              <div id="box1" class="box"></div>
              <div id="box2" class="box"></div>
            </div>
            <div id="box3" class="box"></div>
            <div id="box4" class="box"></div>
          </div>
          """
        clone = container.cloneNode()
        clone.innerHTML = container.innerHTML.replace /\d+/g, (d) ->
          return "1" + d

        Scenario done, container, [
                              
          TwoElementsMatchSelector = (e) ->        
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box2', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]],
                ['lte', ['get$','width','$box4', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]]
              ]
            newLast = document.createElement('div')
            newLast.id = 'box5'
            newLast.className = 'box'
            container.firstElementChild.appendChild(newLast)

          NewElementReplacesAnother = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ["remove",".group .vessel::parent .box:last-child$vessel1$box4"],
                ['lte', ['get$','width','$box5', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]]
              ]
            container.firstElementChild.classList.remove('group')

          ParentDoesntMatchAnymore = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '.group .vessel$vessel1', '.group .vessel::parent .box:last-child$vessel1']
              ]
            container.firstElementChild.classList.add('group')

          ParentMatchesAgain = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box2', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]],
                ['lte', ['get$','width','$box5', '.group .vessel::parent .box:last-child$vessel1'], ["number",100]]
              ]
            container.appendChild(clone)

          ParentIsCloned = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['lte', ['get$','width','$box12', '.group .vessel::parent .box:last-child$vessel11'], ["number",100]],
                ['lte', ['get$','width','$box14', '.group .vessel::parent .box:last-child$vessel11'], ["number",100]]
              ]
            container.replaceChild(container.firstElementChild, container.lastElementChild)

          CloneIsReplaced = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$vessel11', '.group .vessel$vessel11', '.group .vessel::parent .box:last-child$vessel11']
              ]
            box2 = container.getElementsByClassName('box')[2]
            box2.parentNode.removeChild(box2)

          ChildIsRemovedAnotherMatches = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$box2'],
                ['lte', ['get$', 'width', '$box1', '.group .vessel::parent .box:last-child$vessel1'],["number",100]],
              ]
            vessel = container.getElementsByClassName('vessel')[0]
            vessel.parentNode.removeChild(vessel)

          IntermediateElementIsRemoved = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
                ['remove', '$vessel1', '$box1', '.group .vessel$vessel1', '.group .vessel::parent .box:last-child$vessel1'],
              ]
            container.innerHTML = ""

        ]
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

    describe '2 level', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel']
            rules: [
              {
                type:'ruleset'
                selectors: ['.box']
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[x] == 100', 
                    commands: [
                      ["eq", ["get$","x",["$reserved","::this"]], ["number",100]]
                    ]
                  }
                ]
              }
            ]
          }
          
        ]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
        
        box1 = container.getElementsByClassName('box')[1] 
        vessel0 = container.getElementsByClassName('vessel')[0] 
        Scenario done, container, [
          TwoElementsMatch = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box1', '.vessel .box'], ['number',100]]
              ['eq', ['get$','x','$box2', '.vessel .box'], ['number',100]]
            ]
            box1.classList.remove('box')
          ChildDoesntMatchAnymore = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['remove', '.vessel .box$box1']
            ]
            box1.classList.add('box')
          ChildMatchesAgain = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box1', '.vessel .box'], ['number',100]]
            ]
            vessel0.classList.remove('vessel')
          ParentDoesntMatchAnymore = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['remove', '.vessel .box$box1', '.vessel .box$box2']
            ]
            vessel0.classList.add('vessel')
          ParentMatchesAgain = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box1', '.vessel .box'], ['number',100]]
              ['eq', ['get$','x','$box2', '.vessel .box'], ['number',100]]
            ]
            window.zzz = true;
            box1.parentNode.removeChild(box1)
          ChildIsRemoved = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['remove', '$box1']
            ]
            vessel0.insertBefore(box1, vessel0.firstChild)
          ChildIsAdded = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box1', '.vessel .box'], ['number',100]]
            ]

        ]
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

    describe '2 level /w multiple selectors in parent', (e) ->
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel', '#group1']
            rules: [
              {
                type:'ruleset'
                selectors: ['.box:last-child']
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[x] == 100', 
                    commands: [
                      ["eq", ["get$","x",["$reserved","::this"]], ["number",100]]
                    ]
                  }
                ]
              }
            ]
          }
          
        ]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div class="group" id="group1">
            <div id="box3" class="box"></div>
            <div id="box4" class="box"></div>
          </div>
          """
        
        box2 = container.getElementsByClassName('box')[2] 
        vessel0 = container.getElementsByClassName('vessel')[0] 
        Scenario done, container, [
          TwoElementsMatch = (e) ->
            expect(stringify(engine.lastWorkerCommands)).to.eql stringify([
                          ['eq', ['get$','x','$box2', '.vessel .box:last-child, #group1 .box:last-child'], ['number',100]]
                          ['eq', ['get$','x','$box4', '.vessel .box:last-child, #group1 .box:last-child'], ['number',100]]
                        ])
            box2.classList.remove('box')
          
          ChildDoesntMatchAnymore = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['remove', '.vessel .box:last-child, #group1 .box:last-child$box2']
            ]
            box2.classList.add('box')
          ChildMatchesAgain = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box2', '.vessel .box:last-child, #group1 .box:last-child'], ['number',100]]
            ]
            vessel0.classList.remove('vessel')
          ParentDoesntMatchAnymore = (e) ->
            expect(stringify engine.lastWorkerCommands).to.eql stringify [
              ['remove', '.vessel .box:last-child, #group1 .box:last-child$box2']
            ]
            vessel0.classList.add('vessel')
          ParentMatchesAgain = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box2', '.vessel .box:last-child, #group1 .box:last-child'], ['number',100]]
            ]
            vessel0.removeChild(box2)
          ChildIsRemovedSoAnotherChildMatchesTheSelectorNow = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['remove', '$box2']
              ['eq', ['get$','x','$box1', '.vessel .box:last-child, #group1 .box:last-child'], ['number',100]]
            ]
            vessel0.appendChild(box2)
          ChildIsAddedBack = (e) ->
            expect(engine.lastWorkerCommands).to.eql [
              ['remove', ".vessel .box:last-child, #group1 .box:last-child$box1"]
              ['eq', ['get$','x','$box2', '.vessel .box:last-child, #group1 .box:last-child'], ['number',100]]
            ]
        ]
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
  
  describe '@if @else', ->
    
    container = null
    engine = null
  
    beforeEach ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
  
    afterEach ->
      remove(container)
  
    describe 'basic', ->
    
      it 'step 1', (done) ->
        rules = [
          {
             type: "constraint",
             cssText: "[big] == 500;"
             commands: [
               ['eq',['get','[big]'],['number',500]]
             ]
          }
          {
             type: "constraint",
             cssText: "[med] == 50;"
             commands: [
               ['eq',['get','[med]'],50]
             ]
          }
          {
             type: "constraint",
             cssText: "[small] == 5;"
             commands: [
               ['eq',['get','[small]'],5]
             ]
          }
          {
             type: "constraint",
             cssText: "[target-width] == 900;"
             commands: [
               ['eq',['get','[target-width]'],900]
             ]
          }
          {
            type:'ruleset'
            selectors: ['.vessel .box']
            rules: [
              {
                name: 'if'
                type:'directive'                
                terms: '[target-width] >= 960'
                clause: ["?>=", ["get", "[target-width]"],960]
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[width] == [big]', 
                    commands: [
                      ["eq", ["get$","width",["$reserved","::this"]], ["get","[big]"]]
                    ]
                  }
                ]
              }
              {
                name: 'elseif'
                type:'directive'                
                terms: '[target-width] >= 500'
                clause: ["?>=",["get","[target-width]"],500]
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[width] == [med]', 
                    commands: [
                      ["eq", ["get$","width",["$reserved","::this"]],["get","[med]"]]
                    ]
                  }
                ]
              }
              {
                name: 'else'
                type:'directive'                
                terms: ''
                clause: null
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[width] == [small]', 
                    commands: [
                      ["eq", ["get$","width",["$reserved","::this"]], ["get","[small]"]]
                    ]
                  }
                ]
              }
            ]
          }          
        ]
        container.innerHTML =  """
          <div id="container" >
            <div class="vessel">
              <div id="box1" class="box"></div>
              <div id="box2" class="box"></div>
            </div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        
          expect(stringify(engine.vars)).to.eql stringify
            "[big]":500
            "[med]":50
            "[small]":5
            "[target-width]":900
            "$box1[width]":50
            "$box2[width]":50            
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

