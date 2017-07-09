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
    var resPathArray = [];
    for(var i = 0; i < objs.length; i++) {
        resPathArray["node_" +index] = getPath(objs[i]);
        index++;
    }
    
    var cpr = new ClipperLib.Clipper();
    cpr.StrictlySimple = true;
    var solution_intersect = new ClipperLib.Paths();
    var solution_diff = new ClipperLib.Paths();
    var solution_intersect_reverse = new ClipperLib.Paths();
    var solution_diff_reverse = new ClipperLib.Paths();
    
    var breakOut = false;

    while(true && getLength(resPathArray) > 1) {
        for (var key0 in resPathArray) {
            for (var key1 in resPathArray) {
                breakOut = false;
                
                //一样就skip
                if (key0 === key1) {
                    continue;
                }
                
                //正向求一次
                cpr.Clear();
                if(resPathArray[key0][0] instanceof Array) {
                    cpr.AddPaths(resPathArray[key0], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }else {
                    cpr.AddPath(resPathArray[key0], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }
                
                if(resPathArray[key1][0] instanceof Array) {
                    cpr.AddPaths(resPathArray[key1], ClipperLib.PolyType.ptClip, true);
                }else {
                    cpr.AddPath(resPathArray[key1], ClipperLib.PolyType.ptClip, true);
                }
                
                cpr.Execute(ClipperLib.ClipType.ctIntersection, solution_intersect, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                cpr.Execute(ClipperLib.ClipType.ctDifference,   solution_diff,      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                
                //反向求一次
                cpr.Clear();
                if(resPathArray[key1][0] instanceof Array) {
                    cpr.AddPaths(resPathArray[key1], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }else {
                    cpr.AddPath(resPathArray[key1], ClipperLib.PolyType.ptSubject, true);  // true means closed path
                }
                
                if(resPathArray[key0][0] instanceof Array) {
                    cpr.AddPaths(resPathArray[key0], ClipperLib.PolyType.ptClip, true);
                }else {
                    cpr.AddPath(resPathArray[key0], ClipperLib.PolyType.ptClip, true);
                }
                cpr.Execute(ClipperLib.ClipType.ctIntersection, solution_intersect_reverse, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                cpr.Execute(ClipperLib.ClipType.ctDifference,   solution_diff_reverse,      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
                
                
                
                //没有交集，说明两个东西离得很远
                if (solution_intersect.length === 0) {
                    continue;
                //如果diff为空，说明是包含关系
                } else if(solution_diff.length === 0 || solution_diff_reverse.length === 0){
                    
                    delete resPathArray[key0];
                    delete resPathArray[key1];
                    
                    resPathArray["node_" +index] = solution_diff.length === 0 ? addPathXOR(solution_diff_reverse) : addPathXOR(solution_diff);
                    index++;
                    
                    breakOut = true;
                    break;
                } else {
                    delete resPathArray[key0];
                    delete resPathArray[key1];
                    
                    for(var i = 0; i < solution_intersect.length; i++) {
                        resPathArray["node_" +index] = addPath(solution_intersect[i]);
                        index++;
                    }
                    
                    for(var i = 0; i < solution_diff.length; i++) {
                        resPathArray["node_" +index] = addPath(solution_diff[i]);
                        index++;
                    }
                    
                    for(var i = 0; i < solution_diff.length; i++) {
                        resPathArray["node_" +index] = addPath(solution_diff_reverse[i]);
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
    
    
    console.log(resPathArray);
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
    //type = null;
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

