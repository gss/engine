var GSS;

if (window.GSS) {
  GSS = window.GSS;
} else {
  GSS = {};
}

GSS._id_counter = 1;

GSS._byIdCache = [];

GSS._ids_killed = function(ids) {
  var id, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = ids.length; _i < _len; _i++) {
    id = ids[_i];
    _results.push(delete GSS._byIdCache[id]);
  }
  return _results;
};

GSS.getById = function(id) {
  var el;
  if (GSS._byIdCache[id]) {
    return GSS._byIdCache[id];
  }
  el = document.querySelector("[data-gss-id=" + id + "]");
  return el;
};

GSS.setupId = function(el) {
  var gid;
  gid = el.getAttribute('data-gss-id');
  if (gid == null) {
    gid = GSS._id_counter++;
    el.setAttribute('data-gss-id', gid);
  }
  GSS._byIdCache[gid] = el;
  return gid;
};

GSS.getId = function(el) {
  var gid;
  return gid = el.getAttribute('data-gss-id');
};

if (!window.GSS) {
  window.GSS = GSS;
}
