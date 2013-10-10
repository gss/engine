describe 'Cassowary Thread', ->
  it 'should instantiate', ->
    thread = new Thread()
  it '[x]==7; [y]==5; [x] - [y] == [z] // z is 2', (done) ->
    thread = new Thread()
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
  
  it 'hierarchy', (done) ->
    thread = new Thread()
    thread.unparse
      commands:[
        ['var', '[x]', 'x']
        ['var', '[y]', 'y']
        ['eq', ['get','[x]'],['number','100'],'strong']
        ['eq', ['get','[x]'],['number','10'],'medium']
        ['eq', ['get','[x]'],['number','1'],'weak']                        
        ['eq', ['get','[y]'],['number','1'],'weak']        
        ['eq', ['get','[y]'],['number','10'],'medium']
        ['eq', ['get','[y]'],['number','101'],'strong']        
      ]
    values = thread._getValues()
    chai.expect(values).to.eql
      "[x]": 100
      "[y]": 101
    done()

  it '$12322[width] == [grid-col]; ...', (done) ->
    thread = new Thread()
    thread.unparse
      commands:[
        ['var', '$12322[width]']
        ['var', '$34222[width]']
        ['var', '[grid-col]']
        ['eq', ['get','$12322[width]'],['get','[grid-col]']]
        ['eq', ['get','$34222[width]'],['get','[grid-col]']]
        ['eq', ['number','100'],['get','[grid-col]']]
      ]
    chai.expect(thread._getValues()).to.eql
      "$12322[width]": 100
      "$34222[width]": 100
      "[grid-col]": 100
    done()

  it 'intrinsic mock', (done) ->
    thread = new Thread()
    thread.unparse
      commands:[
        ['var', '[width]']
        ['var', '[intrinsic-width]']
        ['eq', ['get','[width]'],['number','100'], 'weak']
        ['eq', ['get','[width]'],['get','[intrinsic-width]'], 'required']
        ['suggest', ['get','[intrinsic-width]'], ['number','999']]
      ]
    values = thread._getValues()
    chai.expect(values).to.eql
      "[width]": 999
      "[intrinsic-width]": 999
    done()
  
  it 'tracking & removing by get tracker', (done) ->
    thread = new Thread()
    thread.unparse
      commands:[
        ['var', '[x]']
        ['eq', ['get','[x]','x-tracker'],['number','100'],'strong']
        ['eq', ['get','[x]'],['number','10'],'weak']        
      ]
    chai.expect(thread._getValues()).to.eql
      "[x]": 100
    thread.unparse
      commands:[
        ['remove', 'x-tracker']
      ]
    chai.expect(thread._getValues()).to.eql
      "[x]": 10
    done()
  
  it 'tracking & removing by var tracker', (done) ->
    thread = new Thread()
    thread.unparse
      commands:[
        ['var', '[x]', 'x-tracker']
        ['var', '[y]']
        ['eq', ['get','[x]'],['number','100'],'strong']
        ['eq', ['get','[x]'],['number','10'],'weak']
        ['eq', ['get','[y]'],['number','50'],'strong']
      ]
    chai.expect(thread._getValues()).to.eql
      "[x]": 100
      "[y]": 50
    thread.unparse
      commands:[
        ['remove', 'x-tracker']
      ]
    chai.expect(thread._getValues()).to.eql
      "[y]": 50
    done()
  


