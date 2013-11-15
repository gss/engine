var thread;

thread = new Thread();

self.onmessage = function(m) {
  thread.postMessage(m.data);
  return self.postMessage({
    values: thread.getValues()
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
