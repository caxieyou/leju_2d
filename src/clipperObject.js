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

ClipperWrap.prototype.splitPoly = function (polys) {
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

ClipperWrap.prototype.splitSegmentsPolys = function(segments, polys){
    //var res = {};
    for (var id_s in segments) {
        var segment = segments[id_s];
        var intersect = [];
        for (var id_p in polys) {
            var poly = polys[id_p];
            intersect[poly.id] = this._splitSegmentPoly(segment, poly);
        }
        
        if (UTILITY._isNotEmpty(intersect)) {
            var info = null;
            var interArray = null;
            var minRatio = 1.0;
            for(var poly in intersect) {
                var result = intersect[poly];
                if (result.length === 2 && result[0].ratio < minRatio) {
                    minRatio = result[0].ratio;
                    interArray = result;
                    info = poly;
                }
            }
            if (info) {
                var path = [];
                for(var i = 0; i < interArray[0].index+1; i++) {
                    path.push(new ClipperLib.IntPoint(polys[info].path[i]));
                }
                path.push(new ClipperLib.IntPoint(interArray[0].point));
                path.push(new ClipperLib.IntPoint(interArray[1].point));
                
                for(var i = interArray[1].index+1; i < polys[info].path.length; i++) {
                    path.push(new ClipperLib.IntPoint(polys[info].path[i]));
                }
                var clipperObj0 = new ClipperObject(path, "polygon");
                clipperObj0.addSource(polys[info].source);
                polys[clipperObj0.id] = clipperObj0;
                ////////////////////////////////////////////////////////
                
                path = [];
                path.push(new ClipperLib.IntPoint(interArray[0].point));
                for(var i = interArray[0].index+1; i < interArray[1].index+1; i++) {
                    path.push(new ClipperLib.IntPoint(polys[info].path[i]));
                }
                path.push(new ClipperLib.IntPoint(interArray[1].point));
                
                var clipperObj1 = new ClipperObject(path, "polygon");
                clipperObj1.addSource(polys[info].source);
                polys[clipperObj1.id] = clipperObj1;
                ////////////////////////////////////////////////////////
                
                delete polys[info];
                
                console.log(info);
                console.log(interArray);
                
            }
        }
        //res[segment.id] = tmp;
    }
    
};

ClipperWrap.prototype._splitSegmentPoly = function(segment, poly){
    var seg0_point0 = segment.path[0];
    var seg0_point1 = segment.path[1];
    
    var res = [];
    if(poly.path[0] instanceof Array) {
        /*
        for(var i = 0; i < poly.length; i++) {
            for(var j = 0; j < poly[i].path.length + 1; j++){
                var interset = MyMath.intersectSegments(seg0_point0, seg0_point1, poly[i].path[j], poly[i].path[(j+1)% (poly[i].path.length - 1)]);
                if(interset) {
                    res.push(interset);
                }
            }
        }
        */
    } else {
        var path = poly.path;
        
        for(var i = 0; i < path.length; i++) {
            var cur = i;
            var next = (i + 1) % path.length;
            
            var interset = MyMath.intersectSegments(seg0_point0, seg0_point1, path[cur], path[next]);
            if(interset) {
                    interset.index = i;
                    res.push(interset);
            }
        }
    }
    
    res.sort(function(a, b) {
                return a.ratio > b.ratio;
             });
             
    if (res.length > 2) {
        res.slice(0, 2);
    }
    
    res.sort(function(a, b) {
                return a.index > b.index;
             });
             
    return res;
};


