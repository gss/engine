Engine = GSS #require 'gss-engine/lib/Engine.js'

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
      container.id = 'container0'
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
          ['==', ["get","target-size"], 100]
        ]
        container.innerHTML =  ""
        if old = container._gss_id && GSS(container)
          old.destroy()
        engine = new GSS(container)

        engine.once 'solved', ->        
          expect(stringify engine.expressions.lastOutput).to.eql stringify [
              ['==', ["get", "", "target-size", ""], 100]
            ]
          done()
        
        engine.run(rules)
    describe 'mixed selectors', ->
      it 'should support mixed selectors', (done) ->
        rules = [
          ['==', 
            ["get",
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
              "target-size"]
            100
          ]
        ]
        container.innerHTML =  """
          <section id="s">
            <div id="d">
              <header id="h">
                <h2 class='gizoogle' id="h2">
                </h2>
              </header>
            </div>
          </section>
        """
        console.log(container.innerHTML)
        console.info("(header > h2.gizoogle ! section div:get('parentNode'))[target-size] == 100")
          
        
        engine = new GSS(container)

        engine.once 'solved', ->      
          expect(stringify engine.expressions.lastOutput).to.eql stringify [
              ['==', 
                ["get", "$s","target-size", "header>h2.gizoogle$h2!$ssection div$d:getparentNode"]
                , 100
              ]
            ]
          done()

        engine.run(rules)

    describe 'reversed sibling combinators', ->
      it 'should support mixed selectors', (done) ->
        rules = [
          ['==', 
            ["get",
              ['$tag',
                ['$combinator', 
                  ['$tag', 
                    ['$combinator', 
                      ['$tag', 
                        'div']
                      '+']
                    'main']
                  '!~'] 
                '*']
              "width"]
            50
          ]
        ]
        container.innerHTML =  """
          <section>
            <h1 id="header0"></h1>
            <div id="box0"></div>
            <main id="main0"></main>
          </section>
        """
        console.log(container.innerHTML)
        console.info("(div + main !~ *)[width] == 50")
        all = container.getElementsByTagName('*')
        parent = all.main0.parentNode

        
        engine = new GSS(container)
        engine.once 'solved', -> 
          expect(stringify engine.expressions.lastOutput).to.eql stringify [
            ['==', ["get", "$header0", "width", "div+main$main0!~$header0*"], 50]
            ['==', ["get", "$box0", "width", "div+main$main0!~$box0*"], 50]
          ]
          expect(stringify engine.styles.lastInput).to.eql stringify
            "$header0[width]": 50
            "$box0[width]": 50 
          expect(all.header0.style.width).to.eql '50px'
          expect(all.box0.style.width).to.eql '50px'
          expect(engine.solver.solutions.variables["div+main$main0!~$box0*"][0]).to.be.an.instanceOf(c.Constraint)
          expect(engine.solver.solutions.variables["div+main$main0!~$header0*"][0]).to.be.an.instanceOf(c.Constraint)

          console.error('Mutation: container.removeChild(#main)')
          parent.removeChild(all.main0) 
          engine.once 'solved', ->
            expect(stringify engine.expressions.lastOutput).to.eql stringify [[
              "remove"
              "div+main$main0!~$header0*",
              "div+main$main0!~$header0",
              "div+main$main0!~$box0*", 
              "div+main$main0!~$box0",
              "div+main$main0"
            ]]
            expect(all.header0.style.width).to.eql ''
            expect(all.box0.style.width).to.eql ''

            done()
        engine.run(rules)

    describe '1 level w/ ::', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          ['rule', 
            ['$class',
              ['$combinator'
                ['$class', 'vessel']
                ' ']
              'box']
            ['==', 
              ["get", ["$reserved","this"], "x"]
              100]
          ]
        ]
        console.info(".vessel .box { ::[x] == 100 }")
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                       
        engine = new GSS(container)

        engine.once 'solved', -> 
          expect(stringify engine.expressions.lastOutput).to.eql stringify [
              ['==', ['get', '$box1', 'x', '.vessel .box$box1'], 100]
              ['==', ['get', '$box2', 'x', '.vessel .box$box2'], 100]
            ]
          done()
        
        engine.run rules

    describe 'subqueries', ->
      it 'should observe selector on ::', (done) ->
        rules = ["rule",
                  ["$class", "vessel"]
                  ['==', 
                    ["get",
                      ["$class", 
                        ['$combinator', 
                          ["$reserved", "this"]
                          ' '] 
                        "box"], 
                      "x"], 
                    100]
                ]
        console.info(".vessel { (:: .box)[x] == 100 }")

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
        box2 = container.getElementsByClassName('box')[2]
        vessel0 = container.getElementsByClassName('vessel')[0] 
        engine = new GSS(container)

        engine.once 'solved', ->
          expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
            ['==', ['get', '$box1','x', '.vessel$vessel0– .box$box1'], 100]
            ['==', ['get', '$box2','x', '.vessel$vessel0– .box$box2'], 100]
          ])
          # Accumulated solutions
          expect(stringify(engine.values.toObject())).to.eql stringify
            "$box1[x]": 100
            "$box2[x]": 100
          # Snapshots of nodelists: Two elements match nested selector
          expect(engine.queries['.vessel']).to.eql [vessel0]
          expect(engine.queries['.vessel$vessel0– .box']).to.eql [box1, box2]
          # Two elements observe a query. Query is stored with scope & continuation key by element id
          expect(engine.queries._watchers["$container0"][1]).to.eql(undefined)
          expect(engine.queries._watchers["$container0"][2]).to.eql(container)
          expect(engine.queries._watchers["$vessel0"][1]).to.eql('.vessel$vessel0–')
          expect(engine.queries._watchers["$vessel0"][2]).to.eql(vessel0)
          expect(engine.queries._watchers["$vessel0"][3]).to.eql(undefined)
          # Two constraints are set
          expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"][0]).to.be.an.instanceOf(c.Constraint)
          expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"].length).to.eql(1)
          expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"][0]).to.be.an.instanceOf(c.Constraint)
          expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"].length).to.eql(1)
          # Each property knows how many constraints reference it (so it can become null)
          expect(engine.solver.solutions.variables["$box1[x]"].counter).to.eql(1)
          expect(engine.solver.solutions.variables["$box2[x]"].counter).to.eql(1)

          expect(box1.style.left).to.eql('100px')
          expect(box2.style.left).to.eql('100px')
          
          debugger
          box1.classList.remove('box')

          engine.once 'solved', ->
            # One child doesnt match the subselector anymore
            expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
              ['remove', '.vessel$vessel0– .box$box1']
            ])
            expect(stringify(engine.values.toObject())).to.eql stringify
              "$box2[x]": 100
            expect(engine.queries['.vessel']).to.eql [vessel0]
            expect(engine.queries['.vessel$vessel0– .box']).to.eql [box2]
            expect(engine.queries._watchers["$container0"][1]).to.eql(undefined)
            expect(engine.queries._watchers["$container0"][2]).to.eql(container)
            expect(engine.queries._watchers["$vessel0"][1]).to.eql('.vessel$vessel0–')
            expect(engine.queries._watchers["$vessel0"][2]).to.eql(vessel0)
            expect(engine.queries._watchers["$vessel0"][3]).to.eql(undefined)
            expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"][0]).to.be.an.instanceOf(c.Constraint)
            expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"].length).to.eql(1)
            expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"]).to.eql(undefined)
            expect(engine.solver.solutions.variables["$box1[x]"]).to.eql(undefined)
            expect(engine.solver.solutions.variables["$box2[x]"].counter).to.eql(1)
            expect(box1.style.left).to.eql('')
            expect(box2.style.left).to.eql('100px')
            box1.classList.add('box')

            engine.once 'solved', ->
              # Child matches again
              expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                ['==', ['get', '$box1', 'x', '.vessel$vessel0– .box$box1'], 100]
              ])
              expect(stringify(engine.values.toObject())).to.eql stringify
                "$box2[x]": 100
                "$box1[x]": 100
              expect(engine.queries['.vessel']).to.eql [vessel0]
              expect(engine.queries['.vessel$vessel0– .box']).to.eql [box1, box2]
              expect(engine.queries._watchers["$container0"][1]).to.eql(undefined)
              expect(engine.queries._watchers["$container0"][2]).to.eql(container)
              expect(engine.queries._watchers["$vessel0"][1]).to.eql('.vessel$vessel0–')
              expect(engine.queries._watchers["$vessel0"][2]).to.eql(vessel0)
              expect(engine.queries._watchers["$vessel0"][3]).to.eql(undefined)
              expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"][0]).to.be.an.instanceOf(c.Constraint)
              expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"].length).to.eql(1)
              expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"][0]).to.be.an.instanceOf(c.Constraint)
              expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"].length).to.eql(1)
              expect(engine.solver.solutions.variables["$box1[x]"].counter).to.eql(1)
              expect(engine.solver.solutions.variables["$box2[x]"].counter).to.eql(1)
              expect(box1.style.left).to.eql('100px')
              expect(box2.style.left).to.eql('100px')
              vessel0.classList.remove('vessel')

              engine.once 'solved', ->
                # Parent doesnt match anymore: Remove the whole tree
                expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                  ['remove', 
                    ".vessel$vessel0– .box$box1", 
                    ".vessel$vessel0– .box$box2", 
                    ".vessel$vessel0"]
                ])
                expect(engine.queries._watchers["$container0"][1]).to.eql(undefined)
                expect(engine.queries._watchers["$container0"][2]).to.eql(container)
                expect(engine.queries._watchers["$vessel0"]).to.eql(undefined)
                expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"]).to.eql(undefined)
                expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"]).to.eql(undefined)
                expect(engine.solver.solutions.variables["$box1[x]"]).to.eql(undefined)
                expect(engine.solver.solutions.variables["$box2[x]"]).to.eql(undefined)
                expect(box1.style.left).to.eql('')
                expect(box2.style.left).to.eql('')
                vessel0.classList.add('vessel')

                engine.once 'solved', ->
                  # Parent matches again, re-watch everything 
                  expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                    ['==', ['get', '$box1', 'x', '.vessel$vessel0– .box$box1'], 100]
                    ['==', ['get', '$box2', 'x', '.vessel$vessel0– .box$box2'], 100]
                  ])
                  expect(stringify(engine.values.toObject())).to.eql stringify
                    "$box1[x]": 100
                    "$box2[x]": 100
                  expect(engine.queries['.vessel']).to.eql [vessel0]
                  expect(engine.queries['.vessel$vessel0– .box']).to.eql [box1, box2]
                  expect(engine.queries._watchers["$container0"][1]).to.eql(undefined)
                  expect(engine.queries._watchers["$container0"][2]).to.eql(container)
                  expect(engine.queries._watchers["$vessel0"][1]).to.eql('.vessel$vessel0–')
                  expect(engine.queries._watchers["$vessel0"][2]).to.eql(vessel0)
                  expect(engine.queries._watchers["$vessel0"][3]).to.eql(undefined)
                  expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"][0]).to.be.an.instanceOf(c.Constraint)
                  expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box1"].length).to.eql(1)
                  expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"][0]).to.be.an.instanceOf(c.Constraint)
                  expect(engine.solver.solutions.variables[".vessel$vessel0– .box$box2"].length).to.eql(1)
                  expect(engine.solver.solutions.variables["$box1[x]"].counter).to.eql(1)
                  expect(engine.solver.solutions.variables["$box2[x]"].counter).to.eql(1)
                  expect(box1.style.left).to.eql('100px')
                  expect(box2.style.left).to.eql('100px')
                  done()
        engine.run(rules)

    describe '1 level w/ multiple selectors and ::this', ->
      it 'should combine comma separated native selectors', (done) ->
        rules = [
          'rule', 
          [','
            ['$class', 'vessel']
            ['$id', 'group1']]

          ['==',
            ['get'
              ['$pseudo',
                ['$combinator',
                  ['$reserved', 'this']
                  ' ']
                'first-child']
              'y']
            100
          ]
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
        console.info(".vessel, #group1 { (:: :first-child)[y] == 100 }")

        vessel0 = container.getElementsByClassName('vessel')[0]
        box1 = container.getElementsByClassName('box')[1]
        box3 = container.getElementsByClassName('box')[3]
        
        engine = new GSS(container)

        engine.once 'solved', ->
          expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
            ['==', ['get', '$box1', 'y','.vessel,#group1$vessel0– :first-child$box1'], 100]
            ['==', ['get', '$box3', 'y','.vessel,#group1$group1– :first-child$box3'], 100]
          ])

          vessel0.classList.remove('vessel')
          expect(box1.style.top).to.eql('100px')
          expect(box3.style.top).to.eql('100px')
          engine.once 'solved', ->
            expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
              ['remove', ".vessel,#group1$vessel0– :first-child$box1", ".vessel,#group1$vessel0"]
            ])
            expect(box1.style.top).to.eql('')
            expect(box3.style.top).to.eql('100px')

            vessel0.classList.add('vessel')

            engine.once 'solved', ->
              expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                ['==', ['get', '$box1', 'y','.vessel,#group1$vessel0– :first-child$box1'], 100]
              ])
              expect(box1.style.top).to.eql('100px')
              expect(box3.style.top).to.eql('100px')
              done()
        engine.run(rules)

    describe '1 level w/ mixed multiple selectors and ::this', ->
      it 'should implement comma for non-native selectors', (done) ->
        rules = [
          'rule', 
          [',', 
            ['$combinator', 
              ['$id', 'box1']
              '!>']
            ['$tag', 
              ['$combinator',
                '>']
              'div']]


          ['==',
            ['get'
              ['$pseudo',
                ['$combinator',
                  ['$reserved', 'this']
                  ' ']
                'first-child']
              'y']
            100
          ]
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
        console.info("#box1 !>, > div { (& :first-child)[y] == 100 }")

        vessel0 = container.getElementsByClassName('vessel')[0]
        box0    = container.getElementsByClassName('box')[0]
        box1    = container.getElementsByClassName('box')[1]
        box2    = container.getElementsByClassName('box')[2]
        box3    = container.getElementsByClassName('box')[3]
        box4    = container.getElementsByClassName('box')[4]
        group1  = container.getElementsByClassName('group')[0]
        
        engine = new GSS(container)

        engine.once 'solved', ->
          expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
            ['==', ['get', '$box1', 'y','#box1!>,>div$vessel0– :first-child$box1'], 100]
            ['==', ['get', '$box3', 'y','#box1!>,>div$group1– :first-child$box3'], 100]
          ])

          expect(box1.style.top).to.eql('100px')
          expect(box3.style.top).to.eql('100px')
          expect(engine.queries['#box1!>,>div'].length).to.eql(3)
          expect(engine.queries['#box1!>,>div'].duplicates.length).to.eql(1)
          console.error('box1.remove()')
          box1.parentNode.removeChild(box1)
          engine.once 'solved', ->
            expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
              ['remove', "#box1!>",
                "#box1!>,>div$vessel0– :first-child$box1"]
              ['==', ['get', '$box2', 'y','#box1!>,>div$vessel0– :first-child$box2'], 100]
              ['remove', "#box1"]
            ])
            expect(box1.style.top).to.eql('')
            expect(box2.style.top).to.eql('100px')
            expect(box3.style.top).to.eql('100px')
            expect(engine.queries['#box1!>,>div'].length).to.eql(3)
            expect(engine.queries['#box1!>,>div'].duplicates.length).to.eql(0)
            expect(engine.queries['#box1']).to.eql(undefined)
            expect(engine.queries['#box1!>']).to.eql(undefined)

            vessel0.parentNode.removeChild(vessel0)
            console.error('vessel0.remove()')

            engine.once 'solved', ->
              expect(box1.style.top).to.eql('')
              expect(box2.style.top).to.eql('')
              expect(box3.style.top).to.eql('100px')
              expect(box4.style.top).to.eql('')
              expect(engine.queries['#box1!>,>div'].slice()).to.eql([box0, group1])
              expect(engine.queries['#box1!>,>div'].slice()).to.eql([box0, group1])
              expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                ['remove', 
                "#box1!>,>div$vessel0– :first-child$box2",
                "#box1!>,>div$vessel0",  
                ">$vessel0div"
                ">$vessel0"]
              ])
              box3.parentNode.removeChild(box3)

              engine.once 'solved', ->
                expect(box1.style.top).to.eql('')
                expect(box2.style.top).to.eql('')
                expect(box3.style.top).to.eql('')
                expect(box4.style.top).to.eql('100px')
                expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                  ['remove', "#box1!>,>div$group1– :first-child$box3"]

                  ['==', ['get', '$box4', 'y','#box1!>,>div$group1– :first-child$box4'], 100]
                ])
                box4.parentNode.removeChild(box4)

                engine.once 'solved', ->
                  expect(box1.style.top).to.eql('')
                  expect(box2.style.top).to.eql('')
                  expect(box3.style.top).to.eql('')
                  expect(box4.style.top).to.eql('')
                  expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                    ['remove', "#box1!>,>div$group1– :first-child$box4"]
                  ])
                  expect(engine.queries['>'].slice()).to.eql([box0, group1])
                  box0.parentNode.removeChild(box0)
                  engine.once 'solved', ->
                    expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                      ['remove',
                        "#box1!>,>div$box0"
                        ">$box0div", 
                        ">$box0"]
                    ])
                    expect(engine.queries['#box1']).to.eql(undefined)
                    expect(engine.queries['#box1!>']).to.eql(undefined)
                    expect(engine.queries['#box1!>,>div'].slice()).to.eql([group1])
                    expect(engine.queries['>'].slice()).to.eql([group1])
                    group1.parentNode.removeChild(group1)
                    engine.once 'solved', ->
                      console.log('State', engine.queries, 234)
                      expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                        ['remove',
                          "#box1!>,>div$group1"
                          ">$group1div", 
                          ">$group1"]
                      ])
                      done()
        engine.run(rules)

    describe '1 level w/ ::scope', ->
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          ['rule', 
            ['$class'
              ['$combinator'
                ['$class'
                  'vessel']
                ' ']
              'box'],
            ["<=", ["get", ["$reserved", "this"], "width"], ["get", ["$reserved","scope"], "width"]]
          ]
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
        engine = new GSS(container)
                              
        engine.once 'solved', ->  

          expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
              ['<=', ['get','$box1','width', '.vessel .box$box1–::scope'], ['get', '$container0', 'width', '.vessel .box$box1–::scope']]
              ['<=', ['get','$box2','width', '.vessel .box$box2–::scope'], ['get', '$container0', 'width', '.vessel .box$box2–::scope']]
            ]
          done()
        
        engine.run rules

    describe '1 level w/ ::scope and selector', ->

      it 'should resolve selector on ::scope', (done) ->
        rules = 
          ['rule', 
            ['$class'
              ['$combinator',
                ['$class', 
                  'group']
                ' ']
              'vessel']

            ["<=", 
              ["get",
                ['$pseudo'
                  ['$class',
                    ['$combinator', 
                      ["$reserved","scope"]
                      ' ']
                    'box']
                  'last-child']
                'width']

              100]]
        console.info('.group .vessel { (::scope .box:last-child)[width] == 100 }')
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
        clone.setAttribute('id', 'container1')
        clone.innerHTML = container.innerHTML.replace /\d+/g, (d) ->
          return "1" + d

        engine = new GSS(container)

        engine.once 'solved', ->        
          expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
              ['<=',['get','$box2','width', ".group .vessel$vessel1–::scope .box:last-child$box2"], 100],
              ['<=',['get','$box4','width', ".group .vessel$vessel1–::scope .box:last-child$box4"], 100]
            ]
          newLast = document.createElement('div')
          newLast.id = 'box5'
          newLast.className = 'box'
          container.firstElementChild.appendChild(newLast)

          engine.once 'solved', ->   
            expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                ["remove",".group .vessel$vessel1–::scope .box:last-child$box4"],
                ['<=',['get', '$box5', 'width', '.group .vessel$vessel1–::scope .box:last-child$box5'], 100]
              ]
            container.firstElementChild.classList.remove('group')

            engine.once 'solved', ->   
              expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                  ['remove', 
                    '.group .vessel$vessel1–::scope .box:last-child$box2',
                    '.group .vessel$vessel1–::scope .box:last-child$box5'
                    '.group .vessel$vessel1–::scope', 
                    '.group .vessel$vessel1']
                ]
              container.firstElementChild.classList.add('group')
              engine.once 'solved', ->   

                expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                    ['<=',['get','$box2','width', '.group .vessel$vessel1–::scope .box:last-child$box2'], 100],
                    ['<=',['get','$box5','width', '.group .vessel$vessel1–::scope .box:last-child$box5'], 100]
                  ]
                container.appendChild(clone)
                
                engine.once 'solved', ->   
                  expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                      ['<=',['get', '$box12', 'width', '.group .vessel$vessel1–::scope .box:last-child$box12'], 100]
                      ['<=',['get', '$box14', 'width', '.group .vessel$vessel1–::scope .box:last-child$box14'], 100]
                      ['<=',['get', '$box2',  'width', '.group .vessel$vessel11–::scope .box:last-child$box2'], 100]
                      ['<=',['get', '$box5',  'width', '.group .vessel$vessel11–::scope .box:last-child$box5'], 100]
                      ['<=',['get', '$box12', 'width', '.group .vessel$vessel11–::scope .box:last-child$box12'], 100]
                      ['<=',['get', '$box14', 'width', '.group .vessel$vessel11–::scope .box:last-child$box14'], 100]
                    ]
                    
                  container.replaceChild(container.firstElementChild, container.lastElementChild)
                  engine.once 'solved', ->
                    expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                      ['remove',
                        ".group .vessel$vessel11–::scope .box:last-child$box2",
                        ".group .vessel$vessel11–::scope .box:last-child$box5",
                        ".group .vessel$vessel11–::scope .box:last-child$box12",
                        ".group .vessel$vessel11–::scope .box:last-child$box14",
                        ".group .vessel$vessel11–::scope",
                        ".group .vessel$vessel1–::scope .box:last-child$box12",
                        ".group .vessel$vessel1–::scope .box:last-child$box14",
                        ".group .vessel$vessel11"]
                    ]
                    box2 = container.getElementsByClassName('box')[2]
                    box2.parentNode.removeChild(box2)
                    
                    engine.once 'solved', ->
                      expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                          ['remove', '.group .vessel$vessel1–::scope .box:last-child$box2'],
                          ['<=',['get', '$box1', 'width', '.group .vessel$vessel1–::scope .box:last-child$box1'], 100],
                        ]
                      vessel = container.getElementsByClassName('vessel')[0]
                      vessel.parentNode.removeChild(vessel)

                      engine.once 'solved', ->
                        expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                          ['remove', 
                            '.group .vessel$vessel1–::scope .box:last-child$box1'
                            ".group .vessel$vessel1–::scope .box:last-child$box5"
                            ".group .vessel$vessel1–::scope"
                            ".group .vessel$vessel1"]
                          ]
                        container.innerHTML = ""
                        done()

        engine.run(rules)
      
    describe '1 level w/ ::parent', ->
      it 'should resolve selector on ::parent', (done) ->
        rules = [
          ['rule', 
            ['$class'
              ['$combinator',
                ['$class',
                  'group']
                ' ']
              'vessel'],


            ["<=", 
              ["get",
                ['$pseudo'
                  ['$class',
                    ['$combinator', 
                      ["$reserved","parent"]
                      ' ']
                    'box']
                  'last-child']
                'width']
            100]]]

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
        clone.setAttribute('id', 'container1')
        clone.innerHTML = container.innerHTML.replace /\d+/g, (d) ->
          return "1" + d


        engine = new GSS(container)

        engine.once 'solved', ->       
          expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
              ['<=',['get', '$box2', 'width', ".group .vessel$vessel1–::parent .box:last-child$box2"], 100],
              ['<=',['get', '$box4', 'width', ".group .vessel$vessel1–::parent .box:last-child$box4"], 100]
            ]
          newLast = document.createElement('div')
          newLast.id = 'box5'
          newLast.className = 'box'
          container.firstElementChild.appendChild(newLast)

          engine.once 'solved', -> 
            expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                ["remove", ".group .vessel$vessel1–::parent .box:last-child$box4"],
                ['<=',['get', '$box5', 'width', '.group .vessel$vessel1–::parent .box:last-child$box5'], 100]
              ]
            container.firstElementChild.classList.remove('group')

            engine.once 'solved', -> 
              expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                  ['remove', 
                    ".group .vessel$vessel1–::parent .box:last-child$box2"
                    ".group .vessel$vessel1–::parent .box:last-child$box5",
                    ".group .vessel$vessel1–::parent",
                    ".group .vessel$vessel1"]
                ]
              container.firstElementChild.classList.add('group')

              engine.once 'solved', -> 
                expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                    ['<=',['get', '$box2', 'width', ".group .vessel$vessel1–::parent .box:last-child$box2"], 100],
                    ['<=',['get', '$box5', 'width', ".group .vessel$vessel1–::parent .box:last-child$box5"], 100]
                  ]
                container.appendChild(clone)

                engine.once 'solved', -> 
                  expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                    ['<=',['get', '$box12', 'width', ".group .vessel$vessel11–::parent .box:last-child$box12"], 100],
                    ['<=',['get', '$box14', 'width', ".group .vessel$vessel11–::parent .box:last-child$box14"], 100]
                    ]
                  container.replaceChild(container.firstElementChild, container.lastElementChild)

                  engine.once 'solved', -> 
                    expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                        ['remove', 
                        ".group .vessel$vessel11–::parent .box:last-child$box12",
                        ".group .vessel$vessel11–::parent .box:last-child$box14",
                        ".group .vessel$vessel11–::parent",
                        ".group .vessel$vessel11"]
                      ]
                    box2 = container.getElementsByClassName('box')[2]
                    box2.parentNode.removeChild(box2)

                    engine.once 'solved', -> 
                      expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                          ["remove", ".group .vessel$vessel1–::parent .box:last-child$box2"],
                          ['<=',['get', '$box1', 'width', '.group .vessel$vessel1–::parent .box:last-child$box1'], 100]
                        ]
                      vessel = container.getElementsByClassName('vessel')[0]
                      vessel.parentNode.removeChild(vessel)

                      engine.once 'solved', -> 
                        expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
                          ['remove', 
                            ".group .vessel$vessel1–::parent .box:last-child$box1"
                            ".group .vessel$vessel1–::parent .box:last-child$box5"
                            ".group .vessel$vessel1–::parent",
                            ".group .vessel$vessel1"]
                          ]
                        container.innerHTML = ""
                        done()

        engine.run(rules)
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          ['rule', 
            ['$class'
              ['$combinator',
                ['$class',
                  'vessel']
                ' ']
              'box'],

            ["<=", ["get", ["$reserved","this"], "width"], ["get", ["$reserved","parent"], "width"]]
          ]
        ]
        console.info('.vessel .box { ::[width] == ::parent[width] } ')
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div id="vessel1" class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
        
        engine = new GSS(container)
                              
        engine.once 'solved', ->
          expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
            ["<=",
              ["get","$box1","width",".vessel .box$box1–::parent"],
              ["get","$vessel1","width",".vessel .box$box1–::parent"]],
            ["<=",
              ["get","$box2","width",".vessel .box$box2–::parent"],
              ["get","$vessel1","width",".vessel .box$box2–::parent"]]]
          done()

        engine.run rules

    describe '2 level', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = 
          ['rule', 
            ['$class', 'vessel']

            ['rule', 
              ['$class', 'box']

              ['==', ["get",["$reserved","this"], "x"], 100]
            ]]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel" id="vessel0">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
        engine = new GSS(container)
        
        box1 = container.getElementsByClassName('box')[1] 
        vessel0 = container.getElementsByClassName('vessel')[0] 
        engine.once 'solved', ->
          expect(stringify engine.expressions.lastOutput).to.eql stringify [
            ['==', ['get','$box1','x', ".vessel$vessel0–.box$box1"], 100]
            ['==', ['get','$box2','x', ".vessel$vessel0–.box$box2"], 100]
          ]
          box1.classList.remove('box')

          engine.once 'solved', ->
            expect(stringify engine.expressions.lastOutput).to.eql stringify [
              ['remove', ".vessel$vessel0–.box$box1"]
            ]
            box1.classList.add('box')

            engine.once 'solved', ->
              expect(stringify engine.expressions.lastOutput).to.eql stringify [
                ['==', ['get','$box1','x', ".vessel$vessel0–.box$box1"], 100]
              ]
              vessel0.classList.remove('vessel')

              engine.once 'solved', ->
                expect(stringify engine.expressions.lastOutput).to.eql stringify [
                  ['remove', ".vessel$vessel0–.box$box1",".vessel$vessel0–.box$box2",".vessel$vessel0"]
                ]
                vessel0.classList.add('vessel')

                engine.once 'solved', ->
                  expect(stringify engine.expressions.lastOutput).to.eql stringify [
                    ['==',["get","$box1","x",".vessel$vessel0–.box$box1"],100],
                    ['==',["get","$box2","x",".vessel$vessel0–.box$box2"],100]
                  ]
                  box1.parentNode.removeChild(box1)

                  engine.once 'solved', ->
                    expect(stringify engine.expressions.lastOutput).to.eql stringify [
                      ['remove', ".vessel$vessel0–.box$box1"]
                    ]
                    vessel0.insertBefore(box1, vessel0.firstChild)

                    engine.once 'solved', ->
                      expect(stringify engine.expressions.lastOutput).to.eql stringify [
                        ['==',["get","$box1","x",".vessel$vessel0–.box$box1"],100]
                      ]
                      engine.scope.innerHTML = ""

                      engine.once 'solved', ->
                        expect(stringify engine.expressions.lastOutput).to.eql stringify [
                          ["remove",".vessel$vessel0–.box$box1",".vessel$vessel0–.box$box2",".vessel$vessel0"]
                        ]
                        engine.scope.innerHTML = ""
                        done()
        engine.run rules

    describe '2 level /w multiple selectors in parent', (e) ->
      it 'Runs commands from sourceNode', (done) ->
        rules = 
          ['rule', 
            [','
              ['$class', 'vessel']
              ['$id', 'group1']
            ]

            ['rule', 
              ['$pseudo',
                ['$class', 'box']
                'last-child']

              ['==', ["get",["$reserved","this"], "x"], 100]
            ]]
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
        
        box2 = container.getElementsByClassName('box')[2] 
        vessel0 = container.getElementsByClassName('vessel')[0] 
        engine = new GSS(container)

        engine.once 'solved', ->
          expect(stringify(engine.expressions.lastOutput)).to.eql stringify([
                      ['==',["get","$box2","x",".vessel,#group1$vessel0–.box:last-child$box2"],100],
                      ['==',["get","$box4","x",".vessel,#group1$group1–.box:last-child$box4"],100]])
          box2.classList.remove('box')
          
          engine.once 'solved', ->
            expect(stringify engine.expressions.lastOutput).to.eql stringify [
              ["remove",".vessel,#group1$vessel0–.box:last-child$box2"]
            ]
            box2.classList.add('box')

            engine.once 'solved', ->
              expect(stringify engine.expressions.lastOutput).to.eql stringify [
                ['==',["get","$box2","x",".vessel,#group1$vessel0–.box:last-child$box2"],100]
              ]
              vessel0.classList.remove('vessel')
                  
              engine.once 'solved', ->
                expect(stringify engine.expressions.lastOutput).to.eql  stringify [
                  ["remove",".vessel,#group1$vessel0–.box:last-child$box2",".vessel,#group1$vessel0"]
                ]
                vessel0.classList.add('vessel')
                    
                engine.once 'solved', ->
                  expect(stringify engine.expressions.lastOutput).to.eql stringify [
                    ['==',["get","$box2","x",".vessel,#group1$vessel0–.box:last-child$box2"],100]
                  ]
                  vessel0.removeChild(box2)
                      
                  engine.once 'solved', ->
                    expect(stringify engine.expressions.lastOutput).to.eql stringify [
                      ["remove",".vessel,#group1$vessel0–.box:last-child$box2"],
                      ['==',["get","$box1","x",".vessel,#group1$vessel0–.box:last-child$box1"],100]
                    ]
                    vessel0.appendChild(box2)
                        
                    engine.once 'solved', ->
                      expect(stringify engine.expressions.lastOutput).to.eql stringify [
                        ["remove",".vessel,#group1$vessel0–.box:last-child$box1"],
                        ['==',["get","$box2","x",".vessel,#group1$vessel0–.box:last-child$box2"],100]
                      ]
                      engine.scope.innerHTML = ""

                      engine.once 'solved', ->
                        expect(stringify engine.expressions.lastOutput).to.eql stringify [[
                          "remove"
                          ".vessel,#group1$vessel0–.box:last-child$box2",
                          ".vessel,#group1$group1–.box:last-child$box4",
                          ".vessel,#group1$vessel0",
                          ".vessel,#group1$group1"
                        ]]
                        done()
        engine.run rules

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

