var TYPE = {};
TYPE.CIRCLE     = 0;
TYPE.RECT       = 1;
TYPE.LINEPATH   = 2;

var PlyList = [];
//var ID = 0;

function generateID() {
    return ID++;
}

function createCircle(options) {
    var circle = new fabric.Circle({
                            radius      : 0, 
                            left        : 0, 
                            top         : 0, 
                            fill        : 'transparent', 
                            stroke      : 'black', 
                            selectable  : false
                        });
                        
    circle.center = new MyPoint(options.e.offsetX, options.e.offsetY);
    
    return circle;
}

function updateCircle(circle, options) {
    var corner = new MyPoint(options.e.offsetX, options.e.offsetY);

    circle.set({
        "radius": MyMath.getLength(circle.center, corner),
        "left"  : circle.center.X - radius,
        "top"   : circle.center.Y - radius
    });
}

function createRect(options) {
    var rect = new fabric.Rect({
        left        : 0, 
        top         : 0, 
        width       : 0,
        height      : 0,
        fill        : 'transparent', 
        stroke      : 'black',
        selectable  : false
    });

    rect.start = new MyPoint(options.e.offsetX, options.e.offsetY);
    return rect;
}

function updateRect(rect, options) {
    var corner = new MyPoint(options.e.offsetX, options.e.offsetY);
    
    rect.set({
        left    : Math.min(rect.start.X, corner.X),
        top     : Math.min(rect.start.Y, corner.Y),
        width   : Math.abs(rect.start.X - corner.X),
        height  : Math.abs(rect.start.Y - corner.Y)
    });
}

function createLinePath() {
    var line = new fabric.Path('M 0 0');
    line.set({ 
                fill: 'transparent', 
                stroke: 'black',
                selectable: false
            });

    return line;
}

function updateLinePath(line, options){
    if(line.path.length === 1 && line.isInit === undefined) {
        line.set({
                    left: options.e.offsetX,
                    top : options.e.offsetY
                });
        line.isInit = true;
        line.start = new MyPoint(options.e.offsetX, options.e.offsetY);
    } else {
        var commandArray = [];
        commandArray[0] = 'L';
        commandArray[1] = options.e.offsetX - line.start.X;
        commandArray[2] = options.e.offsetY - line.start.Y;
        line.path[line.path.length] = commandArray;
        _updateLine(line);
    }
}

function _updateLine(line) {
    var dims = line._parseDimensions(),
        prevDims = line.prevDims || {},
        leftDiff = dims.left - (prevDims.left || 0),
        topDiff = dims.top - (prevDims.top || 0);

    line.setWidth(dims.width);
    line.setHeight(dims.height);
    
    if (dims.left < 0) {
        line.pathOffset.x = line.width/2 + dims.left;
        line.left = line.left + leftDiff;
    } else {
        line.pathOffset.x = line.width/2;
    }
    
    if (dims.top < 0) {
        line.pathOffset.y = line.height/2 + dims.top;
        line.top = line.top + topDiff;
    } else {
         line.pathOffset.y = line.height/2;   
    }
    
    line.prevDims = dims;
    line.setCoords();
}

function _isNotSingle(paths) {
    var num = 0;
    for(var path in paths) {
        num++;
        if(num > 1) {
            return true;
        }
    }
    return false;
}

function _isNotEmpty(paths) {
    var num = 0;
    for(var path in paths) {
        num++;
        if(num > 0) {
            return true;
        }
    }
    return false;
}

function _getPath(obj) {
    if(obj.type === "rect") {
        
        var poly = new MyPolygon();
        
        var point_0 = new MyPoint(obj.start.X,                  obj.start.Y                  );
        var point_1 = new MyPoint(obj.start.X + obj.getWidth(), obj.start.Y                  );
        var point_2 = new MyPoint(obj.start.X + obj.getWidth(), obj.start.Y + obj.getHeight());
        var point_3 = new MyPoint(obj.start.X,                  obj.start.Y + obj.getHeight());
        
        
        var seg_0 = new MySegment(point_0, point_1);
        var seg_1 = new MySegment(point_1, point_2);
        var seg_2 = new MySegment(point_2, point_3);
        var seg_3 = new MySegment(point_3, point_0);
        
        //console.log(seg_0);
        seg_0.next = seg_1;
        seg_1.next = seg_2;
        seg_2.next = seg_3;
        
        seg_3.pre = seg_2;
        seg_2.pre = seg_1;
        seg_1.pre = seg_0;
        
        
        var rectPoly = new MyPolygon();
        
        rectPoly.root = seg_0;
        rectPoly.end = seg_3;
        
        //console.log(rectPoly);
        
        PlyList.push(rectPoly);
        
        
        return [{X: obj.start.X,                    Y: obj.start.Y                  }, 
                {X: obj.start.X + obj.getWidth(),   Y: obj.start.Y                  }, 
                {X: obj.start.X + obj.getWidth(),   Y: obj.start.Y + obj.getHeight()}, 
                {X: obj.start.X,                    Y: obj.start.Y + obj.getHeight()}];
                
    } else if(obj.type === "circle") {
        //circle is not ready
    } else if(obj.type === "path") {
        var path = [];
        for (var i = 0; i < obj.path.length; i++) {
            if(obj.path[i][0] === 'M' || obj.path[i][0] === 'L'){
                path.push(
                          { X: obj.path[i][1] + obj.start.X, 
                            Y: obj.path[i][2] + obj.start.Y}
                         );
            }
        }
        return path;
    }
}

