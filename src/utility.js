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

function getPath(obj) {
    var res = {};
    if(obj.type === "rect") {
        res.x = obj.startX;
        res.y = obj.startY;
        res.width = obj.getWidth();
        res.height = obj.getHeight();
        //res.type = "rect";
        return [{X: res.x, Y: res.y}, {X: res.x + res.width, Y: res.y}, {X: res.x + res.width, Y: res.y + res.height}, {X: res.x, Y: res.y + res.height}];
    } else if(obj.type === "circle") {
        //circle还没想好
        //res.x = obj.centerX;
        //res.y = obj.centerY;
        //res.radius = obj.radius;
        //res.type = "circle";
        
    } else if(obj.type === "path") {
        var path = [];
        for (var i = 0; i < obj.path.length; i++) {
            if(obj.path[i][0] === 'M' || obj.path[i][0] === 'L'){
                res.path.push({X: obj.path[i][1] + obj.startX, Y: obj.path[i][2] + obj.startY});
            }
        }
        return path;
        //res.type = "path";
        
    }
    //return res;
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