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
          "[Wwin]": 100
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