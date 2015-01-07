// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

var DraggableBox = c.inherit({

  initialize: function(x, y, w, h) {
    this.width = w || 15;
    this.height = h || 15;
    if (y == null ) {
      this._center = new c.Point(0, 0, x);
    } else {
      this._center = new c.Point(x, y);
    }
  },

  get center() { return this._center; },
  set center(v) {
    this._center.x = v.x;
    this._center.y = v.y;
  },

  get x() { return this._center.x; },
  get y() { return this._center.y; },

  draw: function(ctx) {
    ctx.strokeRect(this.x.value - (this.width/2),
                   this.y.value - (this.height/2),
                   this.width, this.height);
  },

  Contains: function(x, y) {
    return ( (x >= this.x.value - this.width/2) &&
             (x <= this.x.value + this.width/2) &&
             (y >= this.y.value - this.height/2) &&
             (y <= this.y.value + this.height/2)
           );
  },

  toString: function() {
    return "<" + this.sx + "," + this.sy + ">";
  },
});

var QuadDemo = c.inherit({

  initialize: function() {
    this.canvas = document.getElementById('c');
    this.cwidth = this.canvas.width;
    this.cheight = this.canvas.height;
    this.g = this.canvas.getContext('2d');

    var solver = this.solver = new c.SimplexSolver();
    this.dbDragging = -1;

    var db = this.db = new Array(8);   // all of them
    var mp = this.mp = new Array(4);   // midpoints

    var a;

    for (a = 0; a < 8; ++a) {
      db[a] = new DraggableBox(a);
    }

    for (a = 0; a < 4; ++a) {
      mp[a] = db[a+4];
    }

    db[0].center = {x: 10,  y: 10};
    db[1].center = {x: 10,  y: 200};
    db[2].center = {x: 200, y: 200};
    db[3].center = {x: 200, y: 10};

    // Add constraints
    //  try {
    // Add stay constraints on line endpoints
    solver.addPointStays([db[0].center,
                          db[1].center,
                          db[2].center,
                          db[3].center]);

    var cle, cleq;

    // Add constraints to keep midpoints at line midpoints
    // cle = new c.Expression(db[0].x);
    cle = c.Expression.fromConstant(db[0].x).plus(db[1].x).divide(2);
    cleq = new c.Equation(mp[0].x, cle);

    solver.addConstraint(cleq);

    cle = c.Expression.fromConstant(db[0].y).plus(db[1].y).divide(2);
    cleq = new c.Equation(mp[0].y, cle);

    solver.addConstraint(cleq);

    cle = c.Expression.fromConstant(db[1].x).plus(db[2].x).divide(2);
    cleq = new c.Equation(mp[1].x, cle);

    solver.addConstraint(cleq);

    cle = c.Expression.fromConstant(db[1].y).plus(db[2].y).divide(2);
    cleq = new c.Equation(mp[1].y, cle);

    solver.addConstraint(cleq);

    cle = c.Expression.fromConstant(db[2].x).plus(db[3].x).divide(2);
    cleq = new c.Equation(mp[2].x, cle);

    solver.addConstraint(cleq);

    cle = c.Expression.fromConstant(db[2].y).plus(db[3].y).divide(2);
    cleq = new c.Equation(mp[2].y, cle);

    solver.addConstraint(cleq);

    cle = c.Expression.fromConstant(db[3].x).plus(db[0].x).divide(2);
    cleq = new c.Equation(mp[3].x, cle);

    solver.addConstraint(cleq);

    cle = c.Expression.fromConstant(db[3].y).plus(db[0].y).divide(2);
    cleq = new c.Equation(mp[3].y, cle);

    solver.addConstraint(cleq);

    cle = c.plus(db[0].x, 20);

    solver.addConstraint(new c.Inequality(cle, c.LEQ, db[2].x))
          .addConstraint(new c.Inequality(cle, c.LEQ, db[3].x));

    cle = c.plus(db[1].x, 20);

    solver.addConstraint(new c.Inequality(cle, c.LEQ, db[2].x))
          .addConstraint(new c.Inequality(cle, c.LEQ, db[3].x));

    cle = c.plus(db[0].y, 20);

    solver.addConstraint(new c.Inequality(cle, c.LEQ, db[1].y))
          .addConstraint(new c.Inequality(cle, c.LEQ, db[2].y));

    cle = c.plus(db[3].y, 20);

    solver.addConstraint(new c.Inequality(cle, c.LEQ, db[1].y))
          .addConstraint(new c.Inequality(cle, c.LEQ, db[2].y));

    // Add constraints to keep points inside window
    db.forEach(function(p) {
      solver.addConstraint(new c.Inequality(p.x, c.GEQ, 10));
      solver.addConstraint(new c.Inequality(p.y, c.GEQ, 10));

      solver.addConstraint(new c.Inequality(p.x, c.LEQ, this.cwidth - 10));
      solver.addConstraint(new c.Inequality(p.y, c.LEQ, this.cheight - 10));
    }, this);

    //  } catch (e) {
    //    print("EXCEPTION: e = " + e);
    //  }
  },

  mousedown: function(ev) {
    var x = ev.pageX - this.canvas.offsetLeft;
    var y = ev.pageY - this.canvas.offsetTop;

    // console.log('mousedown x,y='+x+','+y);
    // console.log('mousedown canvasoffset='+this.canvas.offsetLeft+','+this.canvas.offsetTop);
    // console.log('mousedown clientx,y='+ev.clientX+','+ev.clientY);
    // console.log('mousedown pagex,y='+ev.pageX+','+ev.pageY);

    for ( var a = 0; a < this.db.length; a++ ) {
      if ( this.db[a].Contains(x, y) ) {
        this.dbDragging = a;
        // console.log('dragging #' + a);
        break;
      }
    }

    if ( this.dbDragging != -1 ) {
      this.draw();
      this.solver
        .addEditVar(this.db[this.dbDragging].x)
        .addEditVar(this.db[this.dbDragging].y)
        .beginEdit();
    }
    return true;
  },


  mouseup: function(ev) {
    if (this.dbDragging != -1 ) {
      this.dbDragging = -1;
      this.solver.endEdit();
    }
    this.draw();
    return true;
  },

  mousemove: function(ev) {
    var x = ev.pageX - this.canvas.offsetLeft;
    var y = ev.pageY - this.canvas.offsetTop;
    if ( this.dbDragging != -1 ) {
      this.solver
        .suggestValue(this.db[this.dbDragging].x, x)
        .suggestValue(this.db[this.dbDragging].y, y)
        .resolve();
      this.draw();
    }
    return true;
  },


  touchstart: function(ev) {
    if (false) {
      document.write("touchstart ev = " + ev + "  ");
      document.write(ev.pageX + "," + ev.pageY);
      document.write("<br/>");
    }
    this.mousedown(ev.touches.item(0));
    if (this.dbDragging != -1) {
      ev.preventDefault();
    }
  },

  touchend: function(ev) {
    this.mouseup(ev);
  },

  touchmove: function(ev) {
    this.mousemove(ev.touches.item(0));
    if (this.dbDragging != -1) {
      ev.preventDefault();
    }
  },

  initEvents: function() {
    var mouseupHandler = function(ev) {
      this.mouseup(ev);
      document.removeEventListener('mouseup', mouseupHandler);
    }.bind(this);

    this.canvas.addEventListener('mousedown',
      function(ev) {
       this.mousedown(ev);
       document.addEventListener('mouseup', mouseupHandler);
      }.bind(this),
      false
    );
    ['mousemove', 'touchstart', 'touchend', 'touchmove'].forEach(
      function(evt) {
        this.canvas.addEventListener(evt, this.mousemove.bind(this));
      },
      this
    );
  },


  draw: function() {
    var g = this.g;
    var db = this.db;
    var mp = this.mp;

    g.clearRect(0, 0, this.cwidth, this.cheight);
    g.strokeStyle = 'black';

    g.beginPath();
    g.moveTo(db[0].x.value, db[0].y.value);
    g.lineTo(db[1].x.value, db[1].y.value);
    g.lineTo(db[2].x.value, db[2].y.value);
    g.lineTo(db[3].x.value, db[3].y.value);
    g.closePath();
    g.stroke();

    g.beginPath();
    g.moveTo(mp[0].x.value, mp[0].y.value);
    g.lineTo(mp[1].x.value, mp[1].y.value);
    g.lineTo(mp[2].x.value, mp[2].y.value);
    g.lineTo(mp[3].x.value, mp[3].y.value);
    g.closePath();
    g.stroke();

    for (var a = 0; a < 8; ++a) {
      if (a == this.dbDragging) {
        g.strokeStyle = 'blue';
      }
      db[a].draw(g);
      if (a == this.dbDragging) {
        g.strokeStyle = 'black';
      }
    }
  },
});

function runit() {
  var qd = new QuadDemo();
  document.getElementById("append").innerHTML = ("<br/>" + qd.solver.getInternalInfo());
  qd.draw();
  qd.initEvents();
}
