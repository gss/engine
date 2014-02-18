var thread;

thread = null;

self.onmessage = function(m) {
  var config;
  if (!thread) {
    config = m.data.config || {};
    thread = new Thread(config);
  }
  thread.postMessage(m.data);
  return self.postMessage(thread.output());
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
