var canvas, context, 
finalPolygons = [], 
addPolygons = [],
subtractPolygons = [],
intersectPolygons = [],
debugPolygon = true
;

var resize = function() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
   // load();
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

var roundTo = function(a) {
    return Math.round(a * 1e5) / 1e5;
}

var isPointInPolygon = function(points, x, y) {
    // Détermine si un point est dans un polygone
    // Fonctionne même quand le polygone a des trous

    // Assertion : points[i] et points[(i + 1) % length] forment un coté du polygone
    var rdp0x, rdp0y, rdp1x, rdp1y;
    var pt = {x:x,y:y};
    pt.x = roundTo(pt.x);
    pt.y = roundTo(pt.y);

    var length = points.length;

    for (var c = false, i = 0; i < length; i++) {
        rdp0x = roundTo(points[i][0]);
        rdp0y = roundTo(points[i][1]);
        rdp1x = roundTo(points[(i + 1) % length][0]);
        rdp1y = roundTo(points[(i + 1) % length][1]);

        if (rdp1y === rdp0y && rdp1y === pt.y) {
            ((rdp0x <= pt.x && pt.x < rdp1x) || (rdp1x <= pt.x && pt.x < rdp0x)) && (c = !c);
        } else {
            ((rdp0y <= pt.y && pt.y < rdp1y) || (rdp1y <= pt.y && pt.y < rdp0y)) && (pt.x <= roundTo((rdp1x - rdp0x) * (pt.y - rdp0y) / (rdp1y - rdp0y) + rdp0x)) && (c = !c);
        }
    }
    return c;
}

function drawPolygon(context, polygon, strokeStyle, fillStyle, dashed) {
    var a = area(polygon);
    context.save();
    if (a < 0 && !dashed) { // polygon is reversed (it is a hole)
        context.fillStyle = "#fafafa";
        context.strokeStyle = "#FF0000";
    } else {
        context.fillStyle = fillStyle;
        context.strokeStyle = strokeStyle;
    }

    context.beginPath();
    if (!dashed) {
        context.save();
            context.lineWidth = 3;
            context.moveTo(polygon[0].x + .5, polygon[0].y + .5); //first vertex
            for (var i = 1; i < polygon.length; i++) {
                context.lineTo(polygon[i].x + .5, polygon[i].y + .5);
            }
            context.closePath();
            context.fill();
            context.stroke();
        context.restore();
    } else {
        context.save();
            context.setLineDash([5, 15]);
            context.moveTo(polygon[0][0] + .5, polygon[0][1] + .5); //first vertex
            for (var i = 1; i < polygon.length; i++) {
                context.lineTo(polygon[i][0] + .5, polygon[i][1] + .5);
            }
            context.closePath();
            context.stroke();
        context.restore();
    }
    context.restore();
}

var load = function() {
    addPolygons.push([
        [canvas.width/2-100, canvas.height/2-100],
        [canvas.width/2+100, canvas.height/2-100],
        [canvas.width/2, canvas.height/2+100]
    ]);

    addPolygons.push([
        [canvas.width/2-75, canvas.height/2-75],
        [canvas.width/2+125, canvas.height/2-75],
        [canvas.width/2, canvas.height/2+125]
    ]);

    subtractPolygons.push([
        [canvas.width/2-50, canvas.height/2-50],
        [canvas.width/2+150, canvas.height/2-50],
        [canvas.width/2, canvas.height/2+150]
    ]);


    return;
}

var getTargeted = function(x,y) {


    for (var i = 0; i < intersectPolygons.length; i++) {
        if (isPointInPolygon(intersectPolygons[i], x, y)) {
            return intersectPolygons[i];
        }
    }
    
    for (var i = 0; i < subtractPolygons.length; i++) {
        if (isPointInPolygon(subtractPolygons[i], x, y)) {
            return subtractPolygons[i];
        }
    }

    for (var i = 0; i < addPolygons.length; i++) {
        if (isPointInPolygon(addPolygons[i], x, y)) {
            return addPolygons[i];
        }
    }



    return false;
}

var selected = false;
var onMouseDown = function(event) { 
    selected = getTargeted(event.pageX, event.pageY);
}
var onMouseUp = function(event) {
    selected = false
}
var onMouseMove = function(event) {
    if (selected) {
        for (var i = 0 ; i < selected.length; i++) {
            selected[i][0] += event.movementX;
            selected[i][1] += event.movementY;
        }
    }
}

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup", onMouseUp);

///ui
var addAddPolygonBtn = document.getElementById("addAddPolygon");
var addSubtractPolygonBtn = document.getElementById("addSubtractPolygon");
var addIntersectPolygonBtn = document.getElementById("addIntersectPolygon");
var addPolygonList = document.getElementById("addList");
var subtractPolygonList = document.getElementById("subtractList");
var intersectPolygonList = document.getElementById("intersectList");

var debugPolygonBtnOn = document.getElementById("debugPolygonBtnOn");
var debugPolygonBtnOff = document.getElementById("debugPolygonBtnOff");
debugPolygonBtnOn.addEventListener('click',function(){debugPolygon=true});
debugPolygonBtnOff.addEventListener('click',function(){debugPolygon=false});

var generateRandomPolygon = function() {
    var amount = 30/100*Math.min(canvas.width, canvas.height);
    if (Math.random() < 0.5) { //triangle
        var polygon = [
            [canvas.width/2 - Math.random()*amount, canvas.height/2 -Math.random()*amount],
            [canvas.width/2 + Math.random()*amount, canvas.height/2 - Math.random()*amount],
            [canvas.width/2, canvas.height/2 +Math.random()*amount],
        ]
    } else { //quadrilatere
        var polygon = [
            [canvas.width/2 - Math.random()*amount, canvas.height/2 -Math.random()*amount],
            [canvas.width/2 + Math.random()*amount, canvas.height/2 - Math.random()*amount],
            [canvas.width/2 + Math.random()*amount, canvas.height/2 + Math.random()*amount],
            [canvas.width/2 - Math.random()*amount, canvas.height/2 + Math.random()*amount],
        ]
    }

    return polygon;
}

addAddPolygonBtn.addEventListener("click", function(){
    addPolygons.push(generateRandomPolygon());
    updateLists();
});

addSubtractPolygonBtn.addEventListener("click", function(){
    subtractPolygons.push(generateRandomPolygon());
    updateLists();
});

addIntersectPolygon.addEventListener("click", function(){
    intersectPolygons.push(generateRandomPolygon());
    updateLists();
});

var deletePolygon = function(event) {
    var type = this.getAttribute('data-type');
    var id = this.getAttribute('data-id');
    var polygonArray = window[type];
    polygonArray.splice(id,1);
    updateLists();
}

var updateList = function(domElement, polygonArrayName) {
    var polygonArray = window[polygonArrayName];
    domElement.innerHTML = "";
    for (var i = 0; i < polygonArray.length; i++) {
        var div = document.createElement("div");
        div.classList.add("polygon");
        div.innerHTML = i+1;
        domElement.appendChild(div);
        div.setAttribute('data-type', polygonArrayName);
        div.setAttribute('data-id', i);
        div.addEventListener('click', deletePolygon);
    }
}

var updateLists = function(){
    updateList(addPolygonList, "addPolygons");
    updateList(subtractPolygonList, "subtractPolygons");
    updateList(intersectPolygonList, "intersectPolygons");
}


window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function render(){
    if (!context) return;

    context.clearRect(0,0,canvas.width, canvas.height);



    if (debugPolygon) {
        //drawPolygon(context, selected, '#009900', '#066', true);
        for (var i = 0; i < addPolygons.length; i++) {
            drawPolygon(context, addPolygons[i], '#009900', '#f0f', true);
        }
        for (var i = 0; i < subtractPolygons.length; i++) {
            drawPolygon(context, subtractPolygons[i], '#990000', '#0ff', true);
        }
        for (var i = 0; i < intersectPolygons.length; i++) {
            drawPolygon(context, intersectPolygons[i], '#000099', '#ff0', true);
        }
    }



    if (addPolygons.length == 0) { return;}
    
    var addPolygon = CSG.fromPolygons([addPolygons[0]]);
    for (var i = 1; i< addPolygons.length; i++){
        addPolygon = addPolygon.union(CSG.fromPolygons([addPolygons[i]]));
    }
    
    var subtractPolygon = false;
    if (subtractPolygons.length > 0) {
        subtractPolygon = CSG.fromPolygons([subtractPolygons[0]]);
        for (var i = 1; i< subtractPolygons.length; i++){
            subtractPolygon = subtractPolygon.union(CSG.fromPolygons([subtractPolygons[i]]));
        }
    }

    var intersectPolygon = false;
    if (intersectPolygons.length > 0) {
        intersectPolygon = CSG.fromPolygons([intersectPolygons[0]]);
        for (var i = 1; i< intersectPolygons.length; i++){
            intersectPolygon = intersectPolygon.union(CSG.fromPolygons([intersectPolygons[i]]));
        }
    }

    var resultPolygon = addPolygon;
    if (subtractPolygon) {
        resultPolygon = resultPolygon.subtract(subtractPolygon);
    }
    if (intersectPolygon) {
        resultPolygon = resultPolygon.intersect(intersectPolygon);
    }

    finalPolygons = resultPolygon.toPolygons();

    finalPolygons.sort(function(a, b) {
        return area(b) - area(a);
    })

    for (var i = 0; i < finalPolygons.length; i++) {
        drawPolygon(context, finalPolygons[i], '#888', 'rgba(0,255,255,0.7)');
    }
}

(function animloop(){
  requestAnimFrame(animloop);
  render();
})();