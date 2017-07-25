var canvas = null;
var type = TYPE.RECT;

function onCirle(){
    type = TYPE.CIRCLE;
}

function onRect(){
    type = TYPE.RECT;
}

function onLinePath(){
    type = TYPE.LINE;
    canvas.add(GUI.LINE.create());
}

function onStop() {
    type = null;
};

function onClear() {
    canvas.clear();
    _drawScaleBackground();
};

function onOutput() {
    //get the objects on the page
    var objs = canvas.getObjects();
    
    //do the caculation, main Entrance
    UTILITY.split(objs);
};

function onMouseDown(options) {
    switch (type) {
        case TYPE.CIRCLE:
            canvas.add(GUI.CIRCLE.create(options));
        break;
        
        case TYPE.RECT :
            canvas.add(GUI.RECT.create(options));
        break;   
        
        case TYPE.LINE:
        {
            var objs = canvas.getObjects();
            var obj = objs[objs.length - 1];
            GUI.LINE.update(obj, options);
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
                GUI.CIRCLE.update(obj, options);
            break;
            
            case TYPE.RECT:
                GUI.RECT.update(obj, options);
            break;
            
            case TYPE.LINE:
                //do nothing
            break;
        }
    }
    
    canvas.renderAll();
};

function main() {
    canvas = new fabric.Canvas('canvas');
    
    _drawScaleBackground();
    
    canvas.on('mouse:down', onMouseDown);
    
    canvas.on('mouse:up', onMouseUp);
    
    canvas.on('mouse:move', onMouseMove);
}

function _drawScaleBackground() {
    fabric.Image.fromURL('ruler.jpg', function(oImg) {
        oImg.set({ selectable: false, opacity: 0.35});
        canvas.add(oImg);
    });
    canvas.renderAll();
}

