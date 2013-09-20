describe 'Cassowary Thread', ->
  thread = null
  it 'should instantiate', ->
    thread = new Thread()
  it '[x]==7; [y]==5; [x] - [y] == [z] // z is 2', (done) ->
    thread.unparse
      commands:
        [
          ['var', 'x']
          ['var', 'y']
          ['var', 'z']
          ['eq',
            ['get', 'z'],
            ['minus', ['get', 'x'], ['get', 'y'] ]
          ]
          ['eq', ['get', 'x'], ['number', 7]]
          ['eq', ['get', 'y'], ['number', 5]]
        ]
    chai.expect(thread._getValues()).to.eql
      x: 7
      y: 5
      z: 2
    done()
