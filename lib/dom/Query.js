/*

Encapsulates Dom Queries used in GSS rules

JSPerf debunking *big* perf gain from liveNodeLists: 

- http://jsperf.com/getelementsbyclassname-vs-queryselectorall/70
- http://jsperf.com/queryselectorall-vs-getelementsbytagname/77
*/

var LOG, Query, arrayAddsRemoves,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

LOG = function() {
  return GSS.deblog.apply(GSS, ["Query"].concat(__slice.call(arguments)));
};

Query = (function(_super) {
  __extends(Query, _super);

  Query.prototype.isQuery = true;

  function Query(o) {
    if (o == null) {
      o = {};
    }
    Query.__super__.constructor.apply(this, arguments);
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
    LOG("constructor() @", this);
    this;
  }

  Query.prototype._updated_once = false;

  Query.prototype.changedLastUpdate = false;

  Query.prototype.update = function() {
    var adds, el, id, newIds, oldIds, removes, _i, _len, _ref, _ref1;
    LOG("update() @", this);
    if (this.is_destroyed) {
      throw new Error("Can't update destroyed query: " + selector);
    }
    this.changedLastUpdate = false;
    if (!this.isLive || !this._updated_once) {
      this.nodeList = this.createNodeList();
      this._updated_once = true;
    }
    oldIds = this.ids;
    newIds = [];
    _ref = this.nodeList;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      id = GSS.setupId(el);
      if (id) {
        newIds.push(id);
      }
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
    if (this.changedLastUpdate) {
      this.trigger('afterChange');
    }
    return this;
  };

  Query.prototype.forEach = function(callback) {
    var el, _i, _len, _ref, _results;
    _ref = this.nodeList;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      _results.push(callback.call(this, el));
    }
    return _results;
  };

  Query.prototype.first = function() {
    return this.nodeList[0];
  };

  Query.prototype.last = function() {
    return this.nodeList[this.nodeList.length - 1];
  };

  Query.prototype.next = function(el) {
    return this.nodeList[this.indexOf(el) + 1];
  };

  Query.prototype.prev = function(el) {
    return this.nodeList[this.indexOf(el) - 1];
  };

  Query.prototype.indexOf = function(el) {
    return Array.prototype.indexOf.call(this.nodeList, el);
  };

  Query.prototype.is_destroyed = false;

  Query.prototype.destroy = function() {
    this.offAll();
    this.is_destroyed = true;
    this.ids = null;
    this.lastAddedIds = null;
    this.lastRemovedIds = null;
    this.createNodeList = null;
    this.nodeList = null;
    return this.changedLastUpdate = null;
  };

  return Query;

})(GSS.EventTrigger);

module.exports = Query;
