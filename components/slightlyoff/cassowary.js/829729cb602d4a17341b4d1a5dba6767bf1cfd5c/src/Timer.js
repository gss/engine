// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.Timer = c.inherit({
  initialize: function() {
    this.isRunning = false;
    this._elapsedMs = 0;
  },

  start: function() {
    this.isRunning = true;
    this._startReading = new Date();
    return this;
  },

  stop: function() {
    this.isRunning = false;
    this._elapsedMs += (new Date()) - this._startReading;
    return this;
  },

  reset: function() {
    this.isRunning = false;
    this._elapsedMs = 0;
    return this;
  },

  elapsedTime : function() {
    if (!this.isRunning) {
      return this._elapsedMs / 1000;
    } else {
      return (this._elapsedMs + (new Date() - this._startReading)) / 1000;
    }
  },
});

})(this["c"]||module.parent.exports||{});
