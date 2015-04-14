// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on 2D polygons elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm.
// 
// Example usage:
// 
//     var subjectPolygon = [[10, 10], [100, 10], [50, 140]];
//     var clipPolygon = [[10, 100], [50, 10], [100, 100]];
//     var polygons = subjectPolygon.subtract(clipPolygon).toPolygons();
// 
// ## Implementation Details
// 
// All CSG operations are implemented in terms of two functions, `clipTo()` and
// `invert()`, which remove parts of a BSP tree inside another BSP tree and swap
// solid and empty space, respectively. To find the union of `a` and `b`, we
// want to remove everything in `a` inside `b` and everything in `b` inside `a`,
// then combine polygons from `a` and `b` into one solid:
// 
//     a.clipTo(b);
//     b.clipTo(a);
//     a.build(b.allPolygons());
// 
// The only tricky part is handling overlapping coplanar polygons in both trees.
// The code above keeps both copies, but we need to keep them in one tree and
// remove them in the other tree. To remove them from `b` we can clip the
// inverse of `b` against `a`. The code for union now looks like this:
// 
//     a.clipTo(b);
//     b.clipTo(a);
//     b.invert();
//     b.clipTo(a);
//     b.invert();
//     a.build(b.allPolygons());
// 
// Subtraction and intersection naturally follow from set operations. If
// union is `A | B`, subtraction is `A - B = ~(~A | B)` and intersection is
// `A & B = ~(~A | ~B)` where `~` is the complement operator.
// 
// ## License
// 
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.

// # class CSG

// Holds a binary space partition tree representing a 3D solid. Two solids can
// be combined using the `union()`, `subtract()`, and `intersect()` methods.

CSG = function() {
  this.segments = [];
};

CSG.fromSegments = function(segments) {
  var csg = new CSG();
  csg.segments = segments;
  return csg;
};

// Construct a CSG solid from a list of `CSG.Polygon` instances.
CSG.fromPolygons = function(polygons) {
  var csg = new CSG();
  csg.segments = [];
  for (var i = 0; i < polygons.length; i++) {
    for (var j = 0; j < polygons[i].vertices.length; j++) {
      var k = (j+1)%(polygons[i].vertices.length);
      csg.segments.push(new CSG.Segment([polygons[i].vertices[j],polygons[i].vertices[k]]));
    }
  }
  return csg;
};

CSG.prototype = {
  clone: function() {
    var csg = new CSG();
    csg.segments = this.segments.map(function(p) { return p.clone(); });
    return csg;
  },

  toSegments: function() {
    return this.segments;
  },

  toPolygons: function() {
    var segments = this.toSegments();

    var polygons = [];

    var list = segments.slice();

    var findNext = function(extremum) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].vertices[0].pos.squaredLengthTo(extremum) < 1) {
          var result = list[i].clone();
          list.splice(i,1);
          return result;
        }
      }
      return false;
    }
    var currentIndex = 0;
    while(list.length > 0){
      polygons[currentIndex] = polygons[currentIndex] || [];
      if (polygons[currentIndex].length == 0) {
        polygons[currentIndex].push(list[0].vertices[0].pos);
        polygons[currentIndex].push(list[0].vertices[1].pos);
        list.splice(0,1);
      }

      var next = findNext(polygons[currentIndex][polygons[currentIndex].length-1]);
      if (next) {
        polygons[currentIndex].push(next.vertices[1].pos);
      } else {
        currentIndex++;
      }
    }

    return polygons;
  },

  // Return a new CSG solid representing space in either this solid or in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  // 
  //     A.union(B)
  // 
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |       +----+
  //     +----+--+    |       +----+       |
  //          |   B   |            |       |
  //          |       |            |       |
  //          +-------+            +-------+
  // 
  union: function(csg) {
    var a = new CSG.Node(this.clone().segments);
    var b = new CSG.Node(csg.clone().segments);
    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allSegments());
    a.invert();
    return CSG.fromSegments(a.allSegments());
  },
  

  // Return a new CSG solid representing space in this solid but not in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  // 
  //     A.subtract(B)
  // 
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |    +--+
  //     +----+--+    |       +----+
  //          |   B   |
  //          |       |
  //          +-------+
  // 
  subtract: function(csg) {
    var b = new CSG.Node(this.clone().segments);
    var a = new CSG.Node(csg.clone().segments);
    a.invert();
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allSegments());
    a.invert();
    return CSG.fromSegments(a.allSegments()).inverse();
  },

  // Return a new CSG solid representing space both this solid and in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  // 
  //     A.intersect(B)
  // 
  //     +-------+
  //     |       |
  //     |   A   |
  //     |    +--+----+   =   +--+
  //     +----+--+    |       +--+
  //          |   B   |
  //          |       |
  //          +-------+
  // 
  intersect: function(csg) {
    var a = new CSG.Node(this.clone().segments);
    var b = new CSG.Node(csg.clone().segments);
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allSegments());
    return CSG.fromSegments(a.allSegments());
  },

  // Return a new CSG solid with solid and empty space switched. This solid is
  // not modified.
  inverse: function() {
    var csg = this.clone();
    csg.segments.map(function(p) { p.flip(); });
    return csg;
  }
};

