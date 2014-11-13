
expect = chai.expect
assert = chai.assert

describe 'Cassowary Thread', ->
  it 'should instantiate', ->
    thread = new GSS
  it '[x]==7; [y]==5; [x] - [y] == [z] // z is 2', (done) ->
    thread = new GSS
    thread.solve [
      ['==',
        ['get', 'z'],
        ['-', ['get', 'x'], ['get', 'y'] ]
      ]
      ['==', ['get', 'x'], 7]
      ['==', ['get', 'y'], 5]
    ]
    chai.expect(thread.values).to.eql
      x: 7
      y: 5
      z: 2
    done()
  
  it 'hierarchy', (done) ->
    thread = new GSS
    thread.solve [
        ['==', ['get','x'],100,'strong']
        ['==', ['get','x'],10,'medium']
        ['==', ['get','x'],1,'weak']
        ['==', ['get','y'],1,'weak']
        ['==', ['get','y'],10,'medium']
        ['==', ['get','y'],101,'strong']
      ]
    chai.expect(thread.values).to.eql
      "x": 100
      "y": 101
    done()
    
  it 'order of operations', (done) ->
    thread = new GSS
    thread.solve [
        ['==', ['get','w'], 100,'required']
        ['==', ['get','igap'], 3,'required']
        ['==', ['get','ogap'], 20,'required']
        ['==', ['get','md'], ['/',['-',['get','w'],['*',['get','ogap'],2]], 4],'required']
        ['==', ['get','span3'], ['+',['*',['get','md'],3],['*',['get','igap'],2]],'required']
      ]
    chai.expect(thread.values).to.eql
      "w": 100
      "igap": 3
      "ogap": 20
      "md": 15
      "span3": 51
    done()

  it '$12322[width] == [grid-col]; ...', (done) ->
    thread = new GSS
    thread.solve [
        ['==', ['get','$12322[width]'],['get','grid-col']]
        ['==', ['get','$34222[width]'],['get','grid-col']]
        ['==', 100,['get','grid-col']]
      ]
    chai.expect(thread.values).to.eql
      "$12322[width]": 100
      "$34222[width]": 100
      "grid-col": 100
    done()
  
  it 'Serial Suggests with plus expression', (done) ->
    thread = new GSS
      pad: 1
    thread.solve [
        ['==', ['+',['get','target-width'],['get','pad']], ['get','actual-width']]
        ['==', ['get','target-width'],100]
      ]
    chai.expect(thread.values).to.eql
      "target-width": 100
      "actual-width": 101

    thread.solve 
      pad: 2
    chai.expect(thread.updated.solution).to.eql
      "actual-width": 102
    thread.solve 
      pad: 4
    chai.expect(thread.updated.solution).to.eql
      "actual-width": 104
    done()
  

  it 'intrinsic mock', (done) ->
    thread = new GSS
      'intrinsic-width': 999

    thread.solve [
        ['==', ['get','width'],100, 'weak']
        ['==', ['get','width'],['get','intrinsic-width'], 'require']
      ]
    chai.expect(thread.values).to.eql
      "width": 999
    done()
  
  it 'intrinsic var is immutable with suggestion', () ->
    #c.trace = true
    thread = new GSS
      'intrinsic-width': 100
    thread.solve [
        ['==', ['get','hgap'], 20, 'required']                
        ['==', ['get','width'],['+',['get','intrinsic-width'],['get','hgap']],'required']
        ['==', ['get','width'], 20, 'strong']  
      ]
    chai.expect(thread.values).to.eql
      "width": 120
      "hgap": 20
    #done()
  
  it 'tracking & removing by get tracker', (done) ->
    thread = new GSS()
    thread.solve [
        ['==', ['get', 'x', '', 'x-tracker'],100,'strong']
        ['==', ['get','x'],10,'weak']
      ]
    chai.expect(thread.values).to.eql
      "x": 100
    thread.solve ['remove', 'x-tracker']
    chai.expect(thread.values).to.eql
      "x": 10
    done()
  
    
    describe 'simulated cropping demo', ->
      
      thread = new Thread {
        defaultStrength: "weak"
      }
      
      it 'initial layout', () ->        
        thread.execute
          commands:[
            # window            
            ['suggest',['get','[window]'],1000,'require']
            
            # weak layout
            ['eq',['get','[frame-w]'],['divide',['get','[window]'],10],'weak']
            ['eq',['get','[frame-h]'],['divide',['get','[window]'],10],'weak']           
            
            # cropping
            # -----------------------------------
            
            # stays            
            ['stay',['get','[frame-w]'],'strong']
            ['stay',['get','[frame-h]'],'strong']            
            
            # required 2x1 landscape aspect ratio
            ['eq',['get','[bg-w]'],['multiply',['get','[bg-h]'],2],'require']
            
            # bg weakly is size of frame
            ['eq',['get','[frame-w]'],['get','[bg-w]'],'weak']
            ['eq',['get','[frame-h]'],['get','[bg-h]'],'weak']
            
            # bg required to cover frame
            ['lte',['get','[frame-w]'],['get','[bg-w]'],'require']
            ['lte',['get','[frame-h]'],['get','[bg-h]'],'require']            
          ]          
        expect(thread.getValues()).to.eql
          "[window]": 1000
          "[frame-w]": 100
          "[frame-h]": 100
          "[bg-w]": 200
          "[bg-h]": 100
          
      it 'screensize changes', () ->        
        thread.execute
          commands:[
            # window
            ['suggest',['get','[window]'],2000,'require']           
          ]          

        expect(thread.getValues()).to.eql
          "[window]": 2000
          "[frame-w]": 200
          "[frame-h]": 200
          "[bg-w]": 400
          "[bg-h]": 200
      
  
  
  
  # DOM Prop Helpers
  # ---------------------------------------------------------------------
  
  describe 'dom prop helpers', ->
    
    it 'varexp - right', () ->
      thread = new GSS()
      thread.solve [
          ['==', ['get','$112', 'x', '.box'],10]
          ['==', ['get','$112', 'right','.box'],100]
        ]
      expect(thread.values).to.eql
        "$112[x]": 10
        "$112[width]": 90
        
    it 'varexp - center-x', () ->
      thread = new GSS()
      thread.solve [
          ['==', ['get', '$112', 'x','.box'],10]
          ['==', ['get','$112','center-x','.box'],110]
        ]
      expect(thread.values).to.eql
        "$112[x]": 10
        "$112[width]": 200
        
    it 'varexp - bottom', () ->
      thread = new GSS()
      thread.solve [
          ['==', ['get','$112','height','.box'],10]
          ['==', ['get','$112','bottom','.box'],100]
        ]
      expect(thread.values).to.eql
        "$112[height]": 10
        "$112[y]": 90
        
    it 'varexp - center-y', () ->
      thread = new GSS()
      thread.solve [
          ['==', ['get', '$112', 'height', '.box'],100]
          ['==', ['get', '$112', 'center-y','.box'],51]
        ]
      expect(thread.values).to.eql
        "$112[height]": 100
        "$112[y]": 1
    
    
  
  # Tracking
  # ---------------------------------------------------------------------
  
  describe 'Tracking', ->
    
    it 'tracking by path', () ->
      thread = new GSS(document.createElement('div'))
      thread.solve [
          ['==', ['get', '$222', 'line-height'], 1.6]
          ['==', ['get', '$112', 'x','.box'],10]
          ['==', ['get', '$112', 'right','.box'],100]
        ]
      expect(thread.updated.solution).to.eql
        "$222[line-height]": 1.6
        "$112[x]": 10
        "$112[width]": 90

      thread.solve ['remove', '.box']

      expect(thread.updated.solution).to.eql
        "$112[x]": null
        "$112[width]": null
    
    
    it 'tracking by selector', () ->
      thread = new GSS()
      thread.solve [
          ['==', ['get','$112', 'x', '.big-box'],1000, 'required']
          ['==', ['get','$112', 'x', '.box'],50,'strong']
        ]
      expect(thread.updated.solution).to.eql
        "$112[x]": 1000
      thread.solve [
          ['remove', '.big-box']
        ]
      expect(thread.updated.solution).to.eql
        "$112[x]": 50

  

