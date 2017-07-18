
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
    return "point_" + POINT_ID++;
}


function MySegment(point0, point1){
    this.point0 = point0;
    this.point1 = point1;
    this.next = null;
    this.pre = null;
    this.id = this._generateID();
};

MySegment.prototype._generateID = function () {
    return "segment_" + SEGMENT_ID++;
}

function MyPolygon(){
    this.root = null; //some edge
    this.end = null;
    this.id = this._generateID();
};

MyPolygon.prototype._generateID = function () {
    return "polygon_" + POLYGON_ID++;
}


function MyPolytree(){
    this.poly = null;
    this.id = this._generateID();
};
MyPolytree.prototype._generateID = function () {
    return "polytree_" + POLYGTREE_ID++;
}

var MyMath = {};

MyMath.getLength = function(ptA, ptB) {
    return Math.sqrt((ptA.X - ptB.X) * (ptA.X - ptB.X) + (ptA.Y - ptB.Y) * (ptA.Y - ptB.Y));
};

MyMath.lineSegmentsIntersect = function(seg0, seg1){  
    var a = seg0.point0;
    var b = seg0.point1;
    var c = seg1.point0;
    var d = seg1.point1;
    
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
    return { X: Math.round(a.X + dx) , Y: Math.round(a.Y + dy) };
}  