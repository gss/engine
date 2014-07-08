Thread = GSS.Thread

expect = chai.expect
assert = chai.assert

describe 'Cassowary Thread', ->
  it 'should instantiate', ->
    thread = new Thread()
  it '[x]==7; [y]==5; [x] - [y] == [z] // z is 2', (done) ->
    thread = new Thread()
    thread.execute
      commands:
        [
          ['eq',
            ['get', 'z'],
            ['minus', ['get', 'x'], ['get', 'y'] ]
          ]
          ['eq', ['get', 'x'], ['number', 7]]
          ['eq', ['get', 'y'], ['number', 5]]
        ]
    chai.expect(thread.getValues()).to.eql
      x: 7
      y: 5
      z: 2
    done()
  
  it 'hierarchy', (done) ->
    thread = new Thread()
    thread.execute
      commands:[
        ['eq', ['get','[x]'],['number','100'],'strong']
        ['eq', ['get','[x]'],['number','10'],'medium']
        ['eq', ['get','[x]'],['number','1'],'weak']
        ['eq', ['get','[y]'],['number','1'],'weak']
        ['eq', ['get','[y]'],['number','10'],'medium']
        ['eq', ['get','[y]'],['number','101'],'strong']
      ]
    values = thread.getValues()
    chai.expect(values).to.eql
      "[x]": 100
      "[y]": 101
    done()
    
  it 'order of operations', (done) ->
    thread = new Thread()
    thread.execute
      commands:[
        ['eq', ['get','[w]'],['number','100'],'required']
        ['eq', ['get','[igap]'],['number','3'],'required']
        ['eq', ['get','[ogap]'],['number','20'],'required']
        ['eq', ['get','[md]'], ['divide',['minus',['get','[w]'],['multiply',['get','[ogap]'],2]]  ,['number','4']],'required']
        ['eq', ['get','[span3]'], ['plus',['multiply',['get','[md]'],3],['multiply',['get','[igap]'],2]],'required']
      ]
    values = thread.getValues()
    chai.expect(values).to.eql
      "[w]": 100
      "[igap]": 3
      "[ogap]": 20
      "[md]": 15
      "[span3]": 51
    done()

  it '$12322[width] == [grid-col]; ...', (done) ->
    thread = new Thread()
    thread.execute
      commands:[
        ['eq', ['get','$12322[width]'],['get','[grid-col]']]
        ['eq', ['get','$34222[width]'],['get','[grid-col]']]
        ['eq', ['number','100'],['get','[grid-col]']]
      ]
    chai.expect(thread.getValues()).to.eql
      "$12322[width]": 100
      "$34222[width]": 100
      "[grid-col]": 100
    done()
  
  it 'Serial Suggests with plus expression', (done) ->
    thread = new Thread()
    thread.execute
      commands:[
        ['eq', ['plus',['get','[target-width]'],['get','[pad]']], ['get','[actual-width]']]
        ['eq', ['get','[target-width]'],['number',100], 'required']
        ['suggest', ['get','[pad]'],1]
      ]
    chai.expect(thread.getValues()).to.eql
      "[target-width]": 100
      "[actual-width]": 101
      "[pad]": 1
    thread.execute
      commands:[
        ['suggest', ['get','[pad]'],2]
      ]
    chai.expect(thread.getValues()).to.eql
      "[target-width]": 100
      "[actual-width]": 102
      "[pad]": 2    
    thread.execute
      commands:[
        ['suggest', ['get','[pad]'],3]
        ['suggest', ['get','[pad]'],4]
      ]
    chai.expect(thread.getValues()).to.eql
      "[target-width]": 100
      "[actual-width]": 104
      "[pad]": 4
    done()
  

  it 'intrinsic mock', (done) ->
    thread = new Thread()
    thread.execute
      commands:[
        ['eq', ['get','[width]'],['number','100'], 'weak']
        ['eq', ['get','[width]'],['get','[intrinsic-width]'], 'require']        
        ['suggest', ['get','[intrinsic-width]'], ['number','999']]
      ]
    values = thread.getValues()
    chai.expect(values).to.eql
      "[width]": 999
      "[intrinsic-width]": 999
    done()
  
  it 'intrinsic var is immutable with suggestion', () ->
    #c.trace = true
    thread = new Thread()
    thread.execute
      commands:[
        ['var', '[width]']
        ['var', '[intrinsic-width]']
        ['var', '[hgap]']
        ['eq', ['get','[hgap]'],['number',20], 'require']                
        ['eq', ['get','[width]'],['plus',['get','[intrinsic-width]'],['get','[hgap]']],'require']
        ['suggest', ['get','[intrinsic-width]'], ['number',100], 'required']
        ['eq', ['get','[width]'], ['number',20], 'strong']  
      ]
    values = thread.getValues()
    chai.expect(values).to.eql
      "[width]": 120
      "[intrinsic-width]": 100
      "[hgap]": 20
    #done()    
    
  
  
  # Stays
  # ---------------------------------------------------------------------
  
  describe 'Stays', ->
    
    describe 'basic stays w/ strength', ->
      
      thread = new Thread {
        defaultStrength: "weak"
      }
      
      it 'layout setup', () ->        
        thread.execute
          commands:[
            
            # window  
            ['suggest',['get','[window]'],1000,'require']
            
            # weak layout
            ['eq',['get','[frame-w]'],['divide',['get','[window]'],10],'weak']
            ['eq',['get','[frame-h]'],['divide',['get','[window]'],10],'weak']            
            
            # strong stays
            ['stay',['get','[frame-w]'],'strong']
            ['stay',['get','[frame-h]'],'strong']                        
            
            # ignored b/c of stays
            ['eq',['get','[frame-w]'],999,'medium']
            ['eq',['get','[frame-h]'],999,'medium']
            ['eq',['get','[frame-w]'],999,'medium']
            ['eq',['get','[frame-h]'],999,'medium']
            ['eq',['get','[frame-w]'],999,'medium']
            ['eq',['get','[frame-h]'],999,'medium']
            ['eq',['get','[frame-w]'],999,'medium']
            ['eq',['get','[frame-h]'],999,'medium']
            
          ]
        expect(thread.getValues()).to.eql
          "[window]": 1000
          "[frame-w]": 100
          "[frame-h]": 100
    
    describe 'async stays w/ strengths', ->
      
      thread = new Thread {
        defaultStrength: "weak"
      }
      
      it 'step 1: no stays', () ->        
        thread.execute
          commands:[
            ['eq',['get','[frame-w]'],100]
            ['eq',['get','[frame-h]'],100]
          ]
        expect(thread.getValues()).to.eql
          "[frame-w]": 100
          "[frame-h]": 100
      
      it 'step 2: stays', () ->        
        thread.execute
          commands:[
            ['stay',['get','[frame-w]'],'strong']
            ['stay',['get','[frame-h]']]
            ['eq',['get','[frame-w]'],['get','[bg-w]'],'require']
            ['eq',['get','[frame-h]'],['get','[bg-h]'],'require']
            ['eq',['get','[frame-w]'],1000,'strong']
            ['eq',['get','[frame-h]'],1000,'strong']
          ]
        expect(thread.getValues()).to.eql
          "[frame-w]": 100
          "[frame-h]": 1000
          "[bg-w]": 100
          "[bg-h]": 1000
      
      it 'step 3: weak suggests', () ->        
        thread.execute
          commands:[            
            ['suggest',['get','[frame-w]'],200,'weak']
            ['suggest',['get','[frame-h]'],200,'weak']
          ]
        
        expect(thread.getValues()).to.eql
          "[frame-w]": 200
          "[frame-h]": 1000
          "[bg-w]": 200
          "[bg-h]": 1000
    
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
          
      #it 'screensize changes', () ->        
      #  thread.execute
      #    commands:[
      #      # window
      #      ['suggest',['get','[window]'],2000,'require']           
      #    ]          
      #
      #  expect(thread.getValues()).to.eql
      #    "[window]": 2000
      #    "[frame-w]": 200
      #    "[frame-h]": 200
      #    "[bg-w]": 400
      #    "[bg-h]": 200
  
  
  #describe 'Scoped Commands', ->
  #
  #  describe 'PENDING: simulated cropping demo', ->
  #    
  #    thread = new Thread {
  #      defaultStrength: "weak"
  #    }
  #    
  #    it 'initial layout', () ->        
  #      thread.execute
  #        commands:[
  #          # window            
  #          ['suggest',['get','[window]'],1000,'require']
  #          
  #          # weak layout
  #          ['eq',['get','[frame-w]'],['divide',['get','[window]'],10],'weak']
  #          ['eq',['get','[frame-h]'],['divide',['get','[window]'],10],'weak']           
  #          
  #          # cropping
  #          # -----------------------------------
  #          
  #          ['$scope',             
  #            
  #            '$frame', # scope id
  #                          
  #            [ # commands
  #            
  #              # import vars?
  #              #['stay',['get','[frame-w]'],'strong']
  #              #['stay',['get','[frame-h]'],'strong']            
  #          
  #              # required 2x1 landscape aspect ratio
  #              ['eq',['get','[bg-w]'],['multiply',['get','[bg-h]'],2],'require']
  #          
  #              # bg weakly is size of frame
  #              ['eq',['get','[frame-w]'],['get','[bg-w]'],'weak']
  #              ['eq',['get','[frame-h]'],['get','[bg-h]'],'weak']
  #          
  #              # bg required to cover frame
  #              ['lte',['get','[frame-w]'],['get','[bg-w]'],'require']
  #              ['lte',['get','[frame-h]'],['get','[bg-h]'],'require']
  #            ]
  #          ]         
  #        ]          
  #      expect(thread.getValues()).to.eql
  #        "[window]": 1000
  #        "[frame-w]": 100
  #        "[frame-h]": 100
  #        "[bg-w]": 200
  #        "[bg-h]": 100
  #        
  #    it 'screensize changes 1', () ->        
  #      thread.execute
  #        commands:[
  #          # window
  #          ['suggest',['get','[window]'],2000,'require']           
  #        ]          
  #
  #      expect(thread.getValues()).to.eql
  #        "[window]": 2000
  #        "[frame-w]": 200
  #        "[frame-h]": 200
  #        "[bg-w]": 400
  #        "[bg-h]": 200
  #    
  #    it 'screensize changes 2', () ->        
  #      thread.execute
  #        commands:[
  #          # window
  #          ['suggest',['get','[window]'],100,'require']           
  #        ]          
  #
  #      expect(thread.getValues()).to.eql
  #        "[window]": 100
  #        "[frame-w]": 10
  #        "[frame-h]": 10
  #        "[bg-w]": 20
  #        "[bg-h]": 10
  #    
  #
  
  
  # DOM Prop Helpers
  # ---------------------------------------------------------------------
  
  describe 'dom prop helpers', ->
    
    it 'varexp - right', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get$','x','$112','.box'],['number','10']]
          ['eq', ['get$','right','$112','.box'],['number','100']]
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 10
        "$112[width]": 90
        
    it 'varexp - center-x', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get$','x','$112','.box'],['number','10']]
          ['eq', ['get$','center-x','$112','.box'],['number','110']]
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 10
        "$112[width]": 200
        
    it 'varexp - bottom', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get$','height','$112','.box'],['number','10']]
          ['eq', ['get$','bottom','$112','.box'],['number','100']]
        ]
      expect(thread.getValues()).to.eql
        "$112[height]": 10
        "$112[y]": 90
        
    it 'varexp - center-y', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get$','height','$112','.box'],['number','100']]
          ['eq', ['get$','center-y','$112','.box'],['number','51']]
        ]
      expect(thread.getValues()).to.eql
        "$112[height]": 100
        "$112[y]": 1
    
    it 'varexp - right', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get$','x','$112','.box'],['number','10']]
          ['eq', ['get$','right','$112','.box'],['number','100']]
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 10
        "$112[width]": 90
    
    
  
  # Tracking
  # ---------------------------------------------------------------------
  
  describe 'Tracking', ->
    
    it 'tracking by id', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get$','line-height','$222'],['number','1.6']]
          ['eq', ['get$','x','$112','.box'],['number','10']]
          ['eq', ['get$','right','$112','.box'],['number','100']]
        ]
      expect(thread.getValues()).to.eql
        "$222[line-height]": 1.6
        "$112[x]": 10
        "$112[width]": 90
      thread.execute
        commands:[
          ['remove', '$112']
        ]
      expect(thread.getValues()).to.eql
        "$222[line-height]": 1.6
    
    it 'tracking & removing by get tracker', (done) ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get','[x]','x-tracker'],['number','100'],'strong']
          ['eq', ['get','[x]'],['number','10'],'weak']
        ]
      chai.expect(thread.getValues()).to.eql
        "[x]": 100
      thread.execute
        commands:[
          ['remove', 'x-tracker']
        ]
      chai.expect(thread.getValues()).to.eql
        "[x]": 10
      done()
  
    it 'tracking & removing by var tracker', (done) ->
      thread = new Thread()
      thread.execute
        commands:[
          ['var', '[x]', 'x-tracker']
          ['eq', ['get','[x]'],['number','100'],'strong']
          ['eq', ['get','[x]'],['number','10'],'weak']
          ['eq', ['get','[y]'],['number','50'],'strong']
        ]
      chai.expect(thread.getValues()).to.eql
        "[x]": 100
        "[y]": 50
      thread.execute
        commands:[
          ['remove', 'x-tracker']
        ]
      chai.expect(thread.getValues()).to.eql
        "[y]": 50
      done()
    
    describe 'add & remove inter-related, repeat x3', () ->
      thread = new Thread()
      for i in [1,2,3]
        it "pass # #{i}", ->
          thread.execute
            commands:[
              ['eq', ['get$','x','$1','.a'],['get$','x','$2','.a']]
              ['eq', ['get$','x','$2','.a'],['get$','x','$1','.a']]
              ['eq', ['get$','x','$1','.a'],['number','10']]
              ['eq', ['get$','x','$3','.a'],['number','10']]
            ]
          expect(thread.getValues()).to.eql
            "$1[x]": 10
            "$2[x]": 10
            "$3[x]": 10
          thread.execute
            commands:[
              ['remove', '$1']
            ]
          expect(thread.getValues()).to.eql
            "$2[x]": 0
            "$3[x]": 10
    
    describe 'add & remove inter-related w/ varexp, repeat x3', () ->
      thread = new Thread()
      for i in [1,2,3]
        it "pass # #{i}", ->
          thread.execute
            commands:[
              ['eq', ['get','[blah]'],['number','55']]
              ['eq', ['get$','x',    '$modal','#modal'],['number',0]]
              ['eq', ['get$','right','$modal','#modal'],['number',100]]
              ['eq', ['get$','x',    '$button','#button'],['number',0]]              
              ['eq', ['get$','right','$button','#button'],['get$','right','$modal','.modal']]
            ]
          vals = thread.getValues()
          expect(vals).to.eql
            "[blah]": 55
            "$modal[x]": 0
            "$modal[width]": 100
            "$button[x]": 0
            "$button[width]": 100
          thread.execute
            commands:[
              ['remove','$modal','$button','$modal']
            ]
          vals = thread.getValues()
          expect(vals).to.eql
            "[blah]": 55
    
    describe 'add & remove inter-related w/ suggest, repeat x3', () ->
      thread = new Thread()
      for i in [1,2,3]
        it "pass # #{i}", ->
          thread.execute
            commands:[
              ['eq', ['get$','x','$1','.a'],['get$','x','$2','.a']]
              ['eq', ['get$','x','$2','.a'],['get$','x','$1','.a']]
              ['suggest',['get$','x','$1','.a'],['number','10'],"required"]
              ['eq', ['get$','x','$3','.a'],['number','10']]
            ]
          expect(thread.getValues()).to.eql
            "$1[x]": 10
            "$2[x]": 10
            "$3[x]": 10
          thread.execute
            commands:[
              ['remove', '$1']
            ]
          expect(thread.getValues()).to.eql
            "$2[x]": 0
            "$3[x]": 10
    
    describe 'add & remove inter-related w/ suggest & varexp, repeat x3', () ->
      thread = new Thread()
      for i in [1,2,3]
        it "pass # #{i}", ->
          thread.execute
            commands:[
              ['eq', ['get$','x','$1','.a'],['number','0']]
              ['eq', ['get$','x','$2','.a'],['number','0']]
              ['eq', ['get$','x','$3','.a'],['number','0']]
              ['eq', ['get$','right','$1','.a'],['get$','right','$2','.a']]
              ['eq', ['get$','right','$2','.a'],['get$','right','$1','.a']]
              ['suggest',['get$','width','$1','.a'],['number','10'],"required"]
              ['suggest',['get$','width','$3','.a'],['number','10'],"required"]
            ]
          expect(thread.getValues()).to.eql
            "$1[x]": 0
            "$2[x]": 0
            "$3[x]": 0
            "$1[width]": 10
            "$2[width]": 10
            "$3[width]": 10
          thread.execute
            commands:[
              ['remove', '$1','$2']
            ]
          expect(thread.getValues()).to.eql
            "$3[x]": 0
            "$3[width]": 10

    
    it 'tracking by selector', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['get$','x','$112','.big-box'],['number','1000']]
          ['eq', ['get$','x','$112','.box'],['number','50'],'strong']
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 1000
      thread.execute
        commands:[
          ['remove', '.big-box$112']
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 50
    
    it 'tracking constraints with track command', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq',['get$','x','$112','.big-box'],['number','1000'],['track','111']]        
          ['eq', ['get$','x','$112','.box'],['number','50'],'strong',['track','222']]
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 1000
      thread.execute
        commands:[
          ['remove', '111']
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 50
    
    it 'tracking constraints with track command - order independence', () ->
      thread = new Thread()
      thread.execute
        commands:[
          ['eq', ['track','111'],['get$','x','$112','.big-box'],['number','1000']]
          ['eq', ['get$','x','$112','.box'],['number','50'],['track','222'],'strong']
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 1000
      thread.execute
        commands:[
          ['remove', '111']
        ]
      expect(thread.getValues()).to.eql
        "$112[x]": 50
        

  
  # Conditionals
  # ---------------------------------------------------------------------

  describe 'Conditionals', ->
    
    describe 'if else', () ->
      thread = new Thread()
      
      it 'should execute', ->
        thread.execute
          commands:[
            ['eq',['get','[target]'],200,'weak']        
            ['cond',
              ['clause',
                ['?>=',['get','[target]'],100],'if:big']
              ['clause',
                ['?>=',['get','[target]'],50],'if:med']
              ['clause',null,'if:small']
            ]        
            ['eq', ['get$','x','$112','.big-box'],['number','12'],['where','if:small']] 
            ['eq', ['get$','x','$112','.box'],['number','69'],'strong',['where','if:med']]                 
            ['eq', ['get$','x','$112','.box'],['number','1000'],'strong',['where','if:big']]
          ]
        
      it "step 1", ->
        expect(thread.getValues()).to.eql
          '[target]': 200
          "$112[x]": 1000
          
      it "step 2", ->
        thread.execute
          commands:[
            ['suggest', ['get','[target]'],0]
          ]
        expect(thread.getValues()).to.eql
          '[target]': 0
          "$112[x]": 12
          
      it "step 3", ->
        thread.execute
          commands:[
            ['suggest', ['get','[target]'],50]
          ]
        expect(thread.getValues()).to.eql
          '[target]': 50
          "$112[x]": 69      
          
      it "step 4", ->
        thread.execute
          commands:[
            ['suggest', ['get','[target]'],101]
          ]
        expect(thread.getValues()).to.eql
          '[target]': 101
          "$112[x]": 1000
          
  
  # Config
  # ---------------------------------------------------------------------

  describe 'Thread Config', ->
    
    describe 'Default Strength: strong', () ->
      thread = new Thread {
        defaultStrength: "strong"
      }      
        
      it "should execute", ->
        thread.execute
          commands:[
            ['eq',['get','[defaulttester]'],100,'weak']
            ['eq',['get','[defaulttester]'],1]
            ['eq',['get','[defaulttester]'],2]                                    
            ['eq',['get','[defaulttester]'],3]
          ]
          
      it "should solve", ->
        expect(thread.getValues()).to.eql
          '[defaulttester]': 2
    
    describe 'Default Strength: medium', () ->
      thread = new Thread {
        defaultStrength: "medium"
      }      
        
      it "should execute", ->
        thread.execute
          commands:[
            ['eq',['get','[defaulttester]'],100,'weak']
            ['eq',['get','[defaulttester]'],1]
            ['eq',['get','[defaulttester]'],2]                                    
            ['eq',['get','[defaulttester]'],3]
          ]
          
      it "should solve", ->
        expect(thread.getValues()).to.eql
          '[defaulttester]': 2
    
    
    describe 'Default Strength: weak', () ->
      thread = new Thread {
        defaultStrength: "weak"
      }      
        
      it "should execute", ->
        thread.execute
          commands:[
            ['eq',['get','[defaulttester]'],100,'weak']
            ['eq',['get','[defaulttester]'],1]
            ['eq',['get','[defaulttester]'],2]                                    
            ['eq',['get','[defaulttester]'],3]
          ]
          
      it "should solve", ->
        expect(thread.getValues()).to.eql
          '[defaulttester]': 3
        
    
    describe 'Default Weight', () ->
      thread = new Thread {
        defaultStrength: "strong"
        defaultWeight: 100
      }      
        
      it "should execute", ->
        thread.execute
          commands:[
            ['eq',['get','[defaulttester]'],100  ]
            ['eq',['get','[defaulttester]'],1,"strong",10]
            ['eq',['get','[defaulttester]'],2,"strong",10]
          ]
          
      it "should solve", ->
        expect(thread.getValues()).to.eql
          '[defaulttester]': 100
   

