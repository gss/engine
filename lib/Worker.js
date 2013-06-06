var onmessage, w;

importScripts("../vendor/c.js");

importScripts("../lib/Thread.js");

w = new Thread();

onmessage = function(m) {
  var ast;
  ast = m.data.ast;
  w.unparse(ast);
  return postMessage({
    values: w._getValues()
  });
  /*
  if ast isnt null
    #if c.Equation isnt null
    postMessage(
      a: 7
      b: 5
      c: 2
    )
  else
    postMessage(
      a: 1
      b: 1
      c: 1
    )
  */

};
