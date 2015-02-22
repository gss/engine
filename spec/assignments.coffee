describe 'Assignments', ->
  describe 'on primitive keys', ->
    it 'should not accept numeric keys', ->
      engine = GSS()
      expect ->
        engine.solve([
          ['=', 2, 10]
        ])
      .to.throw()  

    it 'should accept string keys', ->
      engine = GSS()
      expect(engine.solve([
        ['=', '2', 10]
      ])).to.eql({2: 10})

  describe 'on non-numerical values', ->
    describe 'on numeric arrays', ->
      it 'should assign', ->
        engine = GSS()
        value = {zo: 'xo'}
        expect(engine.solve([
          ['=', 'z', value]
        ])).to.eql({z: value})



  describe 'in simple assignments', ->
    describe 'on unconstrained variables', ->
      it 'should set values', ->
        engine = GSS()
        expect(engine.solve([
          ['=', ['get', 'a'], 10]
          ['==', ['get', 'z'], ['get', 'a']]
        ])).to.eql({a: 10, z: 10})

    describe 'on assigned variables', ->
      describe 'with static numbers', ->
        it 'should set values', ->
          engine = GSS()
          expect(engine.solve([
            ['=', ['get', 'b'], 10],
            ['=', ['get', 'a'], ['get', 'b']],
            ['==', ['get', 'z'], ['get', 'a']],
            ['==', ['get', 'y'], ['get', 'b']],
          ])).to.eql({a: 10, b: 10, z: 10, y: 10})

      describe 'with suggested variables', ->
        it 'should set values', ->
          engine = GSS({
            c: 10  
          })
          expect(engine.solve([
            ['=', ['get', 'b'], ['get', 'c']]
            ['=', ['get', 'a'], ['get', 'b']]
            ['==', ['get', 'z'], ['get', 'a']]
            ['==', ['get', 'y'], ['get', 'b']]
          ])).to.eql({a: 10, b: 10, z: 10, y: 10})

          expect(engine.solve({
            c: 20
          })).to.eql({a: 20, b: 20, c: 20, z: 20, y: 20})

      describe 'with linear variables', ->
        it 'should set values', ->
          engine = GSS()
          expect(engine.solve([
            ['==', ['get', 'c'], 10]
            ['=', ['get', 'b'], ['get', 'c']]
            ['=', ['get', 'a'], ['get', 'b']]
          ])).to.eql({a: 10, b: 10, c: 10})

          expect(engine.solve([
            ['==', ['get', 'c'], 20]
          ])).to.eql({a: 20, b: 20, c: 20})

  describe 'in expressions', ->
    describe 'on assigned variables', ->
      describe 'with static numbers', ->
        it 'should set values', ->
          engine = GSS()
          expect(engine.solve([
            ['=', ['get', 'b'], ['+', 10, 1]]
            ['=', ['get', 'a'], ['+', ['get', 'b'], 1]]
          ])).to.eql({a: 12, b: 11})

      describe 'with suggested variables', ->
        it 'should set values', ->
          engine = GSS({
            c: 10  
          })
          expect(engine.solve([
            ['=', ['get', 'b'], ['+', ['get', 'c'], 1]]
            ['=', ['get', 'a'], ['+', ['get', 'b'], 1]]
          ])).to.eql({a: 12, b: 11})

          expect(engine.solve({
            c: 20
          })).to.eql({a: 22, b: 21, c: 20})

      describe 'with linear variables', ->
        it 'should set values', ->
          engine = GSS()
          expect(engine.solve([
            ['==', ['get', 'c'], 10]
            ['=', ['get', 'b'], ['+', ['get', 'c'], 1]]
            ['=', ['get', 'a'], ['+', ['get', 'b'], 1]]
          ])).to.eql({a: 12, b: 11, c: 10})

          expect(engine.solve([
            ['==', ['get', 'c'], 20]
          ])).to.eql({a: 22, b: 21, c: 20})


