var Query, arrayAddsRemoves;

arrayAddsRemoves = function(old, neu) {
  var adds, n, o, removes, _i, _j, _len, _len1;
  adds = [];
  removes = [];
  for (_i = 0, _len = neu.length; _i < _len; _i++) {
    n = neu[_i];
    if (old.indexOf(n) === -1) {
      adds.push(n);
    }
  }
  for (_j = 0, _len1 = old.length; _j < _len1; _j++) {
    o = old[_j];
    if (neu.indexOf(o) === -1) {
      removes.push(o);
    }
  }
  return {
    adds: adds,
    removes: removes
  };
};

Query = (function() {
  Query.prototype.isQuery = true;

  function Query(o) {
    if (o == null) {
      o = {};
    }
    this.selector = o.selector || (function() {
      throw new Error("GssQuery must have a selector");
    })();
    this.createNodeList = o.createNodeList || (function() {
      throw new Error("GssQuery must implement createNodeList()");
    })();
    this.isMulti = o.isMulti || false;
    this.isLive = o.isLive || false;
    this.ids = o.ids || [];
    this.lastAddedIds = [];
    this.lastRemovedIds = [];
    this.lastLocalRemovedIds = [];
    this.update();
    this;
  }

  Query.prototype._updated_once = false;

  Query.prototype.changedLastUpdate = false;

  Query.prototype.update = function() {
    var adds, el, id, newIds, oldIds, removes, _i, _len, _ref, _ref1;
    this.changedLastUpdate = false;
    if (!this.isLive || !this._updated_once) {
      this.nodeList = this.createNodeList();
    }
    oldIds = this.ids;
    newIds = [];
    _ref = this.nodeList;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      id = GSS.setupId(el);
      newIds.push(id);
    }
    _ref1 = arrayAddsRemoves(oldIds, newIds), adds = _ref1.adds, removes = _ref1.removes;
    if (adds.length > 0) {
      this.changedLastUpdate = true;
    }
    this.lastAddedIds = adds;
    if (removes.length > 0) {
      this.changedLastUpdate = true;
    }
    this.lastRemovedIds = removes;
    this.ids = newIds;
    return this;
  };

  return Query;

})();

module.exports = Query;
