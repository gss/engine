var IdMixin, boxSizingPrefix;

boxSizingPrefix = GSS._.boxSizingPrefix;

IdMixin = {
  uid: function() {
    return this._id_counter++;
  },
  _id_counter: 1,
  _byIdCache: {},
  _ids_killed: function(ids) {
    var id, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      _results.push(this._id_killed(id));
    }
    return _results;
  },
  _id_killed: function(id) {
    var _ref;
    this._byIdCache[id] = null;
    delete this._byIdCache[id];
    return (_ref = GSS.View.byId[id]) != null ? typeof _ref.recycle === "function" ? _ref.recycle() : void 0 : void 0;
  },
  getById: function(id) {
    var el;
    if (this._byIdCache[id]) {
      return this._byIdCache[id];
    }
    el = document.querySelector('[data-gss-id="' + id + '"]');
    if (el) {
      this._byIdCache[id] = el;
    }
    return el;
  },
  setupScopeId: function(el) {
    el._gss_is_scope = true;
    return this.setupId(el);
  },
  setupId: function(el) {
    var gid, _id;
    if (!el) {
      return null;
    }
    gid = this.getId(el);
    if (gid == null) {
      _id = this.uid();
      gid = String(el.id || _id);
      el.setAttribute('data-gss-id', gid);
      GSS._.setStyle(el, boxSizingPrefix, 'border-box');
      el._gss_id = gid;
      GSS.View["new"]({
        el: el,
        id: gid
      });
    }
    this._byIdCache[gid] = el;
    return gid;
  },
  getId: function(el) {
    if (el != null ? el._gss_id : void 0) {
      return el != null ? el._gss_id : void 0;
    }
    return null;
  }
};

module.exports = IdMixin;
