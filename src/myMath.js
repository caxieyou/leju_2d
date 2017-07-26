var POINT_ID        = 0;
var SEGMENT_ID      = 0;
var POLYGON_ID      = 0;
var POLYGTREE_ID    = 0;

function MyPoint(x, y){
    if (!y) {
        this.X = x.X;
        this.Y = x.Y;
    } else {
        this.X = x;
        this.Y = y;
    }
    this.id = this._generateID();
};

MyPoint.prototype._generateID = function () {
    return "my_point_" + POINT_ID++;
}

function MySegment(point0, point1, path){
    if (path) {
        this.createByPath(path);
    } else {
        this.point0 = point0;
        this.point1 = point1;
    }
    
    this.next = null;
    this.pre = null;
    this.id = this._generateID();
};

MySegment.prototype._generateID = function () {
    return "my_segment_" + SEGMENT_ID++;
};

MySegment.prototype.createByPath = function (path) {
    var point0 = new MyPoint(path[0]);
    var point1 = new MyPoint(path[1]);
    this.point0 = point0;
    this.point1 = point1;
}

function MyPolygon(path){
    this.root = null; //some edge
    this.end = null;
    this.id = this._generateID();
    if (path) {
        this.createByPath(path);
    }
};

MyPolygon.prototype._generateID = function () {
    return "my_polygon_" + POLYGON_ID++;
};

MyPolygon.prototype.createByPath = function (path) {
    var point_s = new MyPoint(path[0]);
    var point_c = point_s;
    var point_e;
    var segs = [];
    for (var i = 1; i < path.length; i++) {
        point_e = new MyPoint(path[i]);
        var seg = new MySegment(point_c, point_e);
        segs.push(seg);
        point_c = point_e;
    }
    
    var seg = new MySegment(point_c, point_s);
    segs.push(seg);
    this.root = segs[0];
    this.end = segs[segs.length - 1];
    
    for (var i = 0; i < segs.length - 1; i++) {
        segs[i].next = segs[i+1];
    }
    
    for (var i = 1; i < segs.length; i++) {
        segs[i].pre = segs[i-1];
    }
};

function MyPolytree(paths){
    this.polygons = [];
    this.id = this._generateID();
    if(paths) {
        this.createByPaths(paths);
    }
};

MyPolytree.prototype._generateID = function () {
    return "polytree_" + POLYGTREE_ID++;
};

MyPolytree.prototype.createByPaths = function (paths) {
    for(var i = 0; i < paths.length; i++) {
        var poly = new MyPolygon(paths[i]);
        this.polygons.push(poly);
    }
    
};

var MyMath = {};

MyMath.getLength = function(ptA, ptB) {
    return Math.sqrt((ptA.X - ptB.X) * (ptA.X - ptB.X) + (ptA.Y - ptB.Y) * (ptA.Y - ptB.Y));
};

MyMath.equalPoints = function(point0, point1){
    if(point0.X === point1.X && point0.Y === point1.Y) {
        return true;
    } else {
        return false;
    }
};

MyMath.intersectSegments = function(seg0_point0, seg0_point1, seg1_point0, seg1_point1){  
    var a = seg0_point0;
    var b = seg0_point1;
    var c = seg1_point0;
    var d = seg1_point1;
    
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
    if (area_cda * area_cdb >= 0 ) {  
        return null;  
    }  
    
    //calculate the intersect point
    var t = area_cda / ( area_abd - area_abc );  
    var dx= t*(b.X - a.X),  
        dy= t*(b.Y - a.Y);  
    
    return {point: new ClipperLib.IntPoint(Math.round(a.X + dx), Math.round(a.Y + dy)) , ratio: t};
};

MyMath.reset = function() {
    POINT_ID        = 0;
    SEGMENT_ID      = 0;
    POLYGON_ID      = 0;
    POLYGTREE_ID    = 0;
};

/*
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

*/

