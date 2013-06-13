var w;

w = new Thread();

self.onmessage = function(m) {
  var ast;
  ast = m.data.ast;
  w.unparse(ast);
  return self.postMessage({
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
