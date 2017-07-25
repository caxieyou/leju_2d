//Support 3 types
var TYPE = {
    CIRCLE : 0,
    RECT   : 1,
    LINE   : 2
};

//All the elements created on the GUI
var ElementsPool = {};
var LinePool = {};
var GUI = {};

GUI.CIRCLE = {};
GUI.RECT = {};
GUI.LINE = {};

GUI.CIRCLE.create = function(options) {
    var circle = new fabric.Circle({
                            radius      : 0, 
                            left        : 0, 
                            top         : 0, 
                            fill        : 'transparent', 
                            stroke      : 'black', 
                            selectable  : false
                        });
                        
    circle.center = new ClipperLib.IntPoint(options.e.offsetX, options.e.offsetY);
    
    return circle;
};

GUI.CIRCLE.update = function(circle, options) {
    var corner = new MyPoint(options.e.offsetX, options.e.offsetY);

    circle.set({
        "radius": MyMath.getLength(circle.center, corner),
        "left"  : circle.center.X - radius,
        "top"   : circle.center.Y - radius
    });
};

GUI.RECT.create = function(options) {
    var rect = new fabric.Rect({
        left        : 0, 
        top         : 0, 
        width       : 0,
        height      : 0,
        fill        : 'transparent', 
        stroke      : 'black',
        selectable  : false
    });

    rect.start = new ClipperLib.IntPoint(options.e.offsetX, options.e.offsetY);
    return rect;
};

GUI.RECT.update = function(rect, options) {
    var corner = new ClipperLib.IntPoint(options.e.offsetX, options.e.offsetY);
    
    rect.set({
        left    : Math.min(rect.start.X, corner.X),
        top     : Math.min(rect.start.Y, corner.Y),
        width   : Math.abs(rect.start.X - corner.X),
        height  : Math.abs(rect.start.Y - corner.Y)
    });
};

GUI.LINE.create = function() {
    var line = new fabric.Path('M 0 0');
    line.set({ 
                fill: 'transparent', 
                stroke: 'black',
                selectable: false
            });

    return line;
};

GUI.LINE.update = function(line, options){
    if(line.path.length === 1 && line.isInit === undefined) {
        line.set({
                    left: options.e.offsetX,
                    top : options.e.offsetY
                });
        line.isInit = true;
        line.start = new ClipperLib.IntPoint(options.e.offsetX, options.e.offsetY);
    } else {
        if (line.path.length < 2) {
            var commandArray = [];
            commandArray[0] = 'L';
            commandArray[1] = options.e.offsetX - line.start.X;
            commandArray[2] = options.e.offsetY - line.start.Y;
            line.path[line.path.length] = commandArray;
            this._updateLine(line);
        }
    }
};

GUI.LINE._updateLine = function(line) {
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
};

var UTILITY = {};

UTILITY._isNotSingle = function (objs) {
    var num = 0;
    for(var obj in objs) {
        num++;
        if(num > 1) {
            return true;
        }
    }
    return false;
};

UTILITY._isNotEmpty = function (objs) {
    var num = 0;
    for(var path in objs) {
        num++;
        if(num > 0) {
            return true;
        }
    }
    return false;
};

UTILITY._getPath = function(obj) {
    if(obj.type === "rect") {
        var path = [new ClipperLib.IntPoint(obj.start.X,                    obj.start.Y),
                    new ClipperLib.IntPoint(obj.start.X + obj.getWidth(),   obj.start.Y),
                    new ClipperLib.IntPoint(obj.start.X + obj.getWidth(),   obj.start.Y + obj.getHeight()),
                    new ClipperLib.IntPoint(obj.start.X,                    obj.start.Y + obj.getHeight())];
        return path;
    } else if(obj.type === "circle") {
        //circle is not ready
    } else if(obj.type === "path") {
        var path = [];
        for (var i = 0; i < obj.path.length; i++) {
            var _type = obj.path[i][0];
            if(_type === 'M' || _type === 'L'){
                path.push(new ClipperLib.IntPoint(obj.path[i][1] + obj.start.X, obj.path[i][2] + obj.start.Y));
            }
        }
        return path;
    }
};

UTILITY.split = function(objs) {
    var clipperSplit = [];
    var resLineArray = [];
    ElementsPool = [];
    
    MyMath.reset();
    ClipperObject.reset();
    
    for(var i = 0; i < objs.length; i++) {
        if (objs[i].type === "path") {
            var path = UTILITY._getPath(objs[i]);
            var segment = new MySegment(null, null, path);
            LinePool[segment.id] = segment;
            var clipperObj = new ClipperObject(path, objs[i].type, segment.id);
            resLineArray[clipperObj.id] = clipperObj;
        } 
        else if (objs[i].type === "rect"){
            var path = UTILITY._getPath(objs[i]);
            var rect = new MyPolygon(path);
            var clipperObj = new ClipperObject(path, objs[i].type, rect.id);
            ElementsPool[rect.id] = rect;
            clipperSplit[clipperObj.id] = clipperObj;
        }
    }
    
    var clipperWrap = new ClipperWrap();

    var isCompleted = false;

    while(true && UTILITY._isNotSingle(clipperSplit)) {
        isCompleted = clipperWrap.split(clipperSplit);
        
        if(isCompleted) {
            break;
        }
    }

    console.log(clipperSplit);
    console.log(ElementsPool);
    
    var res = UTILITY._mapping(ElementsPool, clipperSplit);
    console.log(res);
}

UTILITY._copyElement = function(path) {
    if (path[0] instanceof Array) {
        return new MyPolytree(path);
    } else if (path.length === 2){
        return new MySegment(null, null, path);
    } else {
        return new MyPolygon(path);
    }
}

UTILITY._mapping = function(myList, pathList) {
    var result = [];
    var nameList = [];
    for(var poly in pathList) {
        var polygon = pathList[poly];
        result.push(UTILITY._copyElement(polygon.path));
        
        var tmp = [];
        for(var id in polygon.source) {
            tmp.push(id);
        }
        nameList.push(tmp);
    }
    
    for (var i = 0; i < nameList.length; i++) {
        if (nameList[i].length === 1) {
            result[i].id = nameList[i][0];
        }
        var edge = result[i].root;
        while(edge) {
            var pointOut0 = edge.point0;
            var pointOut1 = edge.point1;
            
            for (var j = 0; j < nameList[i].length; j++) {
                var oriPoly = myList[nameList[i][j]];
                
                var edge2 = oriPoly.root;
                
                while(edge2) {
                    
                    var pointIn0 = edge2.point0;
                    var pointIn1 = edge2.point1;
                    
                    var same0 = MyMath.equalPoints(pointOut0, pointIn0);
                    var same1 = MyMath.equalPoints(pointOut1, pointIn1);
                    
                    if (same0) {
                        pointOut0.id = pointIn0.id;
                    }
                    
                    if (same1) {
                        pointOut1.id = pointIn1.id;
                    }
                    
                    if(same0 && same1) {
                        edge.id = edge2.id;
                    }
                    
                    edge2 = edge2.next;
                }
            }
            
            edge = edge.next;
        }
    }
    return result;
}

//get All the segments
function _getSegements(path, type) {
    var res = [];
    switch (type) {
        case TYPE.LINE:
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
};

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
};
