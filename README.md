# csg2d.js
A 2D port from CSG 3D library

largely inspired by https://github.com/evanw/csg.js

# Usage

```javascript
var subjectPolygon = CSG.fromPolygons([[10, 10], [100, 10], [50, 140]]);
var clipPolygon = CSG.fromPolygons([[10, 100], [50, 10], [100, 100]]);

var subtractPolygons = subjectPolygon.subtract(clipPolygon).toPolygons();
var unionPolygons = subjectPolygon.union(clipPolygon).toPolygons();
var intersectPolygons = subjectPolygon.intersect(clipPolygon).toPolygons();
```
