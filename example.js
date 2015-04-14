var canvas, context;

var resize = function() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    context.translate(canvas.width / 2, canvas.height / 2);
    load();
}

window.addEventListener("resize", resize);
window.addEventListener("load", resize);

var area = function(polygon) {
    var n = polygon.length;
    var a = 0.0;
    for (var p = n - 1, q = 0; q < n; p = q++) {
        a += polygon[p].x * polygon[q].y - polygon[q].x * polygon[p].y;
    }
    return a * 0.5;
};

var toCSGPolygons = function(polygons) {
    var csgPolygons = [];
    var n = new CSG.Vector(0, 1);
    for (var i = 0; i < polygons.length; i++) {
        var csgPolygonsPoints = [];
        for (var j = 0; j < polygons[i].length; j++) {
            csgPolygonsPoints.push(new CSG.Vertex(new CSG.Vector(polygons[i][j][0], polygons[i][j][1]), n));
        }
        var poly = new CSG.Polygon(csgPolygonsPoints, {});
        csgPolygons.push(poly);
    }
    return CSG.fromPolygons(csgPolygons);
}

function drawPolygon(context, polygon, strokeStyle, fillStyle) {
    var a = area(polygon);
    if (a < 0) { // polygon is reversed (it is a hole)
        context.fillStyle = "#fafafa";
        context.strokeStyle = "#FF0000";
    } else {
        context.fillStyle = fillStyle;
        context.strokeStyle = strokeStyle;
    }

    context.beginPath();
    context.moveTo(polygon[0].x + .5, polygon[0].y + .5); //first vertex
    for (var i = 1; i < polygon.length; i++) {
        context.lineTo(polygon[i].x + .5, polygon[i].y + .5);
    }

    context.closePath();
    context.fill();
    context.stroke();
}

var load = function() {
    // var subjectPolygon = [[120, 10], [140, 10], [180, 10], [180, 20], [180, 200], [160, 200], [160, 20], [140, 20], [140, 400], [120, 400]],
    //     clipPolygon = [[100, 100], [300, 100], [300, 300], [100, 300]];

    var subjectPolygon = [
        [10, 10],
        [100, 10],
        [50, 140]
    ];
    var clipPolygon = [
        [10, 100],
        [50, 10],
        [100, 100]
    ];
    var clipPolygon2 = [
        [20, 20],
        [80, 20],
        [50, 120]
    ];
    var clipPolygon3 = [
        [50, 100],
        [100, 0],
        [150, 100]
    ];
    var clipPolygon4 = [
        [0, 40],
        [400, 40],
        [400, 50],
        [0, 50]
    ];

    var csgSubject = toCSGPolygons([subjectPolygon]);
    var csgClip = toCSGPolygons([clipPolygon]);
    var csgClip2 = toCSGPolygons([clipPolygon2]);
    var csgClip3 = toCSGPolygons([clipPolygon3]);
    var csgClip4 = toCSGPolygons([clipPolygon4]);

    var clippedPolygon = csgSubject.union(csgClip);
    clippedPolygon = csgSubject.union(csgClip3);
    // clippedPolygon = clippedPolygon.subtract(csgClip2);
    // clippedPolygon = clippedPolygon.union(csgClip);

    clippedPolygon = clippedPolygon.subtract(csgClip2);
    clippedPolygon = clippedPolygon.union(csgClip4);

    var polygons = clippedPolygon.toPolygons();

    polygons.sort(function(a, b) {
        return area(b) - area(a);
    })

    for (var i = 0; i < polygons.length; i++) {
        drawPolygon(context, polygons[i], '#888', '#0ff');
    }
}