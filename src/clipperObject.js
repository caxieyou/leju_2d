var CLIPPER_LINE_ID     = 0;
var CLIPPER_POLYGON_ID  = 0;

ClipperObject.reset = function() {
    CLIPPER_LINE_ID     = 0;
    CLIPPER_POLYGON_ID  = 0;
};

function ClipperObject(path, type, source) {
    this.path = path;
    this.id = this._generateID(type);
    this.source = {};
    if (source) {
        this.source[source] = 1;
    }
};

ClipperObject.prototype._generateID = function (type) {
    if(type === 'rect' || type === 'polygon') {
        return 'polygon_' + CLIPPER_POLYGON_ID++;
    } else if(type === 'path') {
        return 'line_' + CLIPPER_LINE_ID++;
    }
};

ClipperObject.prototype.addSource = function (source) {
    if (source) {
        for (var id in source) {
            if (this.source.hasOwnProperty(id)) {
                this.source[id] += source[id];
            } else {
                this.source[id] = source[id];
            }
        }
    }
};

function ClipperWrap() {
    this._cpr = new ClipperLib.Clipper();
    this._cpr.StrictlySimple = true;
    this._solution_intersect = new ClipperLib.Paths();
    this._solution_diff = new ClipperLib.Paths();
    this._solution_intersect_reverse = new ClipperLib.Paths();
    this._solution_diff_reverse = new ClipperLib.Paths();
};

ClipperWrap.prototype.split = function (polys) {
    var isInterrupt = false;

    for (var key0 in polys) {
        for (var key1 in polys) {
            isInterrupt = false;
            
            //skip if same
            if (key0 === key1) {
                continue;
            }
            
            this._split_sub(polys[key0], polys[key1]);
            
            this._split_sub_reverse(polys[key0], polys[key1]);
           
            //no intersection
            if (this._solution_intersect.length === 0) {
                continue;
            //same but reverse
            } else if (this._solution_diff.length === 0 && this._solution_diff_reverse.length === 0) {
                continue;
            } 
            //one includes the other
            else if(this._solution_diff.length === 0 || this._solution_diff_reverse.length === 0){
                
                var source0 = polys[key0].source;
                var source1 = polys[key1].source;
                delete polys[key0];
                delete polys[key1];
                
                
                var clipperObj = new ClipperObject(this._solution_diff.length === 0 ? this._fetchPath(this._solution_diff_reverse) : this._fetchPath(this._solution_diff), 
                                                   'polygon');
                
                clipperObj.addSource(source0);
                clipperObj.addSource(source1);
                polys[clipperObj.id] = clipperObj;
                
                var clipperObj2 = new ClipperObject(this._fetchPath(this._solution_intersect), 'polygon');
                if (this._solution_diff.length != 0) {
                    clipperObj2.addSource(source1);
                } else {
                    clipperObj2.addSource(source0);
                }
                
                polys[clipperObj2.id] = clipperObj2;
                
                isInterrupt = true;
                break;
            } else {
                //debugger;
                var source0 = polys[key0].source;
                var source1 = polys[key1].source;
                delete polys[key0];
                delete polys[key1];
                
                var clipperObj = new ClipperObject(this._fetchPath(this._solution_intersect), 'polygon');
                clipperObj.addSource(source0);
                clipperObj.addSource(source1);
                polys[clipperObj.id] = clipperObj;
                
                var clipperObj2 = new ClipperObject(this._fetchPath(this._solution_diff), 'polygon');
                clipperObj2.addSource(source0);
                polys[clipperObj2.id] = clipperObj2;
                
                var clipperObj3 = new ClipperObject(this._fetchPath(this._solution_diff_reverse), 'polygon');
                clipperObj3.addSource(source1);
                polys[clipperObj3.id] = clipperObj3;
                
                isInterrupt = true;
                break;
            }
        }
        if (isInterrupt) {
            break;
        }
    }
    
    return !isInterrupt;
};

ClipperWrap.prototype._split_sub = function(poly0, poly1) {
    //calculate positive
    this._cpr.Clear();
    if(poly0.path[0] instanceof Array) {
        this._cpr.AddPaths(poly0.path, ClipperLib.PolyType.ptSubject, true);  // true means closed path
    }else {
        this._cpr.AddPath(poly0.path, ClipperLib.PolyType.ptSubject, true);  // true means closed path
    }
    
    if(poly1[0] instanceof Array) {
        this._cpr.AddPaths(poly1.path, ClipperLib.PolyType.ptClip, true);
    }else {
        this._cpr.AddPath(poly1.path, ClipperLib.PolyType.ptClip, true);
    }
    
    this._cpr.Execute(ClipperLib.ClipType.ctIntersection, this._solution_intersect, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
    this._cpr.Execute(ClipperLib.ClipType.ctDifference,   this._solution_diff,      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
};

ClipperWrap.prototype._split_sub_reverse = function(poly0, poly1) {
    this._cpr.Clear();
    if(poly1.path[0] instanceof Array) {
        this._cpr.AddPaths(poly1.path, ClipperLib.PolyType.ptSubject, true);  // true means closed path
    }else {
        this._cpr.AddPath(poly1.path, ClipperLib.PolyType.ptSubject, true);  // true means closed path
    }
    
    if(poly0.path[0] instanceof Array) {
        this._cpr.AddPaths(poly0.path, ClipperLib.PolyType.ptClip, true);
    }else {
        this._cpr.AddPath(poly0.path, ClipperLib.PolyType.ptClip, true);
    }
    this._cpr.Execute(ClipperLib.ClipType.ctIntersection, this._solution_intersect_reverse, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
    this._cpr.Execute(ClipperLib.ClipType.ctDifference,   this._solution_diff_reverse,      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
};

ClipperWrap.prototype._fetchPath = function(path) {
    var res = [];
    if (path[0] instanceof Array) {
        for(var i = 0; i < path.length; i++) {
            var tmp = [];
            for(var j = 0; j < path[i].length; j++) {
                var point = new ClipperLib.IntPoint(path[i][j]);
                tmp.push(point);
            }
            res[i] = tmp;
        }
        
        if (res.length === 1) {
            res = res[0];
        }
    } else {
        for(var i = 0; i < path.length; i++) {
            var point = new ClipperLib.IntPoint(path[i]);
            res.push(point);
        }
    }
    return res
};