// # class Vector

// Represents a 3D vector.
// 
// Example usage:
// 
//     new CSG.Vector(1, 2);
//     new CSG.Vector([1, 2]);
//     new CSG.Vector({ x: 1, y: 2 });

CSG.Vector = function(x, y) {
  if (arguments.length == 2) {
    this.x = x;
    this.y = y;
  } else if ('x' in x) {
    this.x = x.x;
    this.y = x.y;
  } else {
    this.x = x[0];
    this.y = x[1];
  }
};

CSG.Vector.prototype = {
  clone: function() {
    return new CSG.Vector(this.x, this.y);
  },

  negated: function() {
    return new CSG.Vector(-this.x, -this.y);
  },

  plus: function(a) {
    return new CSG.Vector(this.x + a.x, this.y + a.y);
  },

  minus: function(a) {
    return new CSG.Vector(this.x - a.x, this.y - a.y);
  },

  times: function(a) {
    return new CSG.Vector(this.x * a, this.y * a);
  },

  dividedBy: function(a) {
    return new CSG.Vector(this.x / a, this.y / a);
  },

  dot: function(a) {
    return this.x * a.x + this.y * a.y;
  },

  lerp: function(a, t) {
    return this.plus(a.minus(this).times(t));
  },

  length: function() {
    return Math.sqrt(this.dot(this));
  },

  unit: function() {
    return this.dividedBy(this.length());
  },

  squaredLengthTo: function(b) {
    return (this.x - b.x)*(this.x - b.x) + (this.y - b.y)*(this.y - b.y);
  }
};
 
// # class Vertex

// Represents a vertex of a segment. Use your own vertex class instead of this
// one to provide additional features like texture coordinates and vertex
// colors. Custom vertex classes need to provide a `pos` property and `clone()`,
// `flip()`, and `interpolate()` methods that behave analogous to the ones
// defined by `CSG.Vertex`. This class provides `normal` so convenience
// functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
// is not used anywhere else.

CSG.Vertex = function(pos, normal) {
  this.pos = new CSG.Vector(pos);
  this.normal = new CSG.Vector(normal);
};

CSG.Vertex.prototype = {
  clone: function() {
    return new CSG.Vertex(this.pos.clone(), this.normal.clone());
  },

  // Invert all orientation-specific data (e.g. vertex normal). Called when the
  // orientation of a polygon is flipped.
  flip: function() {
    this.normal = this.normal.negated();
  },

  // Create a new vertex between this vertex and `other` by linearly
  // interpolating all properties using a parameter of `t`. Subclasses should
  // override this to interpolate additional properties.
  interpolate: function(other, t) {
    return new CSG.Vertex(
      this.pos.lerp(other.pos, t),
      this.normal.lerp(other.normal, t)
    );
  }
};

// # class line

CSG.Line = function(origin, direction) {
  this.origin = origin;
  this.direction = direction;
  this.normal = (new CSG.Vector(this.direction.y, - this.direction.x));
};

CSG.Line.EPSILON = 1e-5;

CSG.Line.fromPoints = function(a, b) {
  var dir = b.minus(a).unit();
  return new CSG.Line(a, dir);
};

CSG.Line.prototype = {
  clone: function() {
    return new CSG.Line(this.origin.clone(), this.direction.clone());
  },

  flip: function() {
    this.direction = this.direction.negated();
    this.normal = this.normal.negated();
  },

  // Split `segment` by this line if needed, then put the segment or segment
  // fragments in the appropriate lists. Colinear segments go into either
  // `colinearRight` or `colinearLeft` depending on their orientation with
  // respect to this line. segments in right or in left of this line go into
  // either `right` or `left`.
  splitSegment: function(segment, colinearRight, colinearLeft, right, left) {
    var COLINEAR = 0;
    var RIGHT = 1;
    var LEFT = 2;
    var SPANNING = 3;

    // Classify each point as well as the entire polygon into one of the above
    // four classes.
    var segmentType = 0;
    var types = [];
    for (var i = 0; i < segment.vertices.length; i++) {
      var t = this.normal.dot(segment.vertices[i].pos.minus(this.origin));
      var type = (t < -CSG.Line.EPSILON) ? RIGHT : (t > CSG.Line.EPSILON) ? LEFT : COLINEAR;
      segmentType |= type;
      types.push(type);
    }

    // Put the segment in the correct list, splitting it when necessary.
    switch (segmentType) {
      case COLINEAR:
        (t > 0 ? colinearRight : colinearLeft).push(segment);
        break;
      case RIGHT:
        right.push(segment);
        break;
      case LEFT:
        left.push(segment);
        break;
      case SPANNING: //TODO
        var r = [], l = [];
        var ti = types[0], tj = types[1];
        var vi = segment.vertices[0], vj = segment.vertices[1];
        if (ti == RIGHT && tj == RIGHT) { r.push(vi); r.push(vj); }
        if (ti == LEFT && tj == LEFT) { l.push(vi); l.push(vj); }
        if (ti == RIGHT && tj == LEFT) {
          var t = (this.normal.dot(this.origin.minus(vi.pos))) / this.normal.dot(vj.pos.minus(vi.pos));
          var v = vi.interpolate(vj, t);
          r.push(vi);
          r.push(v);
          l.push(v.clone());
          l.push(vj);
        }
        if (ti == LEFT && tj == RIGHT) {
          var t = (this.normal.dot(this.origin.minus(vi.pos))) / this.normal.dot(vj.pos.minus(vi.pos));
          var v = vi.interpolate(vj, t);
          l.push(vi);
          l.push(v);
          r.push(v.clone());
          r.push(vj);
        }
        if (r.length >= 2) {
          right.push(new CSG.Segment(r, segment.shared));
        }

        if (l.length >= 2) {
          left.push(new CSG.Segment(l, segment.shared));
        }
        break;
    }
  }
};

