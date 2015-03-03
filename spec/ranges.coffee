

describe 'Ranges', ->
  engine = null
  before ->
    engine = new GSS
    engine.compile()

  describe 'constructor', ->
    it 'should create range', ->
      expect(engine.output.solve(['...', 10])).to.eql([false, 10])
      expect(engine.output.solve(['...', false, 10])).to.eql([false, 10])
      expect(engine.output.solve(['...', 10, 20])).to.eql([10, 20])
      expect(engine.output.solve(['...', 20, false])).to.eql([20])

  describe 'boundaries', ->
    it 'should clip by starting point', ->
      # 1 ... 20 > 10
      expect(engine.output.solve(
        ['<', 
          10,
          ['...', 1, 20]
        ]
      )).to.eql([10, 20])

      # ... 5 > 10
      expect(engine.output.solve(
        ['<',
          10
          ['...', 
            false,
            5
          ]
        ]
      )).to.eql([10, 5])

      # ... 15 > 10
      expect(engine.output.solve(
        ['<',
          10
          ['...', 
            false,
            15
          ]
        ]
      )).to.eql([10, 15])

      #  5 ... > 10
      expect(engine.output.solve(
        ['<',
          10
          ['...', 
            5,
            false
          ]
          
        ]
      )).to.eql([10])
      
      #  15 ... > 10
      expect(engine.output.solve(
        ['<'
          10
          ['...', 
            15,
            false
          ]
        ]
      )).to.eql([15])

      # 15 ... 5 > 10
      expect(engine.output.solve(
        ['<'
          10
          ['...', 
            15,
            5
          ]
        ]
      )).to.eql([15, 10])

      # 15 ... 5 < 10
      expect(engine.output.solve(
        ['<'
          ['...', 
            15,
            5
          ]
          10
        ]
      )).to.eql([10, 5])

      # 15 ... 5 > 0
      expect(engine.output.solve(
        ['<'
          10
          ['...', 
            15,
            5
          ]
        ]
      )).to.eql([15, 10])

      # 15 ... 5 < 0
      expect(engine.output.solve(
        ['<'
          ['...', 
            15,
            5
          ]
          0
        ]
      )).to.eql([0, 5]) # FIXME?


    it 'should clip by ending point', ->
      # 1 ... 20 < 10
      expect(engine.output.solve(
        ['<',
          ['...', 1, 20], 
          10
        ]
      )).to.eql([1, 10])

      # ... 5 < 10
      expect(engine.output.solve(
        ['<',
          ['...', 
            false,
            5
          ]
          10
        ]
      )).to.eql([false, 5])

      # ... 15 < 10
      expect(engine.output.solve(
        ['<',
          ['...', 
            false,
            15
          ]
          10
        ]
      )).to.eql([false, 10])

      #  5 ... < 10
      expect(engine.output.solve(
        ['<'
          ['...', 
            5,
            false
          ],
          10]
      )).to.eql([5, 10])


      #  5 ... < 10
      expect(engine.output.solve(
        ['>'
          10,
          ['...', 
            5,
            false
          ]]
      )).to.eql([5, 10])
      
      #  15 ... > 10
      expect(engine.output.solve(
        ['>',
          ['...', 
            15,
            false
          ],
          10
        ]
      )).to.eql([15])

    it 'should scale by starting point', ->
      # 1 ... 20 > 10
      expect(engine.output.solve(
        ['<', 
          10,
          ['...', 0, 20, 0.75]
        ]
      )).to.eql([10, 20, 0.5])

      # ... 5 > 10
      expect(engine.output.solve(
        ['<',
          10
          ['...', 
            false,
            5,
            0.5
          ]
        ]
      )).to.eql([10, 5, 1.5]) #?

      # ... 15 > 10
      expect(engine.output.solve(
        ['<',
          10
          ['...', 
            false,
            15,
            0.5
          ]
        ]
      ).slice()).to.eql([10, 15, -0.5])

      #  5 ... > 10
      expect(engine.output.solve(
        ['<',
          10
          ['...', 
            5,
            false,
            0.5
          ]
          
        ]
      )[2]).to.eql(0.75)
      
      #  15 ... > 10
      expect(engine.output.solve(
        ['>'
          ['...', 
            15,
            false,
            1
          ],
          10
        ]
      )[2]).to.eql(1)

    it 'should scale by ending point', ->
      # 1 ... 20 < 10
      expect(engine.output.solve(
        ['<',
          ['...', 0, 20, 0.5], 
          10
        ]
      )).to.eql([0, 10, 1])

      # ... 5 < 10
      expect(engine.output.solve(
        ['<',
          ['...', 
            false,
            5,
            0.5
          ]
          10
        ]
      )).to.eql([false, 5, 0.5])

      # ... 15 < 10
      expect(engine.output.solve(
        ['<',
          ['...', 
            false,
            15,
            0.5
          ]
          10
        ]
      )).to.eql([false, 10, 0.75])

      #  5 ... < 10
      expect(engine.output.solve(
        ['<'
          ['...', 
            5,
            false,
            0.5
          ],
          10]
      )).to.eql([5, 10, -0.5])


      #  10 > 5 ...
      expect(engine.output.solve(
        ['>'
          10,
          ['...', 
            5,
            false,
            0.5
          ]]
      )).to.eql([5, 10, -0.5])
      
      #  15 ... > 10
      expect(engine.output.solve(
        ['>'
          ['...', 
            15,
            false,
            0.5
          ]
          10
        ]
      )[2]).to.eql(0.5)

    describe 'values', ->
      it 'should create a range from two numbers', ->
        expect(engine.output.solve([
          '>',
          30,
          20
        ])).to.eql([20, false, 1.5])

 
        expect(engine.output.solve([
          '>',
          20,
          40
        ])).to.eql([false, 40, .5])

    xdescribe 'mapper', ->
      describe 'mapped explicitly', ->
        it 'should map one range to another', ->
          # 1 ... 20 -> -20 ... -1 
          engine.output.solve(['map',
            ['...', 1, 20],
            ['...', -20, -1]
          ])

      describe 'with transformation', ->
        it 'should map one range to another with', ->
          engine = new GSS(document.createElement('div'))
          # 1 ... 2 ease out -> 3 ... 4 quad in 
          engine.solve(['--',
            ['out',
              ['ease',
                ['...', 1, 2]
              ]
            ]
            ['in',
              ['quad', 
                ['...', 3, 4]
              ]
            ]
          ])

      describe 'with modifiers', ->
        it 'should default to double clip', ->
          engine = new GSS(document.createElement('div'))
          # 1 ... 2 -> 3 ... 4
          engine.solve(['--',
            ['...', 1, 2]
            ['...', 3, 4]
          ])

        it 'should force LTR order and invert modifiers', ->
          engine = new GSS(document.createElement('div'))
          # 1 ... 2 ~<- 3 ... 4
          engine.solve(['-~',
            ['...', 3, 4]
            ['...', 1, 2]
          ])

      describe 'with time', ->
        it 'should map one range to another with', ->
          engine = new GSS(document.createElement('div'))
          # 1 ... 2 => 100 ms
          engine.solve(['~-',
            ['out',
              ['ease',
                ['...', 1, 2]
              ]
            ]
            ['in',
              ['quad', 
                ['...', 3, 4]
              ]
            ]
          ])

  describe 'binders', ->