function _copyPath(path) {
    var res = [];
    if (path[0] instanceof Array) {
        for(var i = 0; i < path.length; i++) {
            var tmp = [];
            for(var j = 0; j < path[i].length; j++) {
                //var idx = isReverse ? path[i].length - j - 1: j;
                var point = new MyPoint(path[i][j]);
                tmp.push(point);
            }
            res[i] = tmp;
        }
        
        if (res.length === 1) {
            res = res[0];
        }

    } else {
        for(var i = 0; i < path.length; i++) {
            //var idx = isReverse ? path.length - i - 1: i;
            var point = new MyPoint(path[i]);
            res.push(point);
        }
    }
    return res
}

//get All the segments
function _getSegements(path, type) {
    var res = [];
    switch (type) {
        case TYPE.LINEPATH:
        {
            for(var i = 0; i < path.length - 1; i++) {
                var segment = new MySegment(path[i], path[i+1]);
                res.push(segment);
            }
        }
        break;
        
        case TYPE.RECT:
        {
            for(var i = 0; i < path.length; i++) {
                var segment = new MySegment(path[i], path[(i+1) % path.length]);
                res.push(segment);
            }
        }
        break;
    }
    return res;
}

function _intersectSegmentRect(segement, rect) {
    var res = [];
    var intersect = null;
    var rectSegments = _getSegements(rect, TYPE.RECT);
    
    var record = [];
    for(var i = 0; i < rectSegments.length; i++) {
        var inter = MyMath.lineSegmentsIntersect(segement, rectSegments[i]);
        if(inter) {
            res.push(inter);
            record.push(i);
        }
    }
    
    if (record.length < 2) {
        intersect = null;
    } else if(record[1] - record[0] === 1){
        intersect = [];
        if (record[0] === 0 && record[1] === 1) {
            intersect[0] = [{X:rect[0].X,  Y:rect[0].Y}, 
                            {X:res[0].X,  Y:res[0].Y}, 
                            {X:res[1].X,  Y:res[1].Y}, 
                            {X:rect[2].X,  Y:rect[2].Y},
                            {X:rect[3].X,  Y:rect[3].Y}];
                            
            intersect[1] = [{X:res[0].X,  Y:res[0].Y}, 
                            {X:rect[1].X,  Y:rect[1].Y}, 
                            {X:res[1].X,  Y:res[1].Y}];
        }
        
        if (record[0] === 1 && record[1] === 2) {
            intersect[0] = [{X:rect[0].X,  Y:rect[0].Y}, 
                            {X:rect[1].X,  Y:rect[1].Y}, 
                            {X:res[0].X,  Y:res[0].Y}, 
                            {X:res[1].X,  Y:res[1].Y},
                            {X:rect[3].X,  Y:rect[3].Y}];
                            
            intersect[1] = [{X:res[0].X,  Y:res[0].Y}, 
                            {X:rect[2].X,  Y:rect[2].Y}, 
                            {X:res[1].X,  Y:res[1].Y}];
        }
        
        if (record[0] === 2 && record[1] === 3) {
            intersect[0] = [{X:rect[0].X,  Y:rect[0].Y}, 
                            {X:rect[1].X,  Y:rect[1].Y}, 
                            {X:rect[2].X,  Y:rect[2].Y}, 
                            {X:res[0].X,  Y:res[0].Y},
                            {X:res[1].X,  Y:res[1].Y}];
                            
            intersect[1] = [{X:res[0].X,  Y:res[0].Y}, 
                            {X:rect[3].X,  Y:rect[3].Y}, 
                            {X:res[1].X,  Y:res[1].Y}];
        }
        
        if (record[0] === 0 && record[1] === 3) {
            intersect[0] = [{X:res[0].X,  Y:res[0].Y}, 
                            {X:rect[1].X,  Y:rect[1].Y}, 
                            {X:rect[2].X,  Y:rect[2].Y}, 
                            {X:rect[3].X,  Y:rect[3].Y},
                            {X:res[1].X,  Y:rect[1].Y}];
                            
            intersect[1] = [{X:rect[0].X,  Y:rect[0].Y}, 
                            {X:res[0].X,  Y:res[0].Y}, 
                            {X:res[1].X,  Y:res[1].Y}];
        }
    } else if(record[1] - record[0] === 2){
        intersect = [];
        if (record[0] === 0 && record[1] === 2) {
            intersect[0] = [{X:rect[0].X,  Y:rect[0].Y}, 
                            {X:res[0].X,  Y:res[0].Y}, 
                            {X:res[1].X,  Y:res[1].Y}, 
                            {X:rect[3].X,  Y:rect[3].Y}];
                            
            intersect[1] = [{X:res[0].X,  Y:res[0].Y}, 
                            {X:rect[1].X,  Y:rect[1].Y}, 
                            {X:rect[2].X,  Y:rect[2].Y}, 
                            {X:res[1].X,  Y:res[1].Y}];
        }
        
        if (record[0] === 1 && record[1] === 3) {
            intersect[0] = [{X:rect[0].X,  Y:rect[0].Y}, 
                            {X:rect[1].X,  Y:rect[1].Y}, 
                            {X:res[0].X,  Y:res[0].Y}, 
                            {X:res[1].X,  Y:res[1].Y}];
                            
            intersect[1] = [{X:res[1].X,  Y:res[1].Y}, 
                            {X:res[0].X,  Y:res[0].Y}, 
                            {X:rect[2].X,  Y:rect[2].Y}, 
                            {X:rect[3].X,  Y:rect[3].Y}];
        }
    }
    return intersect;
}