// # class Polygon

// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
// 
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).

CSG.Polygon = function(vertices, shared) {
  this.vertices = vertices;
  this.shared = shared;
  this.line = CSG.Line.fromPoints(vertices[0].pos, vertices[1].pos);
};

CSG.Polygon.prototype = {
  clone: function() {
    var vertices = this.vertices.map(function(v) { return v.clone(); });
    return new CSG.Polygon(vertices, this.shared);
  },

  flip: function() {
    this.vertices.reverse().map(function(v) { v.flip(); });
    this.line.flip();
  }
};

// # class Segment

// Represents a convex segment. The vertices used to initialize a segment must
// be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
// 
// Each convex segment has a `shared` property, which is shared between all
// segments that are clones of each other or were split from the same segment.
// This can be used to define per-segment properties (such as surface color).

CSG.Segment = function(vertices, shared) {
  this.vertices = vertices;
  this.shared = shared;
  this.line = CSG.Line.fromPoints(vertices[0].pos, vertices[1].pos);
};

CSG.Segment.prototype = {
  clone: function() {
    var vertices = this.vertices.map(function(v) { return v.clone(); });
    return new CSG.Segment(vertices, this.shared);
  },

  flip: function() {
    this.vertices.reverse().map(function(v) { v.flip(); });
    this.line.flip();
  }
};

// # class Node

// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the right and/or left subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.

CSG.Node = function(segments) {
  this.line = null;
  this.right = null;
  this.left = null;
  this.segments = [];
  if (segments) this.build(segments);
};

CSG.Node.prototype = {
  clone: function() {
    var node = new CSG.Node();
    node.line = this.line && this.line.clone();
    node.right = this.right && this.right.clone();
    node.left = this.left && this.left.clone();
    note.segments = this.segments.map(function(p) { return p.clone(); });
    return node;
  },

  // Convert solid space to empty space and empty space to solid space.
  invert: function() {
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].flip();
    }
    this.line.flip();
    if (this.right) this.right.invert();
    if (this.left) this.left.invert();
    var temp = this.right;
    this.right = this.left;
    this.left = temp;
  },

  // Recursively remove all segments in `segments` that are inside this BSP
  // tree.

  clipSegments: function(segments) {
    if (!this.line) return segments.slice();
    var right = [], left = [];
    for (var i = 0; i < segments.length; i++) {
      this.line.splitSegment(segments[i], right, left, right, left);
    }
    if (this.right) right = this.right.clipSegments(right);
    if (this.left) left = this.left.clipSegments(left);
    else left = [];
    return right.concat(left);
  },

  // Remove all segments in this BSP tree that are inside the other BSP tree
  // `bsp`.
  clipTo: function(bsp) {
    this.segments = bsp.clipSegments(this.segments);
    if (this.right) this.right.clipTo(bsp);
    if (this.left) this.left.clipTo(bsp);
  },

  // Return a list of all segments in this BSP tree.
  allSegments: function() {
    var segments = this.segments.slice();
    if (this.right) segments = segments.concat(this.right.allSegments());
    if (this.left) segments = segments.concat(this.left.allSegments());
    return segments;
  },

  // Build a BSP tree out of `segments`. When called on an existing tree, the
  // new segments are filtered down to the bottom of the tree and become new
  // nodes there. Each set of segments is partitioned using the first polygon
  // (no heuristic is used to pick a good split).
  build: function(segments) {
    if (!segments.length) return;
    if (!this.line) this.line = segments[0].line.clone();
    var right = [], left = [];
    for (var i = 0; i < segments.length; i++) {
      this.line.splitSegment(segments[i], this.segments, this.segments, right, left);
    }
    if (right.length) {
      if (!this.right) this.right = new CSG.Node();
      this.right.build(right);
    }
    if (left.length) {
      if (!this.left) this.left = new CSG.Node();
      this.left.build(left);
    }
  }
};
