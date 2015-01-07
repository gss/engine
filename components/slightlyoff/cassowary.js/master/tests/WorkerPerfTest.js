// Copyright (C) 1998-2000 Greg J. Badros
//
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

var worker = new Worker('workerPerfTask.js');

worker.onmessage = function (e) {
	var d = e.data;
	var type = d[0];

	var dualLog = function (content) {
		// TODO(bitpshr): do we need to domLog and log here? Why?
		// console.log.apply(console, content);
		domLog.apply(null, content);
	};

	if (type === 'log') {
		d.unshift();
		dualLog(d.slice(1));
	}
	if (type === 'logs') { d.slice(1).forEach(dualLog); }
};

// Start the tests
window.addEventListener('load', function () {
	append(el('h2', 'WebWorker perf test results:'));
	// TODO(slightlyoff): pass c.* config to the worker in the init message.
	worker.postMessage(['init']);
});