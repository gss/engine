Thread = GSS.Thread
Engine = GSS

expect = chai.expect
assert = chai.assert

describe 'Cassowary Thread', ->
  it 'should instantiate', ->
    thread = new Engine.Solver
  it '[x]==7; [y]==5; [x] - [y] == [z] // z is 2', (done) ->
    thread = new Engine.Solver
    thread.add [
      ['eq',
        ['get', 'z'],
        ['minus', ['get', 'x'], ['get', 'y'] ]
      ]
      ['eq', ['get', 'x'], 7]
      ['eq', ['get', 'y'], 5]
    ]
    chai.expect(thread.solutions.lastOutput).to.eql
      x: 7
      y: 5
      z: 2
    done()
  
  it 'hierarchy', (done) ->
    thread = new Engine.Solver()
    thread.add [
        ['eq', ['get','[x]'],100,'strong']
        ['eq', ['get','[x]'],10,'medium']
        ['eq', ['get','[x]'],1,'weak']
        ['eq', ['get','[y]'],1,'weak']
        ['eq', ['get','[y]'],10,'medium']
        ['eq', ['get','[y]'],101,'strong']
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "[x]": 100
      "[y]": 101
    done()
    
  it 'order of operations', (done) ->
    thread = new Engine.Solver()
    thread.add [
        ['eq', ['get','[w]'], 100,'required']
        ['eq', ['get','[igap]'], 3,'required']
        ['eq', ['get','[ogap]'], 20,'required']
        ['eq', ['get','[md]'], ['divide',['minus',['get','[w]'],['multiply',['get','[ogap]'],2]], 4],'required']
        ['eq', ['get','[span3]'], ['plus',['multiply',['get','[md]'],3],['multiply',['get','[igap]'],2]],'required']
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "[w]": 100
      "[igap]": 3
      "[ogap]": 20
      "[md]": 15
      "[span3]": 51
    done()

  it '$12322[width] == [grid-col]; ...', (done) ->
    thread = new Engine.Solver()
    thread.add [
        ['eq', ['get','$12322[width]'],['get','[grid-col]']]
        ['eq', ['get','$34222[width]'],['get','[grid-col]']]
        ['eq', 100,['get','[grid-col]']]
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "$12322[width]": 100
      "$34222[width]": 100
      "[grid-col]": 100
    done()
  
  it 'Serial Suggests with plus expression', (done) ->
    thread = new Engine.Solver()
    thread.add [
        ['eq', ['plus',['get','[target-width]'],['get','[pad]']], ['get','[actual-width]']]
        ['eq', ['get','[target-width]'],100]
        ['suggest', ['get','[pad]'],1]
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "[target-width]": 100
      "[actual-width]": 101
      "[pad]": 1
    thread.add [
        ['suggest', ['get','[pad]'],2]
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "[actual-width]": 102
      "[pad]": 2    
    thread.add [
        ['suggest', ['get','[pad]'],3]
        ['suggest', ['get','[pad]'],4]
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "[actual-width]": 104
      "[pad]": 4
    done()
  

  it 'intrinsic mock', (done) ->
    thread = new Engine.Solver()
    thread.add [
        ['eq', ['get','[width]'],100, 'weak']
        ['eq', ['get','[width]'],['get','[intrinsic-width]'], 'require']        
        ['suggest', ['get','[intrinsic-width]'], 999]
      ]
    values = thread.solutions.lastOutput
    chai.expect(values).to.eql
      "[width]": 999
      "[intrinsic-width]": 999
    done()
  
  
  it 'intrinsic var is immutable with suggestion', () ->
    #c.trace = true
    thread = new Engine.Solver()
    thread.add [
        ['eq', ['get','[hgap]'],20, 'require']                
        ['eq', ['get','[width]'],['plus',['get','[intrinsic-width]'],['get','[hgap]']],'require']
        ['suggest', ['get','[intrinsic-width]'], 100, 'required']
        ['eq', ['get','[width]'], 20, 'strong']  
      ]
    values = thread.solutions.lastOutput
    chai.expect(values).to.eql
      "[width]": 120
      "[intrinsic-width]": 100
      "[hgap]": 20
    #done()
  
  it 'tracking & removing by get tracker', (done) ->
    thread = new Engine.Solver()
    thread.add [
        ['eq', ['get', '[x]', '', 'x-tracker'],100,'strong']
        ['eq', ['get','[x]'],10,'weak']
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "[x]": 100
    thread.add [
        ['remove', 'x-tracker']
      ]
    chai.expect(thread.solutions.lastOutput).to.eql
      "[x]": 10
    done()
  
    
  # DOM Prop Helpers
  # ---------------------------------------------------------------------
  
  describe 'dom prop helpers', ->
    
    it 'varexp - right', () ->
      thread = new Engine.Solver()
      thread.add [
          ['eq', ['get','$112', '[x]', '.box'],10]
          ['eq', ['get','$112', '[right]','.box'],100]
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$112[x]": 10
        "$112[width]": 90
        
    it 'varexp - center-x', () ->
      thread = new Engine.Solver()
      thread.add [
          ['eq', ['get', '$112', '[x]','.box'],10]
          ['eq', ['get','$112','[center-x]','.box'],110]
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$112[x]": 10
        "$112[width]": 200
        
    it 'varexp - bottom', () ->
      thread = new Engine.Solver()
      thread.add [
          ['eq', ['get','$112','[height]','.box'],10]
          ['eq', ['get','$112','[bottom]','.box'],100]
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$112[height]": 10
        "$112[y]": 90
        
    it 'varexp - center-y', () ->
      thread = new Engine.Solver()
      thread.add [
          ['eq', ['get', '$112', '[height]', '.box'],100]
          ['eq', ['get', '$112', '[center-y]','.box'],51]
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$112[height]": 100
        "$112[y]": 1
    
    
  
  # Tracking
  # ---------------------------------------------------------------------
  
  describe 'Tracking', ->
    
    it 'tracking by path', () ->
      thread = new Engine.Solver()
      thread.add [
          ['eq', ['get', '$222', '[line-height]'], 1.6]
          ['eq', ['get', '$112', '[x]','.box'],10]
          ['eq', ['get', '$112', '[right]','.box'],100]
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$222[line-height]": 1.6
        "$112[x]": 10
        "$112[width]": 90
      thread.add [
          ['remove', '.box']
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$112[x]": null
        "$112[width]": null
    
    
    it 'tracking by selector', () ->
      thread = new Engine.Solver()
      thread.add [
          ['eq', ['get','$112', '[x]', '.big-box'],1000]
          ['eq', ['get','$112', '[x]', '.box'],50,'strong']
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$112[x]": 1000
      thread.add [
          ['remove', '.big-box']
        ]
      expect(thread.solutions.lastOutput).to.eql
        "$112[x]": 50

  

