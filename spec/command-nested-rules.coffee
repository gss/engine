stringify = (o) ->
  return o
  return JSON.stringify o, 1, 1
  
remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = document.getElementById 'fixtures'

describe 'Nested Rules', ->
  container = null
  engine = null

  beforeEach ->
    if old = container?._gss_id && GSS(container)
      old.destroy()
    container = document.createElement 'div'
    container.id = 'container0'
    fixtures.appendChild container
    window.$engine = engine = new GSS(container)

  afterEach ->
    remove(container)

 
  describe 'Basic', ->
    describe 'flat', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          ['==', ["get","target-size"], 100]
        ]

        engine.once 'solve', ->        
          expect(stringify engine.updated.getProblems()).to.eql stringify [[
            [key: '', ['==', ["get", "target-size"], 100]]
          ]]
          done()
        
        engine.solve(rules)

    describe 'sequential selectors', ->
      it 'should support mixed selectors', (done) ->
        rules = [
          ['==', 
            ["get",
              [
                ['tag', 'div']
                [' ']
                ['.', 'gizoogle']
                ['!>']
                ['!>']
                ['.', 'd']
              ],
              'width']
            100
          ]
        ]
        container.innerHTML =  """
          <section id="s">
            <div id="d" class="d">
              <header id="h">
                <h2 class='gizoogle' id="h2">
                </h2>
              </header>
            </div>
          </section>
        """
        GSS.console.log(container.innerHTML)
        GSS.console.info("(header > h2.gizoogle ! section div:get('parentNode'))[target-size] == 100")
          
        engine.once 'solve', ->      
          expect(engine.updated.getProblems()).to.eql [[[
            key: "div .gizoogle$h2↑!>!>.d"
            ['==', 
              ["get", "$d[width]"]
              , 100
            ]
          ]]]
          engine.id('d').setAttribute('class', '')
          engine.then (s) ->
            expect(stringify(engine.updated.getProblems())).to.eql stringify([
              [['remove', "div .gizoogle$h2↑!>!>.d"]]
              [['remove', "div .gizoogle$h2↑!>!>.d"]]
            ])
            engine.id('d').setAttribute('class', 'd')    
            
            engine.then (s) ->
              expect(engine.updated.getProblems()).to.eql [[[
                key: "div .gizoogle$h2↑!>!>.d"
                ['==', 
                  ["get", "$d[width]"]
                  , 100
                ]
              ]]]

              engine.id('h2').setAttribute('class', '')
              
              engine.then (s) ->
                expect(stringify(engine.updated.getProblems())).to.eql stringify([
                  [
                    ['remove', "div .gizoogle$h2↑!>!>.d"]
                    ['remove', "div .gizoogle$h2↑!>!>"]
                    ['remove', "div .gizoogle$h2↑!>"]
                    ['remove', "div .gizoogle$h2"]
                  ]
                  [['remove', "div .gizoogle$h2↑!>!>.d"]]
                ])
                engine.id('h2').setAttribute('class', 'gizoogle')
                
                engine.then (s) ->
                  expect(engine.updated.getProblems()).to.eql [[[
                    key: "div .gizoogle$h2↑!>!>.d"
                    ['==', 
                      ["get", "$d[width]"]
                      , 100
                    ]
                  ]]]
                  done()

        engine.solve(rules)

    describe 'mixed selectors', ->
      it 'should support mixed selectors', (done) ->
        rules = [
          ['==', 
            ["get",
              [':get',
                ['tag',
                  [' ', 
                    ['tag', 
                      ['!', 
                        ['.',
                          ['tag', 
                            ['>', 
                              ['tag', 
                                'header']
                              ]
                            'h2']
                          'gizoogle']
                        ]
                      'section']
                    ] 
                  'div']
                'parentNode']
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
        GSS.console.log(container.innerHTML)
        GSS.console.info("(header > h2.gizoogle ! section div:get('parentNode'))[target-size] == 100")
          
        engine.once 'solve', ->      
          expect(engine.updated.getProblems()).to.eql [[[
                      key: "header>h2.gizoogle$h2↑!$s↑section div$d↑:getparentNode"
                      ['==', 
                        ["get", "$s[target-size]"]
                        , 100
                      ]
                    ]]]
          done()

        engine.solve(rules)

    describe 'reversed sibling combinators', ->
      it 'should support mixed selectors', (done) ->
        rules = [
          ['==', 
            ["get",
              ['tag',
                ['!~', 
                  ['tag', 
                    ['+', 
                      ['tag', 
                        'div']]
                    'main']
                  ] 
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
        GSS.console.log(container.innerHTML)
        GSS.console.info("(div + main !~ *)[width] == 50")
        all = container.getElementsByTagName('*')
        parent = all.main0.parentNode

        engine.once 'solve', -> 
          expect(engine.updated.getProblems()).to.eql [[
            [
              key: "div+main$main0↑!~$header0↑*", 
              ['==', ["get", "$header0[width]"], 50]
            ]
          ], [
            [
              key: "div+main$main0↑!~$box0↑*"
              ['==', ["get", "$box0[width]", ], 50]
            ]
          ]]
          expect(stringify engine.updated.solution).to.eql stringify
            "$header0[width]": 50
            "$box0[width]": 50 
          expect(all.header0.style.width).to.eql '50px'
          expect(all.box0.style.width).to.eql '50px'
          
          GSS.console.error('Mutation: container.removeChild(#main)')
          parent.removeChild(all.main0) 
          engine.once 'solve', ->
            expect(stringify engine.updated.getProblems()).to.eql stringify [
                        [
                          ["remove", "div+main$main0↑!~$header0↑*"],
                          ["remove", "div+main$main0↑!~$header0"],
                          ["remove", "div+main$main0↑!~$box0↑*"],
                          ["remove", "div+main$main0↑!~$box0"],
                          ["remove", "div+main$main0"]
                        ]
                        , [
                          ["remove", "div+main$main0↑!~$header0↑*"]
                        ], [
                          ["remove", "div+main$main0↑!~$box0↑*"]
                        ]
                      ]
            expect(stringify engine.updated.solution).to.eql stringify
              "$header0[width]": null
              "$box0[width]": null
            expect(all.header0.style.width).to.eql ''
            expect(all.box0.style.width).to.eql ''
            done()
        engine.solve(rules)

    describe '1 level w/ ::', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          ['rule', 
            ['.',
              [' '
                ['.', 'vessel']
              ]
              'box']
            ['==', 
              ["get", ["&"], "x"]
              100]
          ]
        ]
        GSS.console.info(".vessel .box { ::[x] == 100 }")
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                       
        engine.once 'solve', -> 
          expect(engine.updated.getProblems()).to.eql [
              [[
                key: '.vessel .box$box1'
                scope: '$box1'
                ['==', ['get', '$box1[x]'], 100]
              ]], [[
                key: '.vessel .box$box2'
                scope: '$box2'
                ['==', ['get', '$box2[x]'], 100]
              ]]
            ]
          done()
        
        engine.solve rules

    describe 'subqueries', ->
      it 'should observe selector on ::', (done) ->
        rules = ["rule",
                  [".", "vessel"]
                  ['==', 
                    ["get",
                      [".", 
                        [' ', 
                          ["&"]
                          ] 
                        "box"], 
                      "x"], 
                    100]
                ]
        GSS.console.info(".vessel { (:: .box)[x] == 100 }")
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
        engine.once 'solve', ->
          expect(stringify(engine.updated.getProblems())).to.eql stringify([
            [[
              key: '.vessel$vessel0↓ .box$box1', 
              scope: "$vessel0"
              ['==', ['get', '$box1[x]'], 100]]]
            [[
              key: '.vessel$vessel0↓ .box$box2', scope: "$vessel0"
              ['==', ['get', '$box2[x]'], 100]]]
          ])
          expect(stringify(engine.values)).to.eql stringify
            "$box1[x]": 100
            "$box2[x]": 100
          
          expect(box1.style.left).to.eql('100px')
          expect(box2.style.left).to.eql('100px')
          
          box1.setAttribute('class', '')

          engine.once 'solve', ->
            # One child doesnt match the subselector anymore
            expect(stringify(engine.updated.getProblems())).to.eql stringify([
              [['remove', '.vessel$vessel0↓ .box$box1']]
              [['remove', '.vessel$vessel0↓ .box$box1']]
            ])
            expect(stringify(engine.values)).to.eql stringify
              "$box2[x]": 100
            expect(box1.style.left).to.eql('')
            expect(box2.style.left).to.eql('100px')
            box1.setAttribute('class', 'box')

            engine.once 'solve', ->
              # Child matches again
              expect(stringify(engine.updated.getProblems())).to.eql stringify([
                [[
                  key: '.vessel$vessel0↓ .box$box1'
                  scope: "$vessel0"
                  ['==', ['get', '$box1[x]'], 100]
                ]]
              ])
              expect(stringify(engine.values)).to.eql stringify
                "$box2[x]": 100
                "$box1[x]": 100
              expect(box1.style.left).to.eql('100px')
              expect(box2.style.left).to.eql('100px')
              vessel0.setAttribute('class', '')

              engine.once 'solve', ->
                # Parent doesnt match anymore: Remove the whole tree
                expect(stringify(engine.updated.getProblems())).to.eql stringify([
                  [
                    ["remove", ".vessel$vessel0↓ .box$box1"], 
                    ["remove", ".vessel$vessel0↓ .box$box2"], 
                    ["remove", ".vessel$vessel0"]
                  ],
                  [["remove", ".vessel$vessel0↓ .box$box2"]]
                  [["remove", ".vessel$vessel0↓ .box$box1"]]
                ])
                expect(box1.style.left).to.eql('')
                expect(box2.style.left).to.eql('')
                vessel0.setAttribute('class', 'vessel')

                engine.once 'solve', ->
                  # Parent matches again, re-watch everything 
                  expect(stringify(engine.updated.getProblems())).to.eql stringify([
                    [[
                      key: '.vessel$vessel0↓ .box$box1'
                      scope: '$vessel0'
                      ['==', ['get', '$box1[x]'], 100]
                    ]]
                    [[
                      key: '.vessel$vessel0↓ .box$box2'
                      scope: '$vessel0'
                      ['==', ['get', '$box2[x]'], 100]
                    ]]
                  ])
                  expect(stringify(engine.values)).to.eql stringify
                    "$box1[x]": 100
                    "$box2[x]": 100
                  expect(box1.style.left).to.eql('100px')
                  expect(box2.style.left).to.eql('100px')
                  done()
        engine.solve(rules)

    describe '1 level w/ multiple selectors and &', ->
      it 'should combine comma separated native selectors', (done) ->
        rules = [
          'rule', 
          [','
            ['.', 'vessel']
            ['#', 'group1']]

          ['==',
            ['get'
              [':first-child',
                [' ', ['&']]]
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
        GSS.console.info(".vessel, #group1 { (:: :first-child)[y] == 100 }")

        vessel0 = container.getElementsByClassName('vessel')[0]
        box1 = container.getElementsByClassName('box')[1]
        box3 = container.getElementsByClassName('box')[3]

        engine.once 'solve', ->
          expect(stringify(engine.updated.getProblems())).to.eql stringify([
            [[
              key: '.vessel,#group1$vessel0↓ :first-child$box1'
              scope: '$vessel0'
              ['==', ['get', '$box1[y]'], 100]
            ]]
            [[
              key: '.vessel,#group1$group1↓ :first-child$box3'
              scope:  "$group1"
              ['==', ['get', '$box3[y]'], 100]
            ]]
          ])
          vessel0.setAttribute('class', '')
          expect(box1.style.top).to.eql('100px')
          expect(box3.style.top).to.eql('100px')
          engine.once 'solve', ->
            expect(stringify(engine.updated.getProblems())).to.eql stringify([
              [['remove', ".vessel,#group1$vessel0↓ :first-child$box1"]
              ['remove', ".vessel,#group1$vessel0"]]
              [['remove', ".vessel,#group1$vessel0↓ :first-child$box1"]]
            ])
            expect(box1.style.top).to.eql('')
            expect(box3.style.top).to.eql('100px')

            vessel0.setAttribute('class', 'vessel')

            engine.once 'solve', ->
              expect(stringify(engine.updated.getProblems())).to.eql stringify([
                [[
                  key: '.vessel,#group1$vessel0↓ :first-child$box1'
                  scope: '$vessel0'
                  ['==', ['get', '$box1[y]'], 100]
                ]]
              ])
              expect(box1.style.top).to.eql('100px')
              expect(box3.style.top).to.eql('100px')
              done()
        engine.solve(rules)

    describe '1 level w/ mixed multiple selectors and &', ->
      it 'should implement comma for non-native selectors', (done) ->
        rules = [
          'rule', 
          [',', 
            ['!>', 
              ['#', 'box1']]
            ['tag', 
              ['>']
              'div']]


          ['==',
            ['get'
              [':first-child',
                [' ',
                  ['&']]]
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
        GSS.console.info("#box1 !>, > div { (& :first-child)[y] == 100 }")

        vessel0 = container.getElementsByClassName('vessel')[0]
        box0    = container.getElementsByClassName('box')[0]
        box1    = container.getElementsByClassName('box')[1]
        box2    = container.getElementsByClassName('box')[2]
        box3    = container.getElementsByClassName('box')[3]
        box4    = container.getElementsByClassName('box')[4]
        group1  = container.getElementsByClassName('group')[0]

        engine.once 'solve', ->
          expect(stringify(engine.updated.getProblems())).to.eql stringify([
            [[
              key: '#box1!>,>div$vessel0↓ :first-child$box1'
              scope: '$vessel0'
              
              ['==', ['get', '$box1[y]'], 100]
            ]]
            
            [[
              key: '#box1!>,>div$group1↓ :first-child$box3'
              scope: '$group1'
              
              ['==', ['get', '$box3[y]'], 100]
            ]]
          ])

          expect(box1.style.top).to.eql('100px')
          expect(box3.style.top).to.eql('100px')
          expect(engine.queries['#box1!>,>div'].length).to.eql(3)
          expect(engine.queries['#box1!>,>div'].duplicates.length).to.eql(1)
          
          GSS.console.error('box1.remove()')
          box1.parentNode.removeChild(box1)
          engine.once 'solve', ->

            expect(stringify(engine.updated.getProblems())).to.eql stringify([
              [
                ['remove', "#box1!>,>div$vessel0↓ :first-child$box1"]
                ['remove', "#box1!>"]
                ['remove', "#box1"]
              ]
              [['remove',  "#box1!>,>div$vessel0↓ :first-child$box1"]]
              [[
                key: '#box1!>,>div$vessel0↓ :first-child$box2'
                scope: '$vessel0'
              
                ['==', ['get', '$box2[y]'], 100]
              ]]
            ])
            expect(box1.style.top).to.eql('')
            expect(box2.style.top).to.eql('100px')
            expect(box3.style.top).to.eql('100px')
            expect(engine.queries['#box1!>,>div'].length).to.eql(3)
            expect(engine.queries['#box1!>,>div'].duplicates.length).to.eql(0)
            expect(engine.queries['#box1']).to.eql(undefined)
            expect(engine.queries['#box1!>']).to.eql(undefined)

            vessel0.insertBefore(box1, vessel0.firstChild)

            GSS.console.error('prepend(box1)')
            engine.once 'solve', ->
              expect(stringify(engine.updated.getProblems())).to.eql stringify([
                [['remove', "#box1!>,>div$vessel0↓ :first-child$box2"]]
                [['remove',  '#box1!>,>div$vessel0↓ :first-child$box2']]
                [[
                  key: '#box1!>,>div$vessel0↓ :first-child$box1'
                  scope: '$vessel0'
              
                  ['==', ['get', '$box1[y]'], 100]
                ]]
                
              ])
              expect(box1.style.top).to.eql('100px')
              expect(box2.style.top).to.eql('')
              expect(box3.style.top).to.eql('100px')

              vessel0.removeChild(box1)
              GSS.console.error('box1.remove()')
              
              engine.once 'solve', ->
                expect(stringify(engine.updated.getProblems())).to.eql stringify([
                  [
                    ['remove', "#box1!>,>div$vessel0↓ :first-child$box1"]
                    ['remove', "#box1!>"]
                    ['remove', "#box1"]
                  ]
                  [['remove',  "#box1!>,>div$vessel0↓ :first-child$box1"]]
                  [[
                    key: '#box1!>,>div$vessel0↓ :first-child$box2'
                    scope: '$vessel0'
              
                    ['==', ['get', '$box2[y]'], 100]
                  ]]
                ])
                expect(box1.style.top).to.eql('')
                expect(box2.style.top).to.eql('100px')
                expect(box3.style.top).to.eql('100px')

                vessel0.parentNode.removeChild(vessel0)

                engine.once 'solve', ->
                  expect(engine.queries['>'].length).to.eql(2)
                  expect(engine.queries['#box1!>,>div'].slice()).to.eql([box0, group1])
                  expect(engine.queries['#box1!>,>div'].slice()).to.eql([box0, group1])
                  expect(stringify(engine.updated.getProblems())).to.eql stringify([
                    [
                      ['remove',  "#box1!>,>div$vessel0↓ :first-child$box2"] 
                      ['remove', "#box1!>,>div$vessel0"] 
                      ['remove', ">$vessel0↑div"]
                      ['remove', ">$vessel0"]
                    ]

                    [['remove',  "#box1!>,>div$vessel0↓ :first-child$box2"]]
                  ])
                  expect(box1.style.top).to.eql('')
                  expect(box2.style.top).to.eql('')
                  expect(box3.style.top).to.eql('100px')
                  expect(box4.style.top).to.eql('')
                  box3.parentNode.removeChild(box3)

                  engine.once 'solve', ->
                    expect(box1.style.top).to.eql('')
                    expect(box2.style.top).to.eql('')
                    expect(box3.style.top).to.eql('')
                    expect(box4.style.top).to.eql('100px')
                    expect(stringify(engine.updated.getProblems())).to.eql stringify([
                      [['remove', "#box1!>,>div$group1↓ :first-child$box3"]]
                      [['remove', "#box1!>,>div$group1↓ :first-child$box3"]]
                      [[
                        key: '#box1!>,>div$group1↓ :first-child$box4'
                        scope: '$group1'
              
                        ['==', ['get', '$box4[y]'], 100]
                      ]]
                    ])
                    box4.parentNode.removeChild(box4)

                    engine.once 'solve', ->
                      expect(box1.style.top).to.eql('')
                      expect(box2.style.top).to.eql('')
                      expect(box3.style.top).to.eql('')
                      expect(box4.style.top).to.eql('')
                      expect(stringify(engine.updated.getProblems())).to.eql stringify([
                        [['remove', "#box1!>,>div$group1↓ :first-child$box4"]]
                        [['remove', "#box1!>,>div$group1↓ :first-child$box4"]]
                      ])
                      expect(engine.queries['>'].slice()).to.eql([box0, group1])
                      box0.parentNode.removeChild(box0)
                      engine.once 'solve', ->
                        expect(stringify(engine.updated.getProblems())).to.eql stringify([
                          [
                            ['remove', "#box1!>,>div$box0"]
                            ['remove', ">$box0↑div"] 
                            ['remove', ">$box0"]
                          ]
                        ])
                        expect(engine.queries['#box1']).to.eql(undefined)
                        expect(engine.queries['#box1!>']).to.eql(undefined)
                        expect(engine.queries['#box1!>,>div'].slice()).to.eql([group1])
                        expect(engine.queries['>'].slice()).to.eql([group1])
                        group1.parentNode.removeChild(group1)
                        engine.once 'solve', ->
                          expect(stringify(engine.updated.getProblems())).to.eql stringify([
                            [['remove', "#box1!>,>div$group1"] 
                              ['remove', ">$group1↑div"]
                              ['remove', ">$group1"]]
                          ])
                          window.zzzz = true
                          GSS.console.log('append vessel0')

                          engine.scope.appendChild(vessel0)

                          engine.once 'solve', ->
                            done()
        engine.solve(rules)

    describe '1 level w/ $', ->
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          ['rule', 
            ['.'
              [' '
                ['.'
                  'vessel']]
              'box'],
            ["<=", ["get", ["&"], "width"], ["get", ["$"], "width"]]
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
                              
        engine.once 'solve', ->  

          expect(stringify(engine.updated.getProblems())).to.eql stringify [[
            [
              key: '.vessel .box$box1'
              scope: "$box1"
              
              ['<=', ['get','$box1[width]'], ['get', '$container0[width]']]
            ]
            [
              key: '.vessel .box$box2'
              scope: "$box2"
              
              ['<=', ['get','$box2[width]'], ['get', '$container0[width]']]
            ]
          ]]
          done()
        
        engine.solve rules

    describe '1 level w/ $ and selector', ->

      it 'should resolve selector on $', (done) ->
        rules = 
          ['rule', 
            ['.'
              [' ',
                ['.', 
                  'group']]
              'vessel']

            ["<=", 
              ["get",
                [':last-child'
                  ['.',
                    [' ', 
                      ['$']]
                    'box']]
                'width']

              100]]
        GSS.console.info('.group .vessel { ($ .box:last-child)[width] == 100 }')
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

        engine.once 'solve', ->        
          expect(stringify(engine.updated.getProblems())).to.eql stringify [
              [[
                key: ".group .vessel$vessel1↓$ .box:last-child$box2"
                scope: '$vessel1'
                
                ['<=',['get','$box2[width]'], 100]
              ]]

              [[
                key: ".group .vessel$vessel1↓$ .box:last-child$box4"
                scope: '$vessel1'
              
                ['<=',['get','$box4[width]'], 100]
              ]]
            ]
          newLast = document.createElement('div')
          newLast.id = 'box5'
          newLast.className = 'box'
          container.firstElementChild.appendChild(newLast)

          engine.once 'solve', ->   
            expect(stringify(engine.updated.getProblems())).to.eql stringify [
                [["remove",".group .vessel$vessel1↓$ .box:last-child$box4"]],
                [
                  ["remove",".group .vessel$vessel1↓$ .box:last-child$box4"]
                ]

                [[
                  key: ".group .vessel$vessel1↓$ .box:last-child$box5"
                  scope: '$vessel1'
                
                  ['<=',['get','$box5[width]'], 100]
                ]]
              ]
            container.firstElementChild.setAttribute('class', '')

            engine.once 'solve', ->   
              expect(stringify(engine.updated.getProblems())).to.eql stringify [
                  [
                    ['remove', '.group .vessel$vessel1↓$ .box:last-child$box2'], 
                    ['remove', '.group .vessel$vessel1↓$ .box:last-child$box5'], 
                    ['remove', '.group .vessel$vessel1↓$'], 
                    ['remove', '.group .vessel$vessel1']
                  ]
                  [
                    ['remove', '.group .vessel$vessel1↓$ .box:last-child$box2']
                  ]
                  [
                    ['remove', '.group .vessel$vessel1↓$ .box:last-child$box5']
                  ]
                ]
              container.firstElementChild.setAttribute('class', 'group')
              engine.once 'solve', ->  
                expect(stringify(engine.updated.getProblems())).to.eql stringify [
                    [[
                      key: ".group .vessel$vessel1↓$ .box:last-child$box2"
                      scope: '$vessel1'
                      ['<=',['get','$box2[width]'], 100]
                    ]]
                    [[
                      key: ".group .vessel$vessel1↓$ .box:last-child$box5"
                      scope: '$vessel1'
                      ['<=',['get','$box5[width]'], 100]
                    ]]
                  ] 
                container.appendChild(clone)
                
                engine.once 'solve', ->   
                  expect(stringify(engine.updated.getProblems())).to.eql stringify [
                      [
                        [
                          key: '.group .vessel$vessel11↓$ .box:last-child$box2'
                          scope: '$vessel11'
                          ['<=',['get','$box2[width]'], 100]
                        ]
                      ]
                      [
                        [
                          key: '.group .vessel$vessel11↓$ .box:last-child$box5'
                          scope: '$vessel11'
                          ['<=',['get','$box5[width]'], 100]
                        ]
                      ]
                      
                      [
                        [
                          key: '.group .vessel$vessel11↓$ .box:last-child$box12'
                          scope: '$vessel11'
                          ['<=',['get','$box12[width]'], 100]
                        ]
                        [
                          key: '.group .vessel$vessel1↓$ .box:last-child$box12'
                          scope: '$vessel1'
                          ['<=',['get','$box12[width]'], 100]
                        ]
                      ]
                      [
                        [
                          key: '.group .vessel$vessel11↓$ .box:last-child$box14'
                          scope: '$vessel11'
                          ['<=',['get','$box14[width]'], 100]
                        ]
                        [
                          key: '.group .vessel$vessel1↓$ .box:last-child$box14'
                          scope: '$vessel1'
                          ['<=',['get','$box14[width]'], 100]
                        ]
                      ]
                      

                    ]
                    
                  container.replaceChild(container.firstElementChild, container.lastElementChild)
                  engine.once 'solve', ->
                    expect(stringify(engine.updated.getProblems())).to.eql stringify [  
                      [
                        ["remove", ".group .vessel$vessel11↓$ .box:last-child$box2"], 
                        ["remove", ".group .vessel$vessel11↓$ .box:last-child$box5"], 
                        ["remove", ".group .vessel$vessel11↓$ .box:last-child$box12"], 
                        ["remove", ".group .vessel$vessel11↓$ .box:last-child$box14"], 
                        ["remove", ".group .vessel$vessel11↓$"], 
                        ["remove", ".group .vessel$vessel11"], 
                        ["remove", ".group .vessel$vessel1↓$ .box:last-child$box12"], 
                        ["remove", ".group .vessel$vessel1↓$ .box:last-child$box14"]
                      ]

                     [["remove", ".group .vessel$vessel11↓$ .box:last-child$box2"]],
                     [["remove", ".group .vessel$vessel11↓$ .box:last-child$box5"]],

                     [["remove", ".group .vessel$vessel11↓$ .box:last-child$box12",
                                 ".group .vessel$vessel1↓$ .box:last-child$box12"]],
                                 
                     [["remove", ".group .vessel$vessel11↓$ .box:last-child$box14",
                                 ".group .vessel$vessel1↓$ .box:last-child$box14"]]

                    ]
                    box2 = container.getElementsByClassName('box')[2]
                    box2.parentNode.removeChild(box2)
                    engine.once 'solve', ->
                      expect(stringify(engine.updated.getProblems())).to.eql stringify [
                          [['remove', '.group .vessel$vessel1↓$ .box:last-child$box2']]
                          [['remove', '.group .vessel$vessel1↓$ .box:last-child$box2']]
                          [[
                            key: ".group .vessel$vessel1↓$ .box:last-child$box1"
                            scope: '$vessel1'
                            ['<=',['get', '$box1[width]'], 100]
                          ]]
                          
                        ]
                      vessel = container.getElementsByClassName('vessel')[0]
                      vessel.parentNode.removeChild(vessel)

                      engine.once 'solve', ->
                        expect(stringify(engine.updated.getProblems())).to.eql stringify [
                          [  
                            ['remove', '.group .vessel$vessel1↓$ .box:last-child$box1'], 
                            ['remove', ".group .vessel$vessel1↓$ .box:last-child$box5"], 
                            ['remove', ".group .vessel$vessel1↓$"], 
                            ['remove', ".group .vessel$vessel1"]
                          ]
                          [
                            ['remove', ".group .vessel$vessel1↓$ .box:last-child$box5"]
                          ],
                          [
                            ['remove', '.group .vessel$vessel1↓$ .box:last-child$box1']
                          ]
                        ]
                        container.innerHTML = ""
                        done()
        engine.solve(rules)
      
    describe '1 level w/ ^', ->
      it 'should resolve selector on ^', (done) ->
        rules = [
          ['rule',
            ['.', 'group']

            ['rule', 
              ['.', 'vessel']

              ["<=", 
                ["get",
                  [':last-child'
                    ['.',
                      [' ', 
                        ["^"]
                      ]
                      'box'
                      ]
                    ]
                  'width']
              100]]
            ]
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
        clone.setAttribute('id', 'container1')
        clone.innerHTML = container.innerHTML.replace /\d+/g, (d) ->
          return "1" + d


        engine.once 'solve', ->       
          expect(stringify(engine.updated.getProblems())).to.eql stringify [
              [[
                key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2"
                scope: "$vessel1"

                ['<=',['get', '$box2[width]'], 100]
              ]]
              [[
                key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box4"
                scope: "$vessel1"

                ['<=',['get', '$box4[width]'], 100]
              ]]
            ]
          newLast = document.createElement('div')
          newLast.id = 'box5'
          newLast.className = 'box'
          container.firstElementChild.appendChild(newLast)

          engine.once 'solve', -> 
            expect(stringify(engine.updated.getProblems())).to.eql stringify [
                [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box4"]],
                [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box4"]]
                [[
                  key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5"
                  scope: "$vessel1"

                  ['<=',['get', '$box5[width]'], 100]
                ]]
              ]
            container.firstElementChild.setAttribute('class', '')

            engine.once 'solve', -> 
              expect(stringify(engine.updated.getProblems())).to.eql stringify [
                  [
                    ['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box2'], 
                    ['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box5'], 
                    ['remove', '.group$group1↓.vessel$vessel1↓^'], 
                    ['remove', ".group$group1↓.vessel$vessel1"],
                    ['remove', ".group$group1"]
                  ]
                  [
                    ['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box2']
                  ]
                  [
                    ['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box5']
                  ]
                ]
              container.firstElementChild.setAttribute('class', 'group')

              engine.once 'solve', -> 
                expect(stringify(engine.updated.getProblems())).to.eql stringify [
                  [[
                    key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2"
                    scope: "$vessel1"

                    ['<=',['get', '$box2[width]'], 100]
                  ]]
                  [[
                    key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5"
                    scope: "$vessel1"

                    ['<=',['get', '$box5[width]'], 100]
                  ]]

                  ]
                container.appendChild(clone)

                engine.once 'solve', -> 
                  expect(stringify(engine.updated.getProblems())).to.eql stringify [
                    [[
                      key: ".group$group11↓.vessel$vessel11↓^ .box:last-child$box12"
                      scope: "$vessel11"

                      ['<=',['get', '$box12[width]'], 100]
                    ]]
                    [[
                      key: ".group$group11↓.vessel$vessel11↓^ .box:last-child$box14"
                      scope: "$vessel11"

                      ['<=',['get', '$box14[width]'], 100]
                    ]]

                    ]
                  container.replaceChild(container.firstElementChild, container.lastElementChild)

                  engine.once 'solve', -> 
                    expect(stringify(engine.updated.getProblems())).to.eql stringify [
                      [
                        ['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box12'],
                        ['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box14'],
                        ['remove', '.group$group11↓.vessel$vessel11↓^'],
                        ['remove', ".group$group11↓.vessel$vessel11"]
                        ['remove', ".group$group11"]
                      ]
                      [
                        ['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box12']
                      ]
                      [
                        ['remove', '.group$group11↓.vessel$vessel11↓^ .box:last-child$box14']
                      ]
                    ]
                    box2 = container.getElementsByClassName('box')[2]
                    box2.parentNode.removeChild(box2)

                    engine.once 'solve', -> 
                      expect(stringify(engine.updated.getProblems())).to.eql stringify [
                          [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2"]],
                          [["remove", ".group$group1↓.vessel$vessel1↓^ .box:last-child$box2"]]
                          [[
                            key: ".group$group1↓.vessel$vessel1↓^ .box:last-child$box1"
                            scope: "$vessel1"

                            ['<=',['get', '$box1[width]'], 100]
                          ]]
                          
                        ]
                      vessel = container.getElementsByClassName('vessel')[0]
                      vessel.parentNode.removeChild(vessel)

                      engine.once 'solve', -> 
                        expect(stringify(engine.updated.getProblems())).to.eql stringify [
                          [
                            ['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box1'],
                            ['remove', ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5"],
                            ['remove', ".group$group1↓.vessel$vessel1↓^"],
                            ['remove', ".group$group1↓.vessel$vessel1"]
                          ]
                          [
                            ['remove', ".group$group1↓.vessel$vessel1↓^ .box:last-child$box5"]
                          ],
                          [
                            ['remove', '.group$group1↓.vessel$vessel1↓^ .box:last-child$box1']
                          ]
                        ]
                        container.innerHTML = ""
                        done()
        engine.solve(rules)
    
      it 'should handle mix of global and local selector', (done) ->
        rules = [
          ['rule', 
            ['.'
              [' ',
                ['.',
                  'vessel']]
              'box'],

            ["<=", 
              ["get", ["&"], "width"], 
              ["get", ["#", [' ', ['$']], "vessel1"], "width"]]
          ]
        ]
        GSS.console.info('.vessel .box { ::[width] == #vessel1[width] } ')
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div id="vessel1" class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
        
                              
        engine.once 'solve', ->
          expect(stringify(engine.updated.getProblems())).to.eql stringify [[
            [
              key: ".vessel .box$box1↓$ #vessel1$vessel1"
              scope: "$box1"
              ["<=",
                ["get","$box1[width]"],
                ["get","$vessel1[width]"]]
            ]
            [
              key: ".vessel .box$box2↓$ #vessel1$vessel1"
              scope: "$box2"
              ["<=",
                ["get","$box2[width]"],
                ["get","$vessel1[width]"]]
            ]
          ]]
          vessel1 = engine.id('vessel1')
          vessel1.parentNode.removeChild(vessel1)
          engine.once 'solve', ->
            expect(stringify(engine.updated.getProblems())).to.eql stringify [
              [
                ["remove", ".vessel .box$box1↓$ #vessel1$vessel1"], 
                ["remove", ".vessel .box$box1↓$"],
                ["remove", ".vessel .box$box1"], 
                ["remove", ".vessel .box$box2↓$ #vessel1$vessel1"], 
                ["remove", ".vessel .box$box2↓$"],
                ["remove", ".vessel .box$box2"]
              ]
              [
                ["remove", ".vessel .box$box1↓$ #vessel1$vessel1",
                           ".vessel .box$box2↓$ #vessel1$vessel1"]
              ]
            ]
            container.appendChild(vessel1)
            engine.once 'solve', ->
              expect(stringify(engine.updated.getProblems())).to.eql stringify [[
                [
                  key: ".vessel .box$box1↓$ #vessel1$vessel1"
                  scope: "$box1"
                  ["<=",
                    ["get","$box1[width]"],
                    ["get","$vessel1[width]"]]
                ]
                [
                  key: ".vessel .box$box2↓$ #vessel1$vessel1"
                  scope: "$box2"
                  ["<=",
                    ["get","$box2[width]"],
                    ["get","$vessel1[width]"]]
                ]
              ]]
              vessel1.parentNode.removeChild(vessel1)
              engine.once 'solve', ->
                expect(stringify(engine.updated.getProblems())).to.eql stringify [
                  [
                    ["remove", ".vessel .box$box1↓$ #vessel1$vessel1"], 
                    ["remove", ".vessel .box$box1↓$"],
                    ["remove", ".vessel .box$box1"], 
                    ["remove", ".vessel .box$box2↓$ #vessel1$vessel1"], 
                    ["remove", ".vessel .box$box2↓$"],
                    ["remove", ".vessel .box$box2"]
                  ]
                  [
                    ["remove", ".vessel .box$box1↓$ #vessel1$vessel1",
                               ".vessel .box$box2↓$ #vessel1$vessel1"]
                  ]
                ]
                done()

        engine.solve rules

      it 'Runs commands from sourceNode', (done) ->
        rules = [
          ['rule', 
            ['.'
              [' ',
                ['.',
                  'vessel']]
              'box'],

            ["<=", 
              ["get", ["&"], "width"], 
              ["get", ["^"], "width"]]
          ]
        ]
        GSS.console.info('.vessel .box { ::[width] == ^[width] } ')
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div id="vessel1" class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        engine.once 'solve', ->
          expect(engine.updated.getProblems()).to.eql [[
            [{"key":".vessel .box$box1","scope":"$box1"},
            ["<=",["get","$box1[width]"],["get","$container0[width]"]]]

            [{"key":".vessel .box$box2","scope":"$box2"},
            ["<=",["get","$box2[width]"],["get","$container0[width]"]]]
          ]]
          done()

        engine.solve rules

    describe '2 level', ->
      it 'Runs commands from sourceNode', (done) ->
        rules = 
          ['rule', 
            ['.', 'vessel']

            ['rule', 
              ['.', 'box']

              ['<=', ["get",["&"], "x"], 100]
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
        
        box1 = container.getElementsByClassName('box')[1] 
        vessel0 = container.getElementsByClassName('vessel')[0] 
        engine.once 'solve', ->
          expect(stringify engine.updated.getProblems()).to.eql stringify [[
            [{"key":".vessel$vessel0↓.box$box1","scope":"$box1"},
            ["<=",["get","$box1[x]"],100]]
          ]
          [
            [{"key":".vessel$vessel0↓.box$box2","scope":"$box2"},
            ["<=",["get","$box2[x]"],100]]
          ]]
          box1.setAttribute('class', '')

          engine.once 'solve', ->
            expect(stringify engine.updated.getProblems()).to.eql stringify [
              [['remove', ".vessel$vessel0↓.box$box1"]]
              [['remove', ".vessel$vessel0↓.box$box1"]]
            ]
            box1.setAttribute('class', 'box')

            engine.once 'solve', ->
              expect(stringify engine.updated.getProblems()).to.eql stringify [[
                [{"key":".vessel$vessel0↓.box$box1","scope":"$box1"},
                ["<=",["get","$box1[x]"],100]]
              ]]
              vessel0.setAttribute('class', '')

              engine.once 'solve', ->
                expect(stringify engine.updated.getProblems()).to.eql stringify [
                  [
                    ['remove', ".vessel$vessel0↓.box$box1"], 
                    ['remove', ".vessel$vessel0↓.box$box2"], 
                    ['remove', ".vessel$vessel0"]
                  ]
                  [['remove', ".vessel$vessel0↓.box$box2"]]
                  [['remove', ".vessel$vessel0↓.box$box1"]]
                ]
                vessel0.setAttribute('class', 'vessel')

                engine.once 'solve', ->
                  expect(stringify engine.updated.getProblems()).to.eql stringify [[
                    [{"key":".vessel$vessel0↓.box$box1","scope":"$box1"},
                    ["<=",["get","$box1[x]"],100]]
                  ]
                  [
                    [{"key":".vessel$vessel0↓.box$box2","scope":"$box2"},
                    ["<=",["get","$box2[x]"],100]]
                  ]]
                  box1.parentNode.removeChild(box1)

                  engine.once 'solve', ->
                    expect(stringify engine.updated.getProblems()).to.eql stringify [
                      [['remove', ".vessel$vessel0↓.box$box1"]]
                      [['remove', ".vessel$vessel0↓.box$box1"]]
                    ]
                    vessel0.insertBefore(box1, vessel0.firstChild)

                    engine.once 'solve', ->
                      expect(stringify engine.updated.getProblems()).to.eql stringify [[
                        [{"key":".vessel$vessel0↓.box$box1","scope":"$box1"},
                        ["<=",["get","$box1[x]"],100]]
                      ]]
                      engine.scope.innerHTML = ""

                      engine.once 'solve', ->
                        expect(stringify engine.updated.getProblems()).to.eql stringify [
                          [
                            ['remove', ".vessel$vessel0↓.box$box1"],
                            ['remove', ".vessel$vessel0↓.box$box2"],
                            ['remove', ".vessel$vessel0"]
                          ]
                          [['remove', ".vessel$vessel0↓.box$box2"]]
                          [['remove', ".vessel$vessel0↓.box$box1"]]
                        ]
                        engine.scope.innerHTML = ""
                        done()
        engine.solve rules

    describe '2 level /w multiple selectors in parent', (e) ->
      it 'Runs commands from sourceNode', (done) ->
        rules = 
          ['rule', 
            [','
              ['.', 'vessel']
              ['#', 'group1']
            ]

            ['rule', 
              [':last-child',
                ['.', 'box']]

              ['==', ["get",["&"], "x"], 100]
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

        engine.once 'solve', ->
          expect(engine.updated.getProblems()).to.eql [[
            [{"key":".vessel,#group1$vessel0↓.box:last-child$box2","scope":"$box2"},
              ["==",["get","$box2[x]"],100]]],
            [[{"key":".vessel,#group1$group1↓.box:last-child$box4","scope":"$box4"},
              ["==",["get","$box4[x]"],100]]]]
          box2.setAttribute('class', '')
          
          engine.once 'solve', ->
            expect(stringify engine.updated.getProblems()).to.eql stringify [
              [["remove",".vessel,#group1$vessel0↓.box:last-child$box2"]]
              [["remove",".vessel,#group1$vessel0↓.box:last-child$box2"]]
            ]
            box2.setAttribute('class', 'box')

            engine.once 'solve', ->
              expect(engine.updated.getProblems()).to.eql [[
                [{"key":".vessel,#group1$vessel0↓.box:last-child$box2","scope":"$box2"},
                  ["==",["get","$box2[x]"],100]]
              ]]
              vessel0.setAttribute('class', '')
                  
              engine.once 'solve', ->
                expect(stringify engine.updated.getProblems()).to.eql  stringify [
                  [
                    ["remove",".vessel,#group1$vessel0↓.box:last-child$box2"], 
                    ["remove",".vessel,#group1$vessel0"]
                  ]
                  [["remove",".vessel,#group1$vessel0↓.box:last-child$box2"]]
                ]
                vessel0.setAttribute('class', 'vessel')
                    
                engine.once 'solve', ->

                  [{"key":".vessel,#group1$vessel0↓.box:last-child$box2","scope":"$box2"},
                    ["==",["get","$box2[x]"],100]]

                  vessel0.removeChild(box2)
                      
                  engine.once 'solve', ->
                    expect(stringify engine.updated.getProblems()).to.eql stringify [
                      [["remove",".vessel,#group1$vessel0↓.box:last-child$box2"]]
                      [["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]]
                      [[{"key":".vessel,#group1$vessel0↓.box:last-child$box1","scope":"$box1"},
                        ["==",["get","$box1[x]"],100]]]
                      
                    ]
                    vessel0.appendChild(box2)
                        
                    engine.once 'solve', ->
                      expect(stringify engine.updated.getProblems()).to.eql stringify [
                        [["remove",".vessel,#group1$vessel0↓.box:last-child$box1"]]
                        [["remove",".vessel,#group1$vessel0↓.box:last-child$box1"]]
                        [[{"key":".vessel,#group1$vessel0↓.box:last-child$box2","scope":"$box2"},
                          ["==",["get","$box2[x]"],100]]]
                        
                      ]
                      engine.scope.innerHTML = ""

                      engine.once 'solve', ->
                        expect(stringify engine.updated.getProblems()).to.eql stringify [
                          [
                            ["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]
                            ["remove", ".vessel,#group1$vessel0"]
                            ["remove", ".vessel,#group1$group1↓.box:last-child$box4"]
                            ["remove", ".vessel,#group1$group1"]
                          ]
                          [["remove", ".vessel,#group1$group1↓.box:last-child$box4"]]
                          [["remove", ".vessel,#group1$vessel0↓.box:last-child$box2"]]
                        ]
                        done()
        engine.solve rules

  describe '@if @else', ->
      
    describe 'basic', ->
    
      it 'step 1', (done) ->
        rules = [
          ['==',['get','big'], 500]
          ['==',['get','med'], 50]
          ['==',['get','small'],5]
          ['==',['get','target-width'], 900]

          ['rule', 
            ['.',
              [' '
                ['.', 'vessel']]
              'box']

            ['if',
              ['>=',                 
                ['get', ['^'], 'target-width']
                960]
              ['==', ["get", ["&"], "width"], ["get",['^'], "big"]]
              [
                ['if',
                  ['>=',                     
                    ['get', ['^'], 'target-width']
                    500]
                  ['==', ["get", ["&"], 'width'],["get", ['^'], "med"]]

                  ['==', ["get", ["&"], 'width'], ["get", ['^'], "small"]]
                ]
              ]
            ]
          ]         
        ]
        counter = 0
        listener = (e) ->
          counter++
          if counter is 1   
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":900 
          else if counter is 2   
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":900
              "$box1[width]":50
              "$box2[width]":50
            engine.output.merge 'target-width': 1000
          else if counter is 3
            window.xxx = true
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":1000
              "$box1[width]":500
              "$box2[width]":500
            engine.output.merge 'target-width': 900
          else if counter is 4
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":900
              "$box1[width]":50
              "$box2[width]":50
            engine.output.merge 'target-width': 300
          else if counter is 5
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":300
              "$box1[width]":5
              "$box2[width]":5
            window.xxx = true

            engine.id('box1').setAttribute('class', '')
          else if counter is 6
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":300
              "$box2[width]":5
            engine.id('box2').setAttribute('class', '')
          else if counter is 7
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":300
            engine.output.merge 'target-width': 1000
            engine.id('box2').setAttribute('class', 'box')
          else if counter is 8
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":1000
          else if counter is 9
            expect(stringify(engine.values)).to.eql stringify
              "$box2[width]":500
              "big":500
              "med":50
              "small":5
              "target-width":1000
            container.innerHTML = ''
          else if counter is 10
            expect(stringify(engine.values)).to.eql stringify
              "big":500
              "med":50
              "small":5
              "target-width":1000
            expect(Object.keys(engine.values).length).to.eql(4)
            expect(Object.keys(engine.output.watchers).length).to.eql(0)
            expect(Object.keys(engine.output.watched).length).to.eql(0)
            expect((k = Object.keys(engine.observers)).length).to.eql(1)
            expect(Object.keys(engine.observers[k[0]]).length).to.eql(9)

            container.removeEventListener 'solve', listener
            done()
        container.addEventListener 'solve', listener
        
        engine.solve rules
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

