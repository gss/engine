// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.EditInfo = c.inherit({
  initialize: function(cn      /*c.Constraint*/,
                       eplus   /*c.SlackVariable*/,
                       eminus  /*c.SlackVariable*/,
                       prevEditConstant /*double*/,
                       i /*int*/) {
    this.constraint = cn;
    this.editPlus = eplus;
    this.editMinus = eminus;
    this.prevEditConstant = prevEditConstant;
    this.index = i;
  },
  toString: function() {
    return "<cn=" + this.constraint +
           ", ep=" + this.editPlus +
           ", em=" + this.editMinus +
           ", pec=" + this.prevEditConstant +
           ", index=" + this.index + ">";
  }
});

})(this["c"]||module.parent.exports||{});