function process(objs) {
    var index = 0;
    var resPolygonArray = [];
    var resPolygonPartsArray = [];
    var resLineArray = [];
    PlyList = [];
    POINT_ID        = 0;
    SEGMENT_ID      = 0;
    POLYGON_ID      = 0;
    POLYGTREE_ID    = 0;
    for(var i = 0; i < objs.length; i++) {
        if (objs[i].type === "path") {
            resLineArray["line_" +index] = _getPath(objs[i]);
            index++;
        } 
        else if (objs[i].type === "rect"){
            resPolygonArray["polygon_" +index] = _getPath(objs[i]);
            index++;
        }
    }

    if (_isNotEmpty(resLineArray)) {
        for(var line in resLineArray) {
            //get all the line segments
            var segements = _getSegements(resLineArray[line], TYPE.LINEPATH);
            for (var rect in resPolygonArray) {
                //calculate the intersection between line and rect
                for(var i = 0; i < segements.length; i++){
                    var intersect = null; 
                    intersect = _intersectSegmentRect(segements[i], resPolygonArray[rect]);
                    
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
    } else {
        resPolygonPartsArray = resPolygonArray;
    }
    
    var cpr = new ClipperLib.Clipper();
    cpr.StrictlySimple = true;
    var solution_intersect = new ClipperLib.Paths();
    var solution_diff = new ClipperLib.Paths();
    var solution_intersect_reverse = new ClipperLib.Paths();
    var solution_diff_reverse = new ClipperLib.Paths();
    
    var breakOut = false;

    while(true && _isNotSingle(resPolygonPartsArray)) {
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
                //debugger;
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
                
                //same bug reverse
                } else if (solution_diff.length === 0 && solution_diff_reverse.length === 0) {
                    continue;
                } 
                //one includes the other
                else if(solution_diff.length === 0 || solution_diff_reverse.length === 0){
                    
                    delete resPolygonPartsArray[key0];
                    delete resPolygonPartsArray[key1];
                    
                    resPolygonPartsArray["polygon_" +index] = solution_diff.length === 0 ? _copyPath(solution_diff_reverse) : _copyPath(solution_diff);
                    index++;
                    
                    for (var j = 0; j < solution_intersect.length; j++) {
                        resPolygonPartsArray["polygon_" +index] = _copyPath(solution_intersect[j]);
                        index++;
                    }
                    
                    breakOut = true;
                    break;
                } else {
                    //debugger;
                    delete resPolygonPartsArray[key0];
                    delete resPolygonPartsArray[key1];
                    
                    resPolygonPartsArray["polygon_" +index] = _copyPath(solution_intersect);
                    index++;
                    
                    resPolygonPartsArray["polygon_" +index] = _copyPath(solution_diff);
                    index++;
                    
                    resPolygonPartsArray["polygon_" +index] = _copyPath(solution_diff_reverse);
                    index++;
                    
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
    console.log(PlyList);
    
    mapping(PlyList, resPolygonPartsArray);
    
    
    //console.log(resLineArray);
}

function mapping(myList, pathList) {
    
}
