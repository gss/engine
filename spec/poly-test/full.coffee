HTML = """
    <style scoped>
      header {
        background: orange;
        height: 50px;
      }

      main {
        background: yellow;
        height: 100px;
        z-index: 10;
      }

      footer {
        background: red;
        width: 10px;
        height: 20px;
      }

      aside {
        background: blue;
        width: 100px;
      }

      ul li {
        list-style: none;
        background: green;
        top: 5px;
      }
    </style>
    <style type="text/gss">
      // plural selectors can be used as singular, a la jQ
      [left-margin] == (main)[right];

      // global condition with nested rules
      @if (#main)[top] > 50 {
        main {
          background: red;
        }
      } @else {
        main {
          background: yellow;
        }
      }
      header {
        ::[left] == 0;
        //// condition inside css rule
        @if (::scope[intrinsic-width] > ::scope[intrinsic-height]) {
          ::[width] == ::scope[intrinsic-width] / 4;
        } @else {
          ::[width] == ::scope[intrinsic-width] / 2;
        }
      }
      footer {
        ::[top] == (main)[height]; 
        ::[height] == ::scope[intrinsic-height] * 2;
      }

      aside {
        ::[left] == (main)[right];
        ::[height] == 100;
        ::[top] == (header)[intrinsic-height] + (header)[intrinsic-y];
      }

      main {
        // Bind things to scroll position
        ::[top] == ::scope[scroll-top] + (header)[intrinsic-y];
        ::[width] == (aside)[intrinsic-width];
        ::[left] == (header)[right];

        // use intrinsic-height to avoid binding. Should be:
        // height: :window[height] - (header)[height];
        ::[height] == ::scope[intrinsic-height] - (header)[intrinsic-height];
      }
      // Custom combinators
      ul li !~ li {

        ::[height] == 30;
        
        // FIXME: Regular css style is never removed (needs specificity sorting and groupping);
        background-color: yellowgreen;
      }

      // Chains
      ul li {
        // justify by using variable
        ::[width] == [li-width];

        (&:previous)[right] == &[left];
        (&:last)[right] == ::scope[intrinsic-width] - 16;
        (&:first)[left] == 0;
      }
    </style>


    <header id="header"></header>
    <main id="main">
      <ul>
        <li id="li1">1</li>
        <li id="li2">2</li>
        <li id="li3">3</li>
      </ul>
    </main>
    <aside id="aside"></aside>
    <footer id="footer"></footer>
"""
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


describe 'Full page tests', -> 

  it 'should kompute', (done) ->
    container = document.createElement('div')
    container.style.height = '480px'
    container.style.width = '640px'
    container.style.position = 'absolute'
    container.style.overflow = 'auto'
    container.style.left = 0
    container.style.top = 0
    $('#fixtures').appendChild container

    window.$engine = engine = new GSS(container)
    container.innerHTML = HTML
    engine.then (solution) ->
      console.log(solution)
      done()