# .vessel .box$box1@if([target-width]>=960)
          ['==',['get','big'], 500]
          ['==',['get','med'], 50]
          ['==',['get','small'],5]
          ['==',['get','target-width'], 900]
          ['rule', 
            ['$class',
              ['$combinator'
                ['$class', 'vessel']
                ' ']
              'box']

            ['if',
              ['>=',                 ['get', 'target-width']
                960]
              ['==', ["get",["$reserved","this"],"width"], ["get","big"]]
              [
                ['if',
                  ['>=',                     ['get', 'target-width']
                    500]
                  ['==', ["get",["$reserved","this"], 'width'],["get","med"]]

                  ['==', ["get",["$reserved","this"], 'width'], ["get","small"]]
                ]
              ]
            ]
          ]         
        ]
        counter = 0
        listener = (e) ->
          counter++
          if counter is 1   
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":900 
          else if counter is 2   
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":900
              "$box1[width]":50
              "$box2[width]":50

            engine.values.set('target-width', 1000)
          else if counter is 3
            window.xxx = true
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":1000
              "$box1[width]":500
              "$box2[width]":500
            engine.values.set('target-width', 900)
          else if counter is 4
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":900
              "$box1[width]":50
              "$box2[width]":50
            engine.values.set('target-width', 300)
          else if counter is 5
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":300
              "$box1[width]":5
              "$box2[width]":5
            window.xxx = true
            engine.$id('box1').classList.remove('box')
          else if counter is 6
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":300
              "$box2[width]":5
            engine.$id('box2').classList.remove('box')
          else if counter is 7
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":300
            debugger
            engine.values.set('target-width', 1000)
            engine.$id('box2').classList.add('box')
          else if counter is 8 
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":1000
              "$box2[width]":500
            container.innerHTML = ''
          else if counter is 9 
            expect(stringify(engine.values.toObject())).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":1000
            expect(Object.keys(engine.values).length).to.eql(7) # 3 private + 4 property
            expect(Object.keys(engine.values._watchers).length).to.eql(0)
            expect(Object.keys(engine.values._observers).length).to.eql(0)
            expect((k = Object.keys(engine.queries._watchers)).length).to.eql(1)
            expect(Object.keys(engine.queries._watchers[k[0]]).length).to.eql(9)

            container.removeEventListener 'solved', listener
            done()
        container.addEventListener 'solved', listener
        
        engine = new GSS(container)
        engine.run rules
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

