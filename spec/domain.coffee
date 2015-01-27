assert = chai.assert
expect = chai.expect

describe 'Domain', ->
  engine = null
  afterEach ->
    if engine
      engine.destroy()

  describe 'single solving domain', ->
    it 'should find solutions', ->
      engine = new GSS.Engine()
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

    it 'should find solutions when using nested simple expressions', ->
      engine = new GSS.Engine()
      expect(engine.solve [
        ['==',
          ['get', 'result']
          ['+',
            ['get', 'a']
            ['+', ['*', 1, 2], 3]
          ]
        ]
      ]).to.eql 
        result: 0
        a: -5

  describe 'solving and input domains together', ->
    it 'should calculate simplified expression', ->
      window.$engine = engine = new GSS({
        a: 666
      })

      expect(engine.solve [
        ['==',
          ['get', 'result']
          ['+',
            ['get', 'a']
            1
          ]
        ]
      ]).to.eql 
        result: 667

    it 'should calculate simplified variable', ->
      engine =  new GSS({
        a: 666
      })

      expect(engine.solve [
        ['==',
          ['get', 'result']
          ['get', 'a']
        ]
      ]).to.eql 
        result: 666

      expect(
        engine.solve a: null
      ).to.eql 
        a: 0
        result: 0


    it 'should simplify partially', ->
      window.$engine = engine = new GSS({
        a: 555
      })

      expect(engine.solve [
        ['=='
          ['get', 'b'],
          10
        ],
        ['==',
          ['get', 'result']
          ['+',
            ['*'
              2,
              ['get', 'a']]
            ['get', 'b']
          ]
        ]
      ]).to.eql 
        result: 555 * 2 + 10
        b: 10

      expect(engine.solve
        a: -555
      ).to.eql
        result: -1100
        a: -555



    it 'should simplify multiple variables partially', ->
      engine = new GSS({
        a: 555,
        A: 2
      })
      expect(engine.solve [
        ['=='
          ['get', 'b'],
          10
        ],
        ['==',
          ['get', 'result']
          ['+',
            ['*'
              ['get', 'A'],
              ['get', 'a']]
            ['get', 'b']
          ]
        ]
      ]).to.eql 
        result: 555 * 2 + 10
        b: 10

      GSS.console.info('a=-555, was 555')
      
      expect(engine.solve
        a: -555
      ).to.eql
        result: -1100
        a: -555

      GSS.console.info('A=1, was 2')

      expect(engine.solve
        A: 1
      ).to.eql
        A: 1
        result: -545

    it 'should change variable domain after the fact', ->
      engine =  new GSS
      expect(engine.solve [
        ['=='
          ['get', 'result']
          ['+',
            ['get', 'a'],
            1]
        ]
      ]).to.eql
        result: 0
        a: -1
      
      GSS.console.error('A=666')
      
      expect(engine.solve
        a: 666
      ).to.eql
        a: 666
        result: 667

      GSS.console.error('A=null')
      expect(engine.solve
        a: null
      ).to.eql
        result: 0
        a: -1

    it 'should use intrinsic values as known values', ->
      el = document.createElement('div')
      el.innerHTML = """
        <div id="box0" style="width: 50px"></div>
        <div id="box1" style="width: 50px"></div>
      """
      document.body.appendChild(el)
      engine =  new GSS(el)
      engine.solve [
        ['==',
          ['get', 'a']
          ['+',
            ['get', ['#', 'box0'], 'z']
            ['get', ['#', 'box1'], 'intrinsic-width']
          ]
        ]
      ], (solution) ->
        expect(solution).to.eql
          "a": 0
          "$box0[z]": -50
          "$box1[intrinsic-width]": 50
        document.body.removeChild(el)


  describe 'solvers in worker', ->
    @timeout 60000


    it 'should receieve measurements from document to make substitutions', (done) ->
      root = document.createElement('div')
      root.innerHTML = """
        <div id="box0" style="width: 20px"></div>
      """
      document.body.appendChild(root)
      engine =  new GSS(root, true)
      problem = [
        ['=='
          ['get', 'result']
          ['-',
            ['+'
              ['get', ['#', 'box0'], 'intrinsic-width'],
              1]
            ['get', 'x']]
        ]
      ]
      engine.solve problem, 'my_funny_tracker_path', (solution) ->
        expect(solution).to.eql 
          "$box0[intrinsic-width]": 20
          result: 0
          x: 21
        
        
        engine.solve
          x: 2
        , (solution) ->
          expect(solution).to.eql 
            result: 19
            x: 2

          engine.solve
            "x": 3
          , (solution) ->
            expect(solution).to.eql 
              result: 18
              x: 3
            engine.solve
              "x": null
            , (solution) ->
              GSS.console.info(solution)
              expect(solution).to.eql 
                result: 0
                x: 21
              root.removeChild(engine.id('box0'))
              engine.then (solution) ->
                GSS.console.info(solution)
                expect(solution).to.eql 
                  "$box0[intrinsic-width]": null
                  "x": null
                  "result": null



                #document.body.removeChild(root)
                done()


    it 'should receive commands from document', (done) ->
      engine = new GSS true
      problem = [
        ['=='
          ['get', 'result']
          ['+',
            ['get', 'a'],
            1]
        ]
        ['=='
          ['get', 'b']
          ['+',
            1000,
            1]
        ]
      ]

      engine.solve problem, 'my_funny_tracker_path', (solution) ->
        expect(solution).to.eql 
          a: -1
          result: 0
          b: 1001

        engine.then (solution) ->
          expect(solution).to.eql 
            a: null
            result: null
            b: null

          done()
        engine.remove('my_funny_tracker_path')

          
  xdescribe 'framed domains', (done) ->
    it 'should not merge expressions of a framed domain in worker', ->
      window.$engine = engine =  new GSS true
      problem = [
        ['framed', 
          ['>=',
              ['get', 'a']
              1
            ]
        ]

        ['==',
          ['get', 'b']
          2
        ]

        ['==',
          ['get', 'b']
          ['get', 'a']
          'strong'
        ]
      ]
      engine.solve problem, (solution) ->
        expect(solution).to.eql
          a: 1
          b: 1
        engine.solve ['>=', ['get', 'a', '', 'something'], 3], (solution) ->
          expect(solution).to.eql
            a: 3
            b: 3
          
          engine.solve ['>=', ['get', 'b'], 4], (solution) ->
            expect(solution).to.eql {}

            engine.solve ['>=', ['get', 'c'], ['*', 2, ['get', 'b']]], (solution) ->
              expect(solution).to.eql 
                c: 6

              engine.solve ['remove', 'something'], (solution) ->
                expect(solution).to.eql 
                  a: 1
                  b: 1
                  c: 2
                done()


    it 'should not merge expressions of a framed domain', ->
      window.$engine = engine =  new GSS
      problem = [
        ['framed', 
          ['>=',
              ['get', 'a']
              1
            ]
        ]

        ['==',
          ['get', 'b']
          2
        ]

        ['==',
          ['get', 'b']
          ['get', 'a']
          'strong'
        ]
      ]
      expect(engine.solve(problem)).to.eql
        a: 1
        b: 1
      expect(engine.domains[2].constraints.length).to.eql(1)
      expect(engine.domains[3].constraints.length).to.eql(2)

      

      expect(engine.solve ['>=', ['get', 'a', '', 'something'], 3]).to.eql
        a: 3
        b: 3
      expect(engine.domains[2].constraints.length).to.eql(2)
      expect(engine.domains[3].constraints.length).to.eql(2)


      expect(engine.solve ['>=', ['get', 'b'], 4]).to.eql {}
      expect(engine.domains[2].constraints.length).to.eql(2)
      expect(engine.domains[3].constraints.length).to.eql(3)


      expect(engine.solve ['>=', ['get', 'c'], ['*', 2, ['get', 'b']]]).to.eql
        c: 6
      expect(engine.domains[2].constraints.length).to.eql(2)
      expect(engine.domains[3].constraints.length).to.eql(4)


      expect(engine.solve ['remove', 'something']).to.eql
        a: 1
        b: 1
        c: 2
      expect(engine.domains[2].constraints.length).to.eql(1)
      expect(engine.domains[3].constraints.length).to.eql(4)


    it 'should be able to export multiple framed variables into one domain', ->
      window.$engine = engine =  new GSS
      problem = [
        ['framed', 
          ['>=',
              ['get', 'a']
              1
            ]
        ]

        ['framed', 
          ['>=',
              ['get', 'b']
              2
            ]
        ]

        ['==',
          ['get', 'c']
          ['+', ['get', 'a'], ['get', 'b']]
        ]
      ]
      expect(engine.solve problem).to.eql
        a: 1
        b: 2
        c: 3
      A = engine.domains[2]
      B = engine.domains[3]
      C = engine.domains[4]
      expect(A.constraints.length).to.eql(1)
      expect(B.constraints.length).to.eql(1)
      expect(C.constraints.length).to.eql(1)

      expect(engine.solve ['==', ['get', 'a', '', 'aa'], -1]).to.eql
        a: -1
        c: 1
      expect(A.constraints.length).to.eql(2)
      expect(B.constraints.length).to.eql(1)
      expect(C.constraints.length).to.eql(1)

      expect(engine.solve ['==', ['get', 'b', '', 'bb'], -2]).to.eql
        b: -2
        c: -3
      expect(A.constraints.length).to.eql(2)
      expect(B.constraints.length).to.eql(2)
      expect(C.constraints.length).to.eql(1)

      expect(engine.solve ['==', ['get', 'c', '', 'cc'], 10]).to.eql
        c: 10

      expect(A.constraints.length).to.eql(2)
      expect(B.constraints.length).to.eql(2)
      expect(C.constraints.length).to.eql(2)

      expect(engine.solve ['remove', 'aa']).to.eql
        a: 1
      expect(A.constraints.length).to.eql(1)
      expect(B.constraints.length).to.eql(2)
      expect(C.constraints.length).to.eql(2)

      expect(engine.solve ['remove', 'cc']).to.eql
        c: -1

      expect(A.constraints.length).to.eql(1)
      expect(B.constraints.length).to.eql(2)
      expect(C.constraints.length).to.eql(1)

      expect(engine.solve ['remove', 'bb']).to.eql
        c: 3
        b: 2

      expect(A.constraints.length).to.eql(1)
      expect(B.constraints.length).to.eql(1)
      expect(C.constraints.length).to.eql(1)





  describe 'variable graphs', ->
    it 'should unmerge multiple domains', ->
      engine =  new GSS
      problem = [
        ['==',
          ['get', 'a']
          1
        ]
        ['==',
          ['get', 'b']
          ['get', 'c']
        ]
      ]
      expect(engine.solve(problem)).to.eql
        a: 1
        b: 0
        c: 0

      expect(engine.solve([
        ['==', 
          ['get', 'c'],
          ['*', 
            2
            ['get', 'a']
          ]
        ]
      ], 'my_tracker_path')).to.eql
        b: 2
        c: 2
        #a: 1
      GSS.console.log(1)
      expect(engine.solve [
        ['remove', 'my_tracker_path']
      ]).to.eql
        b: 0
        c: 0
        #a: 1

    it 'should merge multiple domains', ->
      engine =  new GSS
      # Makes two separate graphs
      problem = [
        ['=='
          ['get', 'result']
          ['+',
            ['get', 'a'],
            1]
        ]
        ['<='
          ['get', 'b'],
          4
        ],
        ['>='
          ['get', 'b'],
          2
        ],
      ]
      expect(engine.solve(problem)).to.eql
        result: 0
        a: -1
        b: 4

      # Add to 1st graph
      expect(engine.solve [
        ['>='
          ['get', 'a']
          5
        ]
      ]).to.eql
        result: 6
        a: 5

      # Add to 2nd graph
      expect(engine.solve [
        ['>='
          ['get', 'c']
          ['+'
            ['get', 'b']
            6
          ]
        ]
      ]).to.eql
        c: 10

      # Add to 2nd graph again
      expect(engine.solve [
        ['=='
          ['get', 'b']
          3
        ]
      ]).to.eql
        c: 9
        b: 3
      # merge two graphs
      expect(engine.solve [
        ['<=', 
          ['get', 'c'],
          ['get', 'result']
        ]
      ]).to.eql
        a: 8
        result: 9
        #c: 9
        #b: 3


