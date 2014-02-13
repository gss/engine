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



describe 'End - to - End', ->
  
  engine = null
  container = null
  
  beforeEach ->
    engine = GSS.engines.root
    container = document.createElement 'div'
    $('#fixtures').appendChild container
    

  afterEach ->
    remove(container)
    
  
  
  describe 'default Strength with GSS.config', ->
    
    it 'should compute', (done) ->
      oldDefault = GSS.config.defaultStrength
      GSS.config.defaultStrength = "strong"
      
      listen = (e) ->     
        expect(engine.vars).to.eql 
          "[m]": 2
        GSS.config.defaultStrength = oldDefault
        done()     
                     
      engine.once 'solved', listen
    
      container.innerHTML =  """
          <style type="text/gss">
          [m] == 1;
          [m] == 2;
          [m] == 3;
          </style>
        """
  
  
  
  describe 'Loading external sheet', ->
    
    it 'should compute', (done) ->
      oldDefault = GSS.config.defaultStrength
      GSS.config.defaultStrength = "strong"
      
      listen = (e) ->     
        expect(engine.vars).to.eql 
          "[external-file]": 1000
        GSS.config.defaultStrength = oldDefault
        done()     
                     
      engine.once 'solved', listen
    
      container.innerHTML =  """
          <link rel="stylesheet" type="text/gss" href="./fixtures/external-file.gss"></link>
        """
  
  
     
  
  describe 'flat @if @else w/o queries', ->
  
    it 'should compute values', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.eql 
          "[t]": 500
          "[x]": 1
        done()     
                     
      engine.once 'solved', listen
    
      container.innerHTML =  """
          <style type="text/gss">
          [t] == 500;
        
          @if [t] >= 960 {          
            [x] == 96;
          }

          @else {  
            [x] == 1;  
          }
          </style>
        """
  
  describe 'top level @if @else w/ queries', ->
  
    it 'should compute values', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.eql 
          "[t]": 500
          "$b[width]": 1
        done()          
        engine.off 'solved', listen                    
    
      container.innerHTML =  """
          <div id="b"></div>
          <style type="text/gss">
          [t] == 500;
        
          @if [t] >= 960 {
          
            #b {
              width: == 100;
            }

          }

          @else {
  
            #b {
              width: == 1;
            }
  
          }
          </style>
        """
      engine.once 'solved', listen
      
  
  describe 'top level @if @else w/ complex queries', ->
  
    it 'should be ok', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.be.ok
        done()          
      
      container.innerHTML =  """
          <div class="section"></div>
          <div class="section"></div>
          <style type="text/gss">
          [Wwin] == 1000;

          @if [Wwin] > 960 {

            .section {
              height: == ::[intrinsic-height];
              right: == ::window[right] - 100;
              left: == ::window[left] + 100;
              top:>= ::window[top];
            }

          }

          @else {
  
            .section {
              height: == ::[intrinsic-height];
              right: == ::window[right] - 10;
              left: == ::window[left] + 10;
              top:>= ::window[top];
            }
  
          }
          </style>
        """
      engine.once 'solved', listen
  
  describe 'simple VFL', ->
  
    it 'should compute values', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.eql
          "$s1[x]":100
          "$s1[width]":10
          "$s2[width]":10
          "$s2[x]":210
          
        done()          
    
      container.innerHTML =  """
          <div id="s1"></div>
          <div id="s2"></div>
          <style type="text/gss">
          
          #s1[x] == 100;
          @horizontal [#s1(==10)]-[#s2(==10)] gap(100);
          
          </style>
        """
      engine.once 'solved', listen
  
  describe 'top level @if @else w/ nested VFLs', ->
  
    it 'should compute values', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.eql
          "[Wwin]":100
          "$s1[x]":50
          "$s1[width]":1
          "$s2[width]":1
          "$s2[x]":56         
        done()          
    
      container.innerHTML =  """
          <div id="s1"></div>
          <div id="s2"></div>
          <style type="text/gss">
          [Wwin] == 100;          
          
          @if [Wwin] > 960 {
                        
            #s1[x] == 100;
            @horizontal [#s1(==10)]-[#s2(==10)] gap(100);

          }

          @else {
  
            #s1[x] == 50;
            @horizontal [#s1(==1)]-[#s2(==1)] gap(5);
  
          }
          </style>
        """
      engine.once 'solved', listen    
  
  
  describe '@if @else w/ dynamic VFLs', ->
  
    it 'should compute values', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.eql
          "$container[width]": 100,
          "$s1[height]": 100,
          "$s2[height]": 100,
          "$s1[width]": 100,
          "$s2[width]": 100,
          "$s1[x]": 0,
          "$s2[x]": 100,
          "$s1[y]": 0,
          "$s2[y]": 0          
   
        done()          
    
      container.innerHTML =  """
          <div id="s1" class="section"></div>
          <div id="s2" class="section"></div>
          <div id="container"></div>
          <style type="text/gss">

          #container {
            width: == 100;
          }
          .section {
            height: == 100;
            width: == 100;
            x: >= 0;
            y: >= 0;
          }       
          
          @if #container[width] > 960 {
            
            @vertical .section;     

          }
          
          @else {
            @horizontal .section;     
          }


          </style>
        """
      engine.once 'solved', listen  


  describe '[::] VFLs', ->
  
    it 'should compute', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.eql      
          "$s1[x]": 20,
          "$container[x]": 10,
          "$s2[x]": 20,
          "$container[width]": 100,
          "$s1[width]": 80,
          "$s2[width]": 80     
        done()          
    
      container.innerHTML =  """
          <div id="s1" class="section"></div>
          <div id="s2" class="section"></div>
          <div id="container"></div>
          <style type="text/gss">                        
                      
            .section {
              @horizontal |-[::this]-| gap(10) in(#container);
            }
            
            #container {
              x: == 10;
              width: == 100;
            }                        
  
          </style>
        """
      engine.once 'solved', listen    
      

  describe '[::] VFLs II', ->
  
    it 'should compute', (done) ->
      listen = (e) ->     
        expect(engine.vars).to.eql      
          "$s1[x]": 20,
          "$container[x]": 10,
          "$s2[x]": 20,
          "$container[width]": 100,
          "$s1[width]": 80,
          "$s2[width]": 80     
        done()          
    
      container.innerHTML =  """
          <div id="s1" class="section"></div>
          <div id="s2" class="section"></div>
          <div id="container"></div>
          <style type="text/gss">                        
            
            #container {
              x: == 10;
              width: == 100;
            } 
                     
            .section {
              @horizontal |-[::this]-| gap(10) in(#container);
            }                                           
  
          </style>
        """
      engine.once 'solved', listen    