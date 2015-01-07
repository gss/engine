/**
 * Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 */

(function(scope) {
"use strict";

var pathWithStyle = function(ctx, points, color, width, style) {
  var dashLength = 5,
      spaceLength = 0,
      lineCap = "butt",
      color = color || "black",
      width = width || 2;

  switch (style) {
    case "dashed":
      dashLength = 5;
      spaceLength = 3;
      break;
    case "dotted":
      dashLength = defaultDashLength;
      spaceLength = defaultspaceLength;
      lineCap = "round";
      break;
    case "solid":
      lineCap = "square";
    default:
      break;
  }

  // ctx.save();
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = lineCap;


  var dashRemainder = 0;
  var point = points.shift();
  var x = point.x;
  var y = point.y;
  // console.log("moveTo:", x, y);
  ctx.moveTo(x, y);
  points.push(point);
  points.forEach(function(point) {
    var xd = point.x;
    var yd = point.y;
    // console.log("moveTo:", xd, yd);
    var distance = Math.sqrt(Math.pow(xd - x, 2) + Math.pow(yd - y, 2));
    // console.log(x, y, xd, yd, distance);
    // FIXME(slightlyoff): alternate path/space to respect line style!
    ctx.lineTo(xd, yd);
    x = xd;
    y = yd;
  });

  ctx.stroke();
  ctx.closePath();
  // ctx.restore();
};

var paintOutline = function(box, ctx) {
  var b = box.edges.actual.border;
  // console.log("paintOutline:", box.toString());
  // console.log("painting border:", box._id, box.css("border-width").px, box.css("border-style").raw, box.css("border-color").raw);
  var ow = parseInt(box.css("outline-width").px);
  var how = ow/2;

  // console.log("outline style:", box.css("outline-style").raw, "for " + box);

  if (box.css("outline-style").raw != "none") {
    // console.log("outline:", box.css("outline-width"), box.css("outline-style"), box.css("outline-color"));
    pathWithStyle(
        ctx,
        [ { x: b.left - how, 
            y: b.top - how },
          { x: b.right + how, 
            y: b.top - how },
          { x: b.right + how, 
            y: b.bottom + how },
          { x: b.left - how, 
            y: b.bottom + how } ],
        box.css("outline-color").raw,
        ow,
        "solid"
    );
  }
};

var fillBlockColor = function(left, top, width, height, color, ctx) {
  ctx.moveTo(left, top);

  // console.log(box.css("background-color").raw);
  ctx.fillStyle = color;
  ctx.fillRect(left, top, width, height);
};

var paintBackground = function(box, ctx) {
  if (!box.node) return;
  var b = box.edges.actual.border;
  fillBlockColor(b.left, b.top, b.width, b.height, box.css("background-color").raw, ctx);

  // console.log("background:", ctx.fillStyle, b.left, b.top, b.width, b.height);

  // FIXME: need to paint background images!

  // FIXME: need to paint background gradients.
  
  // FIXME: need to respect border clipping (rounded corners, etc.) here.
};

var fillBoxMargin = function(box, ctx) {
  var b = box.edges.actual.outer;
  fillBlockColor(b.left, b.top, b.width, b.height, box.debugColor, ctx);
};

var paintBorder = function(box, ctx) {
  if (!box.node) return;
  var b = box.edges.actual.border;
  // var b = box.edges.actual.content;
  // Gecko doesn't like giving us "border-width", "border-color",
  // "border-style", etc., so we default to some edge to grab them from.
  if (box.css("border-top-style").raw != "none") {
    // console.log(box.node);
    var btw = box.css("border-top-width").px;
    var top = b.top + btw/2;
    var brw = box.css("border-right-width").px;
    var right = b.right - brw / 2;
    var bbw = box.css("border-bottom-width").px;
    var bottom = b.bottom + bbw; // / 2;
    var blw = box.css("border-left-width").px;
    var left = b.left + blw / 2;

    // console.log("top:", top, "right:", right, "bottom:", bottom, "left:", left, "height:", b.height, "width:", b.width);

    pathWithStyle(
        ctx,
        [
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ],
        box.css("border-top-color").raw,
        btw,
        box.css("border-top-style").raw
    );
  }
};

var paintText = function(box, ctx) {
  var o = box.edges.actual.outer;
  ctx.font = box.css("font-size").raw + " " + box.value("font-family").raw;
  // ctx.strokeText(box.text, c.left, c.top);
  // console.log(box.css("color").raw);
  ctx.fillStyle = box.value("color").raw;
  // var y = c.top + box.css("line-height").px;
  // console.log("line-height:", box.css("line-height"), "y:", y);
  ctx.textBaseline = "top",
  ctx.fillText(box.text, o.left, o.top);
};

var _renderTo = function(boxes, ctx) {
  // Recursive version.
  boxes.forEach(function(box) {
    // Paint each item. See CSS 2.1 section E.2 for details.
    if (scope.renderDebug) {
      fillBoxMargin(box, ctx);
    }
    if (box.text) {
      paintText(box, ctx);
      paintOutline(box, ctx);
    } else if (box.node) {
      paintBackground(box, ctx);
      paintBorder(box, ctx);
      // ...
      paintOutline(box, ctx);
    }

    // FIXME(slightlyoff): Do the other 11 paint steps!
    if (box.childBoxes) {
      _renderTo(box.childBoxes, ctx);
    }
  });
};

scope.renderTo = function(id, boxes) {
  var n = document.getElementById(id);
  var ctx = n.getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, n.scrollWidth, n.scrollHeight);
  ctx.translate(30, 30);
  _renderTo(boxes, ctx);
  ctx.restore();
};

})(this);
