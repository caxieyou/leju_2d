function createCircle(options) {
    var circle = new fabric.Circle({
        radius: 0, left: 0, top: 0, fill : 'transparent', stroke: 'black', selectable: false
    });
    circle.centerX = options.e.offsetX;
    circle.centerY = options.e.offsetY;
    return circle;
}

function updateCircle(circle, options) {
    var centerX = circle.centerX;
    var centerY = circle.centerY;
    
    var right = options.e.offsetX;
    var buttom = options.e.offsetY;
    
    var radius = Math.sqrt((right - centerX) * ((right - centerX)) + (centerY - buttom) * (centerY - buttom));
    
    circle.set({
        "radius": radius,
        "left": centerX - radius,
        "top": centerY - radius
    });
}

function createRect(options) {
    var rect = new fabric.Rect({
        left: 0, 
        top: 0, 
        width : 0,
        height : 0,
        fill : 'transparent', 
        stroke: 'black',
        selectable: false
    });

    rect.startX = options.e.offsetX;
    rect.startY = options.e.offsetY;
    
    return rect;
}

function updateRect(rect, options) {
    var _left = rect.startX;
    var _top = rect.startY;
    
    var _right = options.e.offsetX;
    var _bottom = options.e.offsetY;
    
    rect.set({
        left : Math.min(_left, _right),
        top:   Math.min(_top, _bottom),
        width: Math.abs(_left - _right),
        height: Math.abs(_top - _bottom)
    });
}

function createLinePath() {
    var path = new fabric.Path('M 0 0');
    path.set({ 
                fill: 'transparent', 
                stroke: 'black',
                selectable: false
    });

    return path;
}

function updateLinePath(path, options){
    if(path.path.length === 1 && path.isInit === undefined) {
        path.set({
            left: options.e.offsetX,
            top: options.e.offsetY
        });
        path.isInit = true;
        path.startX = options.e.offsetX;
        path.startY = options.e.offsetY;
    } else {
        var commandArray = [];
        commandArray[0] = 'L';
        commandArray[1] = options.e.offsetX - path.startX;
        commandArray[2] = options.e.offsetY - path.startY;
        path.path[path.path.length] = commandArray;
        _updateDims(path);
    }
}


function getKeyInfo(obj) {
    var res = {};
    if(obj.type === "rect") {
        res.x = obj.startX;
        res.y = obj.startY;
        res.width = obj.getWidth();
        res.height = obj.getHeight();
        res.type = "rect";
        res.path = [{X: res.x, Y: res.y}, {X: res.x + res.width, Y: res.y}, {X: res.x + res.width, Y: res.y + res.height}, {X: res.x, Y: res.y + res.height}];
    } else if(obj.type === "circle") {
        res.x = obj.centerX;
        res.y = obj.centerY;
        res.radius = obj.radius;
        res.type = "circle";
    } else if(obj.type === "path") {
        res.path = [];
        for (var i = 0; i < obj.path.length; i++) {
            if(obj.path[i][0] === 'M' || obj.path[i][0] === 'L'){
                res.path.push({X: obj.path[i][1] + obj.startX, Y: obj.path[i][2] + obj.startY});
            }
        }
        res.type = "path";
        
    }
    return res;
}

function isNotSingle(paths) {
    var sum = 0;
    for(var x in paths) {
        sum++;
        if(sum > 1) {
            return true;
        }
    }
    return false;
}

function getSegements(path) {
    var res = [];
    for(var i = 0; i < path.length - 1; i++) {
        res.push({point0: path[i], point1: path[i+1]});
    }
    return res;
}

function _segmentsIntr(a, b, c, d){  
    //twice of the triangle area  
    var area_abc = (a.X - c.X) * (b.Y - c.Y) - (a.Y - c.Y) * (b.X - c.X);  
  
    //twice of the triangle area  
    var area_abd = (a.X - d.X) * (b.Y - d.Y) - (a.Y - d.Y) * (b.X - d.X);   
  
    //if the sign of areas are same which means they are on the same side  
    if ( area_abc*area_abd>=0 ) {  
        return null;  
    }  
    var area_cda = (c.X - a.X) * (d.Y - a.Y) - (c.Y - a.Y) * (d.X - a.X);  
    
    var area_cdb = area_cda + area_abc - area_abd ;  
    if (  area_cda * area_cdb >= 0 ) {  
        return null;  
    }  
    
    //calculate the intersect point
    var t = area_cda / ( area_abd- area_abc );  
    var dx= t*(b.X - a.X),  
        dy= t*(b.Y - a.Y);  
    return { X: Math.round(a.X + dx) , Y: Math.round(a.Y + dy) };  
  
}  

function lineIntersectWithRect(segement, rect) {
    
    
    var res = [];
    var intersect = null;
    var rectLine = [];
    rectLine[0] = {point0 : rect[0], point1 : rect[1]};
    rectLine[1] = {point0 : rect[1], point1 : rect[2]};
    rectLine[2] = {point0 : rect[2], point1 : rect[3]};
    rectLine[3] = {point0 : rect[3], point1 : rect[0]};
    
    var record = [];
    for(var i = 0; i < 4; i++) {
        var inter = _segmentsIntr(segement.point0, segement.point1, rectLine[i].point0, rectLine[i].point1);
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
                            {X:rect[2].X,  Y:rect[2].Y}, 
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

function getPath(obj) {
    if(obj.type === "rect") {
        var res = {};
        res.x = obj.startX;
        res.y = obj.startY;
        res.width = obj.getWidth();
        res.height = obj.getHeight();
        return [{X: res.x, Y: res.y}, {X: res.x + res.width, Y: res.y}, {X: res.x + res.width, Y: res.y + res.height}, {X: res.x, Y: res.y + res.height}];
    } else if(obj.type === "circle") {
        //circle is not ready
        //res.x = obj.centerX;
        //res.y = obj.centerY;
        //res.radius = obj.radius;
        //res.type = "circle";
        
    } else if(obj.type === "path") {
        var path = [];
        for (var i = 0; i < obj.path.length; i++) {
            if(obj.path[i][0] === 'M' || obj.path[i][0] === 'L'){
                path.push({X: obj.path[i][1] + obj.startX, Y: obj.path[i][2] + obj.startY});
            }
        }
        return path;
    }
}

function addPath(path) {
    var res = [];
    for(var i = 0; i < path.length; i++) {
        res.push({X: path[i].X, Y: path[i].Y});
    }
    return res;
}

function addPathXOR(xor) {
    var res = [];
    for(var i = 0; i < xor.length; i++) {
        var tmp = [];
        for(var j = 0; j < xor[i].length; j++) {
            tmp.push({X: xor[i][j].X, Y: xor[i][j].Y});
        }
        res[i] = tmp;
    }
    return res;
}

function _updateDims(path) {
    var dims = path._parseDimensions(),
        prevDims = path.prevDims || {},
        leftDiff = dims.left - (prevDims.left || 0),
        topDiff = dims.top - (prevDims.top || 0);

    path.setWidth(dims.width);
    path.setHeight(dims.height);
    
    if (dims.left < 0) {
        path.pathOffset.x = path.width/2 + dims.left;
        path.left = path.left + leftDiff;
    } else {
        path.pathOffset.x = path.width/2;
    }
    
    if (dims.top < 0) {
        path.pathOffset.y = path.height/2 + dims.top;
        path.top = path.top + topDiff;
    } else {
         path.pathOffset.y = path.height/2;   
    }
    
    path.prevDims = dims;
    path.setCoords();
}