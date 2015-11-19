# csg2d.js
A 2D port from CSG 3D library

largely inspired by https://github.com/evanw/csg.js

# Usage

```javascript
var subjectPolygon = CSG.fromPolygons([[[10, 10], [100, 10], [50, 140]]]);
var clipPolygon = CSG.fromPolygons([[[10, 100], [50, 10], [100, 100]]]);
// note: this syntax is also accepted
// var clipPolygon = CSG.fromPolygons([[{x:10, y:100}, {x:50, y:10}, {x:100, y:100}]]);

var subtractPolygons = subjectPolygon.subtract(clipPolygon).toPolygons();
var unionPolygons = subjectPolygon.union(clipPolygon).toPolygons();
var intersectPolygons = subjectPolygon.intersect(clipPolygon).toPolygons();

/*
return [
  [ {x:x1, y:y1} , ... , {x:xN, y:yN} ], //polygon #1
  ...
  [ {x:x1, y:y1} , ... , {x:xN, y:yN} ], //polygon #K
]
*/
```
<<<<<<< HEAD
=======

# Example

http://come.github.io/csg2d.js/
>>>>>>> master
