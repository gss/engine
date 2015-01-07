/**
 * Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Notes:
 *  This file does CSS layout. The exported API is one method, "layoutFor()"
 *  which takes an ID of a same-origin iframe whose contents you wish to lay
 *  out and a callback method to pass the resulting boxes to:
 *
 *    layoutFor("iframe_id", function callback(boxes) {
        renderTo("canvas_id", boxes); // See render.js
 *    });
 *
 *  It does not compute the cascade, parse CSS, or
 *  build a DOM to apply it to.
 *
 *
 *  Instead, it relies on an existing browser or
 *  runtime to have provided all of that, using those facilities to determine
 *  the applied CSS values and generate
 */

(function(scope) {
"use strict";

//////////////////////////////////////////////////////
//  Utility functions
//////////////////////////////////////////////////////

var global = function(id) {
  return scope.document.getElementById(id).contentWindow;
};
var doc = function(id) { return global(id).document; };

var weak = c.Strength.weak;
var medium = c.Strength.medium;
var strong = c.Strength.strong;
var required = c.Strength.required;

var eq  = function(a1, a2, strength, w) {
  return new c.Equation(a1, a2, strength || weak, w||0);
};
var neq = function(a1, a2, a3) { return new c.Inequality(a1, a2, a3); };
var geq = function(a1, a2, str, w) { return new c.Inequality(a1, c.GEQ, a2, str, w); };
var leq = function(a1, a2, str, w) { return new c.Inequality(a1, c.LEQ, a2, str, w); };

var stay = function(v, strength, weight) {
  return new c.StayConstraint(v, strength || weak, weight || 1.0);
};
var weakStay     = function(v, w) { return stay(v, weak, w); };
var mediumStay   = function(v, w) { return stay(v, medium, w); };
var strongStay   = function(v, w) { return stay(v, strong, w); };
var requiredStay = function(v, w) { return stay(v, required, w); };

var plus  = function(a1, a2) { return c.plus(a1, a2); };
var minus = function(a1, a2) { return c.minus(a1, a2); };
var times = function(a1, a2) { return c.times(a1, a2); };
var div   = function(a1, a2) { return c.divide(a1, a2); };
var cv    = function(n, val) {
  return new c.Variable({ name: n, value: val });
};

// IE10 still doesn't have console.time/timeEnd.
if (!console.time) {
  console.time = console.timeEnd = function() {};
}

var CSSValue = c.inherit({
  initialize: function(value, name) {
    this.value = value;
    this.name = name;
  },
  get px() {
    //console.log(this.name, ":", this.value, parseFloat(this.value));
    if (this.value == "auto") {
      // console.warn("providing 0 for auto on:", this.name);
      return 0;
    } else if (this.value.indexOf("px") >= 0) {
      return parseFloat(this.value);
    } else {
      console.warn("wrong px version of:", this.name, ":", this.value);
      // FIXME(slightlyoff):
      //      Convert to absolute pixels, taking into account current element
      //      EM/EN sizing, etc.
      return parseFloat(this.value);
    }
  },
  get pct() { return parseFloat(this.value); },
  get str() { return this.value; },
  get raw() { return this.value; },
  toString: function() { return this.value; },
  get isAuto() {
    return (this.value == "auto" || (
            this.name == "auto" && this.value == "0px"
           ));
  },
  get isPct() { return this.value.indexOf("%") >= 0; },
});

//  getComputedStyle returns USED width/height/etc. (post-layout) in the
//  original document, not the COMPUTED width/height/etc. This defeats our
//  engine entirely. To avoid writing a parser and resolver, we require
//  (for now) that all the following styles be declared *on the elements
//  themselves* or on simple in-document ID rules:
//    background-position
//    bottom, left, right, top
//    height, width
//    margin-bottom, margin-left, margin-right, margin-top,
//    min-height, min-width
//    padding-bottom, padding-left, padding-right, padding-top
//    text-indent
//
//  This means that we effectively only support these styles when written as:
//
//    <style>
//        #thinger {
//            left: 100px;
//            ...
//        }
//    </style>
//    <div id="thinger" style="width: 500px; height 500px;">...</div>
//
//  See also:
//      https://developer.mozilla.org/en/DOM/window.getComputedStyle
//      https://developer.mozilla.org/en/CSS/used_value
//      https://developer.mozilla.org/en/CSS/computed_value
var _localCssProperties = [
  "background-position",
  "bottom", "left", "right", "top",
  "height", "width", "min-height", "min-width",
  "margin-bottom", "margin-left", "margin-right", "margin-top",
  "padding-bottom", "padding-left", "padding-right", "padding-top",
  "text-indent"
];
var css = function(propertyName, node) {
  var value;
  if (!node && this.node) {
    node = this.node;
  }
  node = (node.nodeType == 1) ? node : node.parentNode;
  /*
  if (!node || !node.ownerDocument) {
    console.error("NO NODE!");
    debugger;
  }
  */
  if (typeof propertyName != "string" && propertyName["name"]) {
    // We got a complex property descriptor. Handle it.
    var obj = propertyName;
    propertyName = obj.name;
    var r;
    for(var x = 0; x < obj.test.length; x++) {
      r = css.call(this, obj.test[x], node);
      if (r.value) { return r; }
    }
    return new CSSValue("auto", propertyName);
  }

  if (_localCssProperties.indexOf(propertyName) >= 0) {
    // We don't trust getComputedStyle since it returns used values for these
    // properties, so we instead look to see what the node itself has
    // specified.
    value = node.style[toCamelCase(propertyName)];


    // If we don't get something from the node, we try to honour ID-targeted
    // rules. We're not looking to understand "!important", settle ordering
    // issues, handle linked sheets, etc. This is purely a hack.
    if (!value) {
      // FIXME: expensive, cache!
      value = "auto";
      var id = node.id;
      if (id) {
        var idRe = new RegExp("\#"+id+"\\s*{");
        toArray(node.ownerDocument.styleSheets).forEach(function(sheetList) {
          toArray(sheetList).forEach(function(sheet) {
            toArray(sheet.cssRules).forEach(function(rule) {
              if (rule.type == 1) {
                if (rule.cssText.search(idRe) == 0) {
                  var tv = rule.style[toCamelCase(propertyName)];
                  if (tv) {
                    value = tv;
                  }
                }
              }
            });
          });
        });
      }
    }
  } else {
    value = node.ownerDocument.defaultView.getComputedStyle(node).getPropertyValue(propertyName);
  }
  return new CSSValue(value, propertyName);
};

var isElement = function(n) {
  return n && n.nodeType == 1;
};

var isBlock = function(n) {
  if (!isElement(n)) return false;
  return (
    css("display", n).raw == "block" ||
    css("display", n).raw == "list-item" ||
    css("display", n).raw.indexOf("table") == 0
  );
};

var isInline = function(n) {
  if (!isElement(n)) return false;
  return (
    css("display", n).raw == "inline" ||
    css("display", n).raw == "inline-block" ||
    css("display", n).raw == "inline-table" ||
    css("display", n).raw == "ruby"
  );
};

var isInlineBlock = function(n) {
  if (!isElement(n)) return false;
  return (
    css("display", n).raw == "inline-block" ||
    css("display", n).raw == "inline-table"
  );
};

var isFixed = function(n) {
  if (!isElement(n)) return false;
  return (css("position", n).raw == "fixed");
};

var isPositioned = function(n) {
  if (!isElement(n)) return false;
  return (
    css("position", n).raw == "fixed" ||
    css("position", n).raw == "absolute" ||
    css("position", n).raw == "center" ||
    css("position", n).raw == "page" // TODO(slightlyoff)
  );
};

var isInFlow = function(n) {
  if (!isElement(n)) return false;
  return (
    ( // FIXME: need to get USED values here!
      css("display", n).raw == "block" ||
      css("display", n).raw == "list-item" ||
      css("display", n).raw == "table"
    ) &&
    css("float", n).raw == "none" &&
    (
      css("position", n).raw == "static" ||
      css("position", n).raw == "relative"
    )
    // FIXME:
    //  "4. It is either a child of the flow root or a child of a box that
    //  belogs to the flow."
  );
};

var isBFC = function(n) {
  // CSS 2.1 says:
  //    Floats, absolutely positioned elements, block containers (such as
  //    inline-blocks, table-cells, and table-captions) that are not block
  //    boxes, and block boxes with ’overflow’ other than ’visible’ (except
  //    when that value has been propagated to the viewport) establish new
  //    block formatting contexts for their contents.
  if (!isElement(n)) return false;
  var display = css("display", n).raw;
  var pos = css("position", n).raw;
  return (
    // floated
    css("float", n).raw != "none" ||
    // abs and fixed
    ( pos != "static" && pos != "relative") ||
    // block boxes with overflow != visible
    (
      (display == "block") && (css("overflow", n).raw != "visible")
    ) ||
    // block containers that are not block boxes
    display == "table-cell" ||
    display == "table-caption" ||
    display == "inline-block" ||
    display == "inline-table"
  );
};

var isRunIn = function(n){
  // TODO(slightlyoff)
  return false;
};

var DEFULT_MEDIUM_WIDTH = 3;
var MEASURE_NODE_ID = "__measureNode";

//////////////////////////////////////////////////////
//  Types
//////////////////////////////////////////////////////

var MeasuredBox = c.inherit({
  initialize: function(top, left, right, bottom) {
    this.top =    top||0;
    this.left =   left||0;
    this.right =  right||0;
    this.bottom = bottom||0;
  },
  get width() { return this.right - this.left; },
  get height() { return this.bottom - this.top; },

  toString: function() {
    return "MeasuredBox: { top: "    + this.top +
                ", right: "  + this.right +
                ", bottom: " + this.bottom +
                ", left: "   + this.left +
                ", width: "  + this.width +
                ", height: " + this.height + " }";
  },
});

var Box = c.inherit({
  initialize: function(top, left, right, bottom) {
    this._top =    cv("_top", top||0);
    this._left =   cv("_left", left||0);
    this._right =  cv("_right", right||0);
    this._bottom = cv("_bottom", bottom||0);
  },
  get top()    {
    // console.log("top:", this._top.value);
    return this._top.value; },
  get left()   { return this._left.value; },
  get right()  { return this._right.value; },
  get bottom() {
    // console.log("bottom:", this._bottom.value);
    return this._bottom.value; },
  get width()  { return this.right - this.left; },
  get height() { return this.bottom - this.top; },

  // FIXME(slightlyoff): need setters to over-ride the values for debugging!
  toString: function() {
    return "Box: { top: "    + this.top +
                ", right: "  + this.right +
                ", bottom: " + this.bottom +
                ", left: "   + this.left +
                ", width: "  + this.width +
                ", height: " + this.height + " }";
  },
});

var Edgy = function() {
  this.edges = {
    ref: {
      margin:   new Box(),
      border:   new Box(),
      padding:  new Box(),
      content:  new Box(),
    },
    actual: {
      margin:   new Box(),
      border:   new Box(),
      padding:  new Box(),
      content:  new Box(),
    },
  };

  // TODO(slightlyoff): support box-sizing by breaking these
  //                    assumptions!
  this.edges.ref.outer = this.edges.ref.margin;
  this.edges.ref.inner = this.edges.ref.content;

  this.edges.actual.outer = this.edges.actual.margin;
  this.edges.actual.inner = this.edges.actual.content;
};

var EdgyLight = function() {
  // We don't really have the potential to be rel pos or margin/padding/border,
  // so we make content/margin/padding/border all the same and only deal in
  // actual, outer values.
  this.edges = { actual: { margin: new Box() } }
  var e = this.edges.ref = this.edges.actual;
  e.content = e.padding = e.border = e.inner = e.outer = e.margin;
}

var VarHeavy = function(properties) {
  this.values = {};
  this.vars = {};
  this.value = function(p, v) {
    var opn = p["name"]||p;
    var pn = toCamelCase(opn);
    var val = this.values[pn];
    if (typeof v != "undefined") {
      if (!val) {
        val = this.values[pn] = new CSSValue(opn, v);
      } else {
        val.value = v;
      }
    }
    return val;
  };
  this.var = function(p, v) {
    var opn = p["name"]||p;
    var pn = toCamelCase(opn);
    var varv = this.vars[pn];
    if (typeof v != "undefined") {
      if (v instanceof c.Variable) {
        varv = this.vars[pn] = v;
      } else {
        if (!varv) {
          varv = this.vars[pn] = cv(opn, v);
        } else {
          varv.value = v;
        }
      }
    }
    return varv;
  };
  properties.forEach(function(p) {
    this.value(p, "auto");
    this.var(p, p);
  }, this);
};

var Nodey = function(node, properties) {
  this.node = this.node || node;
  this.css = css;

  properties.forEach(function(p) {
    this.value(p, css(p, this.node).raw);
  }, this);
};

var BFC = function() {
  this._isBFC = true;
};

var _boxCtr = 0;

var RenderBox = c.inherit({
  initialize: function(node, containingBlock){
    this._id = _boxCtr++;
    Edgy.call(this);
    VarHeavy.call(this, this.boxProperties);
    if (node) {
      Nodey.call(this, node, this.boxProperties);
    }
    this.containingBlock = containingBlock;

    this.vars.mediumWidth = cv("mediumWidth", DEFULT_MEDIUM_WIDTH);
    this.naturalSize = contentSize(node);
    this.solver = this.solver || this.containingBlock.solver;

    // FIXME:
    //  Hate having these properties hanging off of every box, but it keeps the
    //  nodes out of our layout logic.
    this._isInline = false;
    this._isBlock = false;
    this._isBFC = false;
  },

  _className: "RenderBox",

  toString: function() {
    var m = this.edges.actual.margin;
    return this._className + ": { top: " + m.top +
                               ", right: " + m.right +
                               ", bottom: " + m.bottom +
                               ", left: " + m.left + " } box: " + this._id;
  },

  boxProperties: [
    "position",
    "width", "min-width", "min-height",
    "height", "max-width", "max-height",
    "left", "right", "top", "bottom",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "margin-top-width",
    "margin-right-width",
    "margin-bottom-width",
    "margin-left-width",
    // FIXME:
    //    we shouldn't be falling back to margin-left et al. in RTL. Should be
    //    fliipped in those cases.
    {
      name:"margin-before",
      test: ["-webkit-margin-before", "-moz-margin-before", "margin-top"],
    },
    {
      name:"margin-after",
      test: ["-webkit-margin-after", "-moz-margin-after", "margin-bottom"],
    },
    {
      name:"margin-start",
      test: ["-webkit-margin-start", "-moz-margin-start", "margin-left"],
    },
    {
      name:"margin-end",
      test: ["-webkit-margin-end", "-moz-margin-end", "margin-right"],
    },
    "border",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "border-top-style",
    "border-right-style",
    "border-bottom-style",
    "border-left-style",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "padding-top-width",
    "padding-right-width",
    "padding-bottom-width",
    "padding-left-width",
    "font-size",
    "font-family",
    "color"
  ],

  generate: function() {
    var optimize = false;
    // Constraints for all boxes
    var ref = this.edges.ref;
    var actual = this.edges.actual;
    var containing = this.containingBlock.edges.actual;
    var constrain = this.solver.add.bind(this.solver);
    var vals = this.values;
    var vars = this.vars;

    // FIXME(slightlyoff):
    //      Need to generate different rules for %-based values!

    // Michalowski '98, Section 3.1

    var _mediumWidth = cv("mediumWidth", DEFULT_MEDIUM_WIDTH);

    // Content dimensions are padding plus/minus the corresponding padding.
    if (optimize && vals.padding.isAuto) {
      ref.padding = ref.content;
    } else {
      constrain(
        eq(
          ref.content._top,
          c.plus(ref.padding._top, vals.paddingTop.px),
          required
        ),
        eq(
          ref.content._left,
          c.plus(ref.padding._left, vals.paddingLeft.px),
          required
        ),
        eq(
          ref.content._right,
          c.minus(ref.padding._right, vals.paddingRight.px),
          required
        ),
        eq(
          ref.content._bottom,
          c.minus(ref.padding._bottom, vals.paddingBottom.px),
          required
        )
      );
    }

    if (optimize && vals.border.isAuto) {
      ref.border = ref.padding;
    } else {
      constrain(
        eq(c.minus(ref.padding._top, vals.borderTopWidth.px),
          ref.border._top,
          required
        ),
        eq(c.minus(ref.padding._left, vals.borderLeftWidth.px),
          ref.border._left,
          required
        ),
        eq(c.plus(ref.padding._right, vals.borderRightWidth.px),
          ref.border._right,
          required
        ),
        eq(
          ref.border._bottom,
          c.plus(ref.padding._bottom, vals.borderBottomWidth.px),
          required
        )
      );
    }

    var mt = (vals.marginTop.isAuto && !vals.marginBefore.isAuto) ?
                vals.marginBefore.px : vals.marginTop.px;

    var mr = (vals.marginRight.isAuto && !vals.marginEnd.isAuto) ?
                vals.marginEnd.px : vals.marginRight.px;

    var mb = (vals.marginBottom.isAuto && !vals.marginAfter.isAuto) ?
                vals.marginAfter.px : vals.marginBottom.px;

    var ml = (vals.marginLeft.isAuto && !vals.marginStart.isAuto) ?
                vals.marginStart.px : vals.marginLeft.px;

    constrain(
      eq(c.minus(ref.border._top, mt),
        ref.margin._top,
        required
      ),
      eq(c.minus(ref.border._left, ml),
        ref.margin._left,
        required
      ),
      eq(c.plus(ref.border._right, mr),
        ref.margin._right,
        required
      ),
      eq(c.plus(ref.border._bottom, mb),
        ref.margin._bottom,
        required
      )
    );

    // FIXME: if %-valued, need to do the obvious thing
    if (!vals.width.isAuto) {
      constrain(
        eq(c.plus(ref.content._left, vals.width.px),
          ref.content._right,
          required
        )
      );
    }

    if (!vals.height.isAuto) {
      constrain(
        eq(c.plus(ref.content._top, vals.height.px),
          ref.content._bottom,
          required
        )
      );
    }


    // Width and height are the result of:
    //  w = right - left;
    //  h = bottom - top;
    constrain(
      eq(
        vars.width,
        c.minus(ref.border._right, ref.border._left),
        medium
      ),
      eq(
        vars.height,
        c.minus(ref.border._bottom, ref.border._top),
        medium
      )
    );

    /*
    console.log("Generating for: " + this);
    console.log(" -- naturalSize:", "width:", this.naturalSize.width, "height:", this.naturalSize.height);
    */

    constrain(eq(vars.width, this.naturalSize.width, weak));

    if (!vals.width.isAuto) {
      // console.log(" -- using specified size:", vals.width.px);
      constrain(eq(vars.width, vals.width.px, strong));
    }

    // console.log("this.naturalSize.height:", this.naturalSize.height, this.node);
    // constrain(eq(vars.height, this.naturalSize.height, weak));

    if (!vals.height.isAuto) {
      constrain(eq(vars.height, vals.height.px, strong));
    }

    [
      vars.marginTop,
      vars.marginRight,
      vars.marginBottom,
      vars.marginLeft,
      vars.paddingTop,
      vars.paddingRight,
      vars.paddingBottom,
      vars.paddingLeft
    ].forEach(function(v) { constrain(eq(v, 0, weak)); });

    [
      vars.borderTop,
      vars.borderRight,
      vars.borderBottom,
      vars.borderLeft
    ].forEach(function(v) { constrain(eq(v, _mediumWidth, weak)); });


    /*
    if (vals.position == "relative") {
      // Only do this when they could possibly differ.
      ["margin", "border", "padding", "content"].forEach(function(type) {
        ["_left", "_top", "_right", "_bottom"].forEach(function(name) {
          // FIXME(slightlyoff): unsure how to make ref's variables read-only here!
          constrain(
            eq(actual[type][name], ref[type][name], strong)
          );
        });
      });
    } else {
    */
      this.edges.actual = this.edges.ref;
      actual = ref;
    // }

    constrain(
      geq(vars.width, 0, required),
      geq(vars.height, 0, required)
    );

    // RENDER DEBUGGING ONLY:
    /*
    constrain(
      eq(vars.minWidth, 10, strong),
      eq(vars.minHeight, 30, strong)
    );
    */

    if (!vals.minWidth.isAuto) {
      constrain(
        geq(vars.width, vars.minWidth, required)
      );
    }

    if (!vals.minHeight.isAuto) {
      constrain(
        geq(vars.height, vars.minHeight, required)
      );
    }

    constrain(
      eq(vars.left, 0, weak),
      eq(vars.right, 0, weak),
      eq(vars.top, 0, weak),
      eq(vars.bottom, 0, weak)
    );

    // Some sanity while I figure out what's going on in Gecko.
    constrain(
      geq(ref.content._bottom, ref.content._top, required),
      geq(ref.content._right, ref.content._left, required)
    );


    // FIXME(slightlyoff):
    //  Missing 9.5 items for floated boxes

    // Michalowski '98, Section 3.3
    // Normally-positioned Block boxes are handed in flow()

    // Michalowski '98, Section 3.4
    // Position-based Constraints
    //
    // TODO(slightlyoff)
    //
    var posRefBox;
    if (vals.position == "relative") {
      posRefBox = ref;
    } else if(
      vals.position == "absolute" ||
      vals.position == "fixed"
    ) {
      posRefBox = containing;
    }

    if (posRefBox) {
      // TODO: tersify and add similar % support in other places.
      if (!vals.top.isAuto) {
        var topExpr;
        if (vals.top.isPct) {
          topExpr = c.plus(posRefBox.margin._top,
                           c.times(
                             c.minus(posRefBox.border._bottom, posRefBox.border._top),
                             vals.top.pct/100
                           )
                     );
        } else {
          topExpr = c.plus(posRefBox.margin._top, vals.top.px);
        }
        constrain(eq(actual.border._top, topExpr, required));
      }

      if (!vals.left.isAuto) {
        var leftExpr;
        if (vals.left.isPct) {
          leftExpr = c.plus(posRefBox.margin._left,
                            c.times(
                              c.minus(posRefBox.border._right, posRefBox.border._left),
                              vals.left.pct/100
                            )
                     );
        } else {
          leftExpr = c.plus(posRefBox.margin._left, vals.left.px);
        }
        constrain(eq(actual.border._left, leftExpr, required));
      }

      if (!vals.right.isAuto) {
        var rightExpr;
        if (vals.right.isPct) {
          rightExpr = c.minus(posRefBox.margin._right,
                              c.times(
                                c.minus(posRefBox.border._right, posRefBox.border._left),
                                vals.right.pct/100
                              )
                       );
        } else {
          rightExpr = c.minus(posRefBox.content._right, vals.right.px);
        }
        constrain(eq(actual.border._right, rightExpr, required));
      }

      if (!vals.bottom.isAuto) {
        var bottomExpr;
        if (vals.bottom.isPct) {
          bottomExpr = c.minus(posRefBox.margin._bottom,
                               c.times(
                                 c.minus(posRefBox.border._bottom, posRefBox.border._top),
                                 vals.bottom.pct/100
                               )
                       );
        } else {
          bottomExpr = c.minus(posRefBox.margin._bottom, vals.bottom.px);
        }
        constrain(eq(actual.border._bottom, bottomExpr, required));
      }
    }

    //
    // TODO(slightlyoff)
    //
  },

  fillLineBoxes: function() {
    // Stub
  },
});

var Block = c.inherit({
  extends: RenderBox, // TODO: Block,
  _className: "Block",
  debugColor: "rgba(82,125,255,1)",
  // debugColor: "yellow",
  initialize: function(node, cb, noAddBlock){
    RenderBox.call(this, node, cb);
    if (typeof noAddBlock == "undefined" && noAddBlock !== false) {
      // console.log("adding block", this._className, this._id, "to", cb._className, cb._id);
      cb.addBlock(this);
    }

    // Blocks are block containers.
    this.blockProgression = "tb";
    this._blocks = [];
    this.childBoxes = [];

    this._hasBlocks = false;
    this._hasInlines = false;
    this._openAnonymousBlock = null;
    this._anonymousBlocks = [];
  },
  addBlock: function(b) {
    if (b == this) { return; }
    if (this._openAnonymousBlock &&
        b != this._openAnonymousBlock) {
      // Open season is now closed.
      this._openAnonymousBlock = null;
    }
    this._blocks.push(b);
    this.childBoxes.push(b);
  },
  addInline: function(i) {
    if (!this._openAnonymousBlock) {
      // Open season is now closed.
      this._openAnonymousBlock = new AnonymousBlock(this);
      this._anonymousBlocks.push(this._openAnonymousBlock);
      this.addBlock(this._openAnonymousBlock);
    }
    this._openAnonymousBlock.addInline(i);
  },
  // Hook layout generation and line-box filling
  generate: function() {
    RenderBox.prototype.generate.call(this);
    this._anonymousBlocks.forEach(function(ab){ ab.generate(); });
  },
  fillLineBoxes: function() {
    RenderBox.prototype.fillLineBoxes.call(this);
    this._anonymousBlocks.forEach(function(ab){ ab.fillLineBoxes(); });
  },
  flow: function() {
    //
    // "So here we go now
    //  Holla if ya hear me though
    //  Come and feel me, flow" -- NbN
    //

    if (!this._blocks.length) {
      return;
    }

    var ref = this.edges.ref;
    var constrain = this.solver.add.bind(this.solver);

    var prev = null;
    var last = null;

    this._blocks.forEach(function(child, idx, arr) {
      // console.log("flowing child: " + child);

      if (child.node && !isInFlow(child.node)) {
        return;
      }

      switch(this.blockProgression) {
        case "tb":
          // Left and right edges of our block children are our content
          // left/right.
          constrain(
            eq(child.edges.ref.outer._left, ref.content._left, required),
            eq(child.edges.ref.outer._right, ref.content._right, required)
          );
          // console.log(" -- our width is:", this.vars.width.value);
          // console.log(" -- child width is now:", child.vars.width.value);
          constrain(
            leq(child.vars.width, this.vars.width, required),
            leq(child.vars.height, this.vars.height, required)
          );
          // console.log(" -- child width is now:", child.vars.width.value);
          // console.log(" -- our width is now:", this.vars.width.value);

          // Next, top is the previous bottom, else containing's content top;
          if (last) {
            constrain(
              eq(child.edges.ref.outer._top, last.edges.ref.outer._bottom, medium)
            );
          } else {
            // console.log(" -- setting top to:", ref.content._top.value);
            constrain(
              eq(child.edges.ref.margin._top, ref.content._top, strong)
            );
            /*
            // console.log("initial flow child: " + child, "below:", containing.content._top.value);
            if (true || this.className == "InlineBlock") {
              // console.log("initial flow child: " + child);
              // console.log(" -- inside:", this+"");
              // console.log(" -- outer: "  + child.edges.actual.margin);
              // console.log(" -- inner: "  + child.edges.actual.content);
              // console.log(" -- margin-top:", child.value("margin-top").raw);
              // console.log(" -- padding-top:", child.value("padding-top").raw);
              // console.log(" -- border-top:", child.value("border-top-width").raw);
            }
            */
          }
          prev = last;
          last = child;

          /*
          if (idx+1 == arr.length) {
            console.log("last child is an:", child._className);
            constrain(
              eq(child.edges.ref.outer._bottom, this.edges.ref.content._bottom, strong)
            );
          }
          */

          // TODO(slightlyoff): margin collapsing!
          break;
        case "rl": // TODO(slightlyoff)
        case "bt": // TODO(slightlyoff)
        case "lr": // TODO(slightlyoff)
        default:
          console.warn("Unsupported block-progression:",
                       this.blockProgression);
          break;
      }
    }, this);
  },
});

var AnonymousBlock = c.inherit({
  extends: RenderBox, // TODO: Block,
  _className: "AnonymousBlock",
  debugColor: "rgba(255,84,186,1)", // Bright pink.
  initialize: function(cb){
    this._id = _boxCtr++;
    EdgyLight.call(this);
    VarHeavy.call(this, this.boxProperties);
    this.containingBlock = cb;
    this.solver = cb.solver;
    this.inlines = [];
    this.lineBoxes = [];
    this.childBoxes = [];
    // this._heightConstraint = null;
  },
  addInline: function(i) {
    // Collect inlines for line box generation.
    this.inlines.push(i);
  },
  generate: function() {
    var ref = this.edges.ref;
    var containing = this.containingBlock.edges.ref;
    var constrain = this.solver.add.bind(this.solver);
    var vars = this.vars;

    constrain(
      // Basic block model
      geq(vars.width, 0, required),
      geq(vars.height, 0, required),
      geq(ref.outer._bottom, ref.outer._top, required),
      geq(ref.outer._right, ref.outer._left, required),
      eq(
        c.plus(ref.outer._left, vars.width),
        ref.outer._right,
        strong
      ),
      eq(
        c.plus(ref.outer._top, vars.height),
        ref.outer._bottom,
        strong
      ),
      eq(ref.outer._left, vars.left, required),
      eq(ref.outer._top, vars.top, required),

      eq(vars.width, this.containingBlock.naturalSize.width, weak),

      // Set our left/right to our containing's
      eq(vars.left, containing.content._left, medium),
      eq(vars.right, containing.content._right, medium)
    );
  },
  fillLineBoxes: function() {
    // console.log("fillLineBoxes() for " + this);
    // return;
    if (!this.inlines.length) { return; }
    var ref = this.edges.ref;
    var containing = this.containingBlock.edges.ref;
    var constrain = this.solver.add.bind(this.solver);
    var vars = this.vars;
    /*
    console.log("our top is:", ref.outer._top.value);
    console.log("our container's top is:", containing.outer._top.value);
    */

    // Create at least one line box, fill it with our inlines until their
    // cumulative widths overflow the block, and then keep going. At the very
    // end, we set our height to be the height of the
    var lb = new LineBox(this);
    lb.below(ref.outer._top);
    var inc = 0;
    this.lineBoxes.push(lb);
    this.childBoxes.push(lb);
    this.inlines.forEach(function(i) {
      if (!lb.canAccept(i)) {
        var nlb = new LineBox(this);
        this.lineBoxes.push(nlb);
        this.childBoxes.push(nlb);
        nlb.below(lb.edges.ref.outer._bottom);
        inc++;
        lb = nlb;
      }
      lb.add(i);
    }, this);

    // console.log("Setting AnonymousBlock bottom to:", lb.edges.ref.outer._bottom.value);
    constrain(eq(ref.content._bottom, lb.edges.ref.outer._bottom, strong));
    // console.log("bottom:", ref.content.bottom, "top:", ref.content.top, "height:", ref.content.height);
  },
});

var LineBox = c.inherit({
  _className: "LineBox",
  debugColor: "rgba(156,250,152,1)", // Lime green.
  // debugColor: "yellow",
  initialize: function(cb){
    this._id = _boxCtr++;
    EdgyLight.call(this);
    VarHeavy.call(this, this.boxProperties);
    this.containingBlock = cb;
    this.solver = cb.solver;
    this.inlines = [];
    this.childBoxes = [];
    this.accumulatedWidth = 0;
    this.maxHeight = 0;
    this._heightConstraint = null;
    this.fitIn();
  },
  boxProperties: [
    "width", "height", "left", "right", "top", "bottom",
  ],
  fitIn: function() {
    var ref = this.edges.ref;
    var containing = this.containingBlock.edges.ref;
    var vals = this.values;
    var vars = this.vars;

    // Michalowski '98, Section 3.2
    // Line-box Constraints

    // FIXME(slightlyoff): need to add the float constraints back in!

    // Basic block model
    this.solver.add(
      geq(vars.width, 0, required),
      geq(vars.height, 0, required),
      eq(ref.outer._left, vars.left, required),
      eq(ref.outer._top, vars.top, required)
    );

    this.solver.add(
      eq(
        c.plus(ref.outer._left, vars.width),
        ref.outer._right,
        weak
      ),
      eq(
        c.plus(ref.outer._top, vars.height),
        ref.outer._bottom,
        weak
      )
    );

    // Set our left/right to our containing's
    this.solver.add(
      eq(vars.width,  this.containingBlock.vars.width, medium),
      eq(vars.left,  this.containingBlock.vars.left, medium),
      eq(ref.outer._right, containing.content._right, medium)
    );
    console.log("fitting LineBox:", this._id, "in width:", this.containingBlock.vars.width.value, this+"", this.containingBlock.containingBlock.naturalSize+"");
  },
  below: function(edge) {
    // console.log("my top:", this.edges.actual.outer._top.value);
    // console.log("container new top edge:", edge.value);
    this.solver.add(
      eq(this.edges.actual.outer._top, edge, strong)
    );
    // console.log("my new top:", this.edges.actual.outer._top.value);
  },
  canAccept: function(inline) {
    var cb = this.containingBlock;
    var io = inline.edges.ref.outer;
    var outerWidth = cb.vars.width.value;
    return (io.width + this.accumulatedWidth <= outerWidth);
  },
  add: function(inline) {
    this.childBoxes.push(inline);
    this.solver.add(
      eq(inline.edges.ref.outer._left,
        c.plus(this.edges.ref.outer._left, this.accumulatedWidth),
         strong
      ),
      eq(inline.edges.ref.outer._top,
         this.edges.ref.outer._top,
         strong
      )
    );
    this.accumulatedWidth += inline.edges.ref.outer.width;
    var inlineHeight = inline.edges.ref.outer.height;
    if (inlineHeight > this.maxHeight) {
      this.maxHeight = inlineHeight;
      if (this._heightConstraint) {
        this.solver.removeConstraint(this._heightConstraint);
      }
      this._heightConstraint = eq(this.vars.height, this.maxHeight, strong)
      this.solver.add(this._heightConstraint);
    }
  },
});

var Viewport = c.inherit({
  extends: Block, // TODO: Block,
  _className: "Viewport", // for toString()
  debugColor: "rgba(233,250,124,1)",
  initialize: function(width, height, node){
    // Viewport:
    //  The item that everything else is realtive to. It takes a source node
    //  whose dimensions it copies, setting margin/padding/border to zero.
    this.solver = new c.SimplexSolver();
    Block.call(this, node, this);
    this.edges.actual = this.edges.ref;
    this.naturalSize = new MeasuredBox(0, 0, width, height);
    this.containingBlock = this;
  },
  generate: function() {
    var w = this.naturalSize.width;
    var h = this.naturalSize.height;
    var ref = this.edges.ref;
    var constrain = this.solver.add.bind(this.solver);

    /*
    constrain(
      eq(this.vars.width, w, required),
      eq(this.vars.height, h, required),
      eq(this.vars.top, 0, required),
      eq(this.vars.left, 0, required),
      eq(this.vars.right, w, required),
      eq(this.vars.bottom, h, required)
    );
    */

    constrain(
      eq(ref.outer._left, 0,   required),
      eq(ref.outer._top, 0,    required),
      eq(ref.outer._right, w,  required),
      eq(ref.outer._bottom, h, required)
    );
    ref.border = ref.padding = ref.content = ref.margin = ref.outer;
  },
});

var Inline = c.inherit({
  extends: RenderBox,
  _className: "Inline", // for toString()
  debugColor: "rgba(154,254,254,1)",
  initialize: function(node, cb){
    RenderBox.call(this, node, cb);
    this._isBlock = false;
    this._isInline = true;
    cb.addInline(this);
  },
});

var InlineBlock = c.inherit({
  extends: Block,
  _className: "InlineBlock",
  initialize: function(node, cb){
    Block.call(this, node, cb, true);
    this._isBlock = true;
    this._isInline = true;
    cb.addInline(this);
  },
});

var TextBox = c.inherit({
  extends: Inline,
  _className: "TextBox", // for toString()
  debugColor: "rgba(173,173,173,1)", // Light grey.
  initialize: function(node, cb, cs){
    this._id = _boxCtr++;
    this.text = node.nodeValue;
    EdgyLight.call(this);
    VarHeavy.call(this, this.boxProperties);
    Nodey.call(this, node, this.boxProperties);
    this.containingBlock = cb;
    this.naturalSize = textSize(node, cs);
    // console.log(this.naturalSize);
    this.solver = this.solver || this.containingBlock.solver;

    this._isInline = true;
    this._isBlock = false;
    this._isBFC = false;
    this._generated = false;
    cb.addInline(this);
  },
  boxProperties: [
    "width", "height", "left", "right", "top", "bottom",
    "font-size", "font-family", "line-height", "color"
  ],
  toString: function() {
    return RenderBox.prototype.toString.call(this) +
      " { width: " + this.vars.width.value +
       ", height: " + this.vars.height.value +
      " } text: \"" + this.text + "\"";
  },
  generate: function() {
    if (this._generated) { return; }
    this._generated = true;

    var ref = this.edges.ref;
    // console.log("TextBox's natural height is:", this.naturalSize.height);
    this.solver.add(
      eq(c.plus(ref.outer._left, this.naturalSize.width), ref.outer._right, strong),
      eq(c.plus(ref.outer._top, this.naturalSize.height), ref.outer._bottom, strong)
    );
  },
});

//////////////////////////////////////////////////////
//  Workhorse functions
//////////////////////////////////////////////////////

var findBoxGenerators = function(element) {
  var doc = element.ownerDocument || document;
  var global = doc.defaultView || scope;
  var NodeFilter = global.NodeFilter;
  var generators = [];
  var nf = NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_DOCUMENT;

  var acceptNode = function(node) {
    // Filter on elements that have some sort of display
    if (node.nodeType == 1) {
      var cs = global.getComputedStyle(node);
      if (
        (cs.getPropertyValue("display") == "none") ||
        (node.id == MEASURE_NODE_ID)
      ) {
        return NodeFilter.FILTER_REJECT;
      }
    }

    return NodeFilter.FILTER_ACCEPT;
  };

  var tw = doc.createTreeWalker(element, nf, acceptNode, false);

  while(tw.nextNode()) {
    generators.push(tw.currentNode);
  }
  return generators;
};

// *Super*-hacky content measurement. Known-busted in the following ways:
//  - does not cascade font sizing/family/line-height/etc. information
//  - likely breaks any/all :before and :after rules
//  - does not measure generated content
//  - probably broken on tables and other element types that need specific
//    hosting parents
// The right answer, of course, is to just plumb through a measurement API from
// WebKit directly and use this only in case of fallback.
var Map = Map || scope.c.HashTable;
var docMeasureNodeMap = new Map();
var getMeasureNode = function(doc) {
  var mn = docMeasureNodeMap.get(doc);
  if (mn) return mn;

  var mn = doc.createElement("div");
  mn.style.display = "inline-block";
  mn.style.position = "absolute";

  mn.style.width = "5000px";
  mn.style.height= "5000px";
  mn.style.left = "-5000px";
  mn.style.top = "-5000px";
  mn.style.visibility = "hidden";
  mn.style.pointerEvents = "none";
  mn.style.padding = "0px";
  mn.style.border = "0px";
  mn.style.margin = "0px";
  mn.id = MEASURE_NODE_ID;
  doc.documentElement.appendChild(mn);
  docMeasureNodeMap.set(doc, mn);
  return mn;
};

var mc;
var getMeasureCanvas = function() {
  if (mc) return mc;

  mc = document.createElement("canvas");
  mc.style.position = "absolute";
  mc.style.left = "-5000px";
  mc.style.top = "-5000px";
  mc.width = "100";
  mc.height = "100";
  mc.style.visibility = "hidden";
  document.body.appendChild(mc);
  return mc;
};

var contentSize = function(node) {
  var w = 0,
      h = 0,
      doc = node.ownerDocument;
  var m = getMeasureNode(doc);
  m.innerHTML = "";
  var c = node.cloneNode(true);
  if (c.nodeType == 1) {
    c.style.width = "auto";
    c.style.left = "0px";
    c.style.top = "0px";
    c.style.height = "auto";
  }
  m.appendChild(c);
  var mb = new MeasuredBox(0, 0, c.scrollWidth, c.scrollHeight);
  return mb;
};

var textSize = function(node) {
  var ctx = getMeasureCanvas().getContext("2d");
  ctx.font = css("font-size", node).raw + " " + css("font-family", node).raw;
  // console.log(css("line-height", node).px);
  return new MeasuredBox(0, 0,
                         ctx.measureText(node.nodeValue).width,
                         css("line-height", node).px);
};

var _layoutFor = function(id, boxesCallback) {
  // TODO(slightlyoff):
  //    Make generic by allowing the current document/scope to be
  //    generated for in addition to same-domain iframes.
  var g = global(id);
  if (!g) {
    console.log("FAIL: couldn't script other window!");
    return;
  }
  var d = doc(id),
      visibleNodes = findBoxGenerators(d.documentElement);

  var viewportNode = document.getElementById(id);
  var dde = d.documentElement;
  var v = new Viewport(viewportNode.clientWidth, viewportNode.clientHeight, dde);

  var nodeToBoxMap = new Map();
  nodeToBoxMap.set(dde, v);

  // Run through the visible nodes, creating box types as needed and setting
  // forward/back/ref references.

  // The most recent document-ordered element that is not absolute, fixed, or float
  var prev = null;
  var containing = v;

  // var containingNode = dde;
  // var containingStack = [{ box: v, node: containingNode }];

  var boxes = [];
  var blocks = [];
  var solver = v.solver;
  var defaultBlockProgression = "tb";

  var getContainingBlock = function(n) {
    // Everything has a containing block. CSS 3 says:
    //
    //      "The containing block of other boxes is the rectangle formed by the
    //      content edge of their nearest ancestor box that is block-level.
    //      This may be an anonymous box. The ‘direction’ and
    //      ‘block-progression’ of the containing block are those of the box
    //      whose content edge it is."
    //
    // Since we've visiting in document order, we can simply look up through
    // our ancestors to see which one is block, else our containing block is
    // the viewport.

    // Positioned elements need positioned parents!
    var pn = n.parentNode;

    if (isFixed(n)) {
      // Fixed elements are always relative to the viewport.
      pn = dde;
    } else {
      if (!isPositioned(n)) {
        while (pn && pn != dde && !isBlock(pn) && !isInlineBlock(pn)) {
          pn = pn.parentNode;
        }
      } else {
        while (pn && pn != dde && !(isBlock(pn) && isPositioned(pn))) {
          pn = pn.parentNode;
        }
      }
    }

    if (!pn) { pn = dde; }
    return nodeToBoxMap.get(pn);
  };

  /*
  var getFlowRoot = function(n) {
    var pn = n.parentNode;
    while (pn && pn != dde && !nodeToBoxMap.get(pn)._isFlowRoot) {
      pn = pn.parentNode;
    }
    if (!pn) { pn = dde; }
    return nodeToBoxMap.get(pn);
  };
  */
  console.time("nodes to boxes");

  visibleNodes.forEach(function(node) {
    var parentBox = nodeToBoxMap.get(node.parentNode);

    var cb = getContainingBlock(node);

    // Boxes in CSS always ahve "containing blocks". Boxes that are in a flow
    // also have "flow roots".
    if (isElement(node)) {
      // TODO(slightlyoff): implement run-in detection
      var b;
      if (isInlineBlock(node)) {
        b = new InlineBlock(node, cb);
        blocks.push(b);
      } else if (isBlock(node)) {
        b = new Block(node, cb);
        blocks.push(b);
      } else if(isInline(node)) {
        b = new Inline(node, cb);
      }

      nodeToBoxMap.set(node, b);
      boxes.push(b);
      prev = b;

    } else {
      // We're a text node, so create text blocks for the constituent words and
      // add them to our container's inlines list.

      //  Could *really* do with access to these right about now:
      //   http://msdn.microsoft.com/en-us/library/windows/desktop/dd319118(v=vs.85).aspx
      //   http://developer.apple.com/library/mac/#documentation/Carbon/Reference/CTLineRef/Reference/reference.html

      // Clobber pure whitespace nodes.
      if (node.nodeValue.search(/[\S]+/g) == -1) { return; }

      var pn = node.parentNode;

      // If we're the first child or last child, collapse whitespace.
      if (node == pn.firstChild) {
        var idx = node.nodeValue.search(/[\S]+/);
        if (idx > 0) {
          // Split off the leading whitespace
          node = node.splitText(idx);
        }
      }

      if (!node.nodeValue) { return; }

      if (node == pn.lastChild) {
        var parts = node.nodeValue.split(/[\s\t]+/)
        var last = parts[parts.length - 1];
        while(!last && parts.length) {
          parts.pop();
          last = parts[parts.length - 1];
        }
        if (!last) { return; }
        node.splitText(node.nodeValue.lastIndexOf(last) + last.length);
      }

      var head = node;
      var tail = null;
      var cs = g.getComputedStyle(pn);
      var result = "";
      var nv = node.nodeValue;
      var match;
      var lastSplit = 0;
      var re = /[\s\t]+/g;
      var b;

      while ((match = re.exec(nv)) != null)  {
        tail = head.splitText(re.lastIndex - lastSplit);
        lastSplit = re.lastIndex;
        b = new TextBox(head, cb, cs);
        b.generate();
        nodeToBoxMap.set(head, b);
        prev = b;
        head = tail;
      }
      if (tail.nodeValue) {
        b = new TextBox(head, cb, cs);
        b.generate();
        nodeToBoxMap.set(head, b);
        prev = b;
      }
    }
  });

  // Add the viewport to the list.
  boxes.unshift(v);
  blocks.unshift(v);

  console.timeEnd("nodes to boxes");

  solver.autoSolve = false;

  // FIXME(slightlyoff):
  //    Add anonymous boxe parents here for text children of flow roots with
  //    other block children.

  // Generate our generic box constraints.
  console.time("add initial constraints");
  boxes.forEach(function(box) { box.generate(); });
  console.timeEnd("add initial constraints");
  console.time("resolve initial constraints");
  solver.resolve();
  console.timeEnd("resolve initial constraints");

  // Genereate constraints to flow all normally-positioned block boxes.
  console.time("flow blocks");
  blocks.forEach(function(block) {
    block.flow();
  });
  console.timeEnd("flow blocks");
  console.time("resolve heights");
  solver.resolve();
  console.timeEnd("resolve heights");

  // Text layout pass. Once our widths have all been determined, we place each
  // text segment and do wrapping. Once we've
  // solved for flowed blocks, we update our container's height to fit and
  // re-solve the entire system. We only call for painting once this has been
  // done everywhere.
  console.time("fill line boxes");
  // FIXME: should be able to disable auto-solve here!
  // solver.autoSolve = true;
  boxes.forEach(function(box) {
    box.fillLineBoxes();
  });
  solver.resolve();
  // solver.autoSolve = false;
  console.timeEnd("fill line boxes");

  // TODO(slightlyoff): sort boxes into stacking contexts for rendering!
  //                    See CSS 2.1 section E.2 for details.

  // boxes.forEach(function(box) { console.log(box+""); });
  // console.log(blocks[0].edges.ref.border);
  // console.dir(blocks[0].vars);

  boxesCallback([v]);
};

scope.layoutFor = function(id, boxesCallback) {
  ready(function() { _layoutFor(id, boxesCallback) }, id);
};

})(this);
