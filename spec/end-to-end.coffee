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
    
  it 'flat @if @else w/o queries', (done) ->
    listen = (e) ->     
      expect(engine.vars).to.eql 
        "[t]": 500
        "[x]": 1
      done()     
      engine.off 'solved', listen
                     
    engine.on 'solved', listen
    
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
  
  it 'top level @if @else w/ queries', (done) ->
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
    engine.on 'solved', listen