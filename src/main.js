var TYPE = {};
TYPE.CIRCLE     = 0;
TYPE.RECT       = 1;
TYPE.LINEPATH   = 2;

var canvas = null;
var type = TYPE.RECT;

function onCirle(){
    type = TYPE.CIRCLE;
}

function onRect(){
    type = TYPE.RECT;
}

function onLinePath(){
    type = TYPE.LINEPATH;
    canvas.add(createLinePath());
}

function onStop() {
    type = null;
};

function onClear() {
    canvas.clear();
};

function onOutput() {
    var objs = canvas.getObjects();
    var index = 0;
    var resPolygonArray = [];
    var resPolygonPartsArray = [];
    var resLineArray = [];
    
    for(var i = 0; i < objs.length; i++) {
        if (objs[i].type === "path") {
            resLineArray["line_" +index] = getPath(objs[i]);
        } else{
            resPolygonArray["polygon_" +index] = getPath(objs[i]);
        }
        index++;
    }

    for(var line in resLineArray) {
        //get all the line segments
        var segements = getSegements(resLineArray[line]);
        for (var rect in resPolygonArray) {
            //calculate the intersection between line and rect
            for(var i = 0; i < segements.length; i++){
                var intersect = null; 
                intersect = lineIntersectWithRect(segements[i], resPolygonArray[rect]);
                
                if(intersect) {
                    resPolygonPartsArray["polygon_" + index] = intersect[0];
                    index++;
                    resPolygonPartsArray["polygon_" + index] = intersect[1];
                    index++;
                } else {
                    if(!resPolygonPartsArray[rect]) {
                        resPolygonPartsArray[rect] = resPolygonArray[rect];
                    }
                }
            }
            
        }
    }

    var cpr = new ClipperLib.Clipper();
    cpr.StrictlySimple = true;
    var solution_intersect = new ClipperLib.Paths();
    var solution_diff = new ClipperLib.Paths();
    var solution_intersect_reverse = new ClipperLib.Paths();
    var solution_diff_reverse = new ClipperLib.Paths();
    
    var breakOut = false;

    while(true && isNotSingle(resPolygonPartsArray)) {
        for (var key0 in resPolygonPartsArray) {
            for (var key1 in resPolygonPartsArray) {
                breakOut = false;
                
                //skip if same
                if (key0 === key1) {
                    continue;
                }
                
                //calculate positive
                cpr.Clear();
                if(resPolygonPartsArray[key0][0] instanceof Array) {
                    cpr.AddPaths(resPolygonPartsArray[key0], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }else {
                    cpr.AddPath(resPolygonPartsArray[key0], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }
                
                if(resPolygonPartsArray[key1][0] instanceof Array) {
                    cpr.AddPaths(resPolygonPartsArray[key1], ClipperLib.PolyType.ptClip, true);
                }else {
                    cpr.AddPath(resPolygonPartsArray[key1], ClipperLib.PolyType.ptClip, true);
                }
                
                cpr.Execute(ClipperLib.ClipType.ctIntersection, solution_intersect, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                cpr.Execute(ClipperLib.ClipType.ctDifference,   solution_diff,      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                
                //calculate with reverse
                cpr.Clear();
                if(resPolygonPartsArray[key1][0] instanceof Array) {
                    cpr.AddPaths(resPolygonPartsArray[key1], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }else {
                    cpr.AddPath(resPolygonPartsArray[key1], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }
                
                if(resPolygonPartsArray[key0][0] instanceof Array) {
                    cpr.AddPaths(resPolygonPartsArray[key0], ClipperLib.PolyType.ptClip, true);
                }else {
                    cpr.AddPath(resPolygonPartsArray[key0], ClipperLib.PolyType.ptClip, true);
                }
                cpr.Execute(ClipperLib.ClipType.ctIntersection, solution_intersect_reverse, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                cpr.Execute(ClipperLib.ClipType.ctDifference,   solution_diff_reverse,      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                
                //no intersection
                if (solution_intersect.length === 0) {
                    continue;
                
                //one includes the other
                } else if(solution_diff.length === 0 || solution_diff_reverse.length === 0){
                    
                    delete resPolygonPartsArray[key0];
                    delete resPolygonPartsArray[key1];
                    
                    resPolygonPartsArray["polygon_" +index] = solution_diff.length === 0 ? addPathXOR(solution_diff_reverse) : addPathXOR(solution_diff);
                    index++;
                    
                    breakOut = true;
                    break;
                } else {
                    delete resPolygonPartsArray[key0];
                    delete resPolygonPartsArray[key1];
                    
                    for(var i = 0; i < solution_intersect.length; i++) {
                        resPolygonPartsArray["polygon_" +index] = addPath(solution_intersect[i]);
                        index++;
                    }
                    
                    for(var i = 0; i < solution_diff.length; i++) {
                        resPolygonPartsArray["polygon_" +index] = addPath(solution_diff[i]);
                        index++;
                    }
                    
                    for(var i = 0; i < solution_diff_reverse.length; i++) {
                        resPolygonPartsArray["polygon_" +index] = addPath(solution_diff_reverse[i]);
                        index++;
                    }
                    breakOut = true;
                    break;
                }
            }
            if (breakOut) {
                break;
            }
        }
        if(!breakOut) {
            break;
        }
    }

    console.log(resPolygonPartsArray);
    console.log(resLineArray);
    
};

function onMouseDown(options) {
    
    switch (type) {
        case TYPE.CIRCLE:
            canvas.add(createCircle(options));
        break;
        
        case TYPE.RECT :
            canvas.add(createRect(options));
        break;   
        
        case TYPE.LINEPATH:
        {
            var objs = canvas.getObjects();
            var obj = objs[objs.length - 1];
            updateLinePath(obj, options);
        }
        break;
    }
};

function onMouseUp(options) {
    canvas.renderAll();
};

function onMouseMove(options) {
    if (options.e.buttons === 1) {
        var objs = canvas.getObjects();
        var obj = objs[objs.length - 1];
        switch (type) {
            case TYPE.CIRCLE:
                updateCircle(obj, options);
            break;
            
            case TYPE.RECT:
                updateRect(obj, options);
            break;
            
            case TYPE.LINEPATH:
                
            break;
        }
    }
    
    
    canvas.renderAll();
};

function main() {
    canvas = new fabric.Canvas('canvas');
    
    canvas.on('mouse:down', onMouseDown);
    
    canvas.on('mouse:up', onMouseUp);
    
    canvas.on('mouse:move', onMouseMove);
}

