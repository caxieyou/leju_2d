

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
    fabric.Image.fromURL('ruler.jpg', function(oImg) {
        oImg.set({ selectable: false, opacity: 0.35});
        canvas.add(oImg);
    });
    canvas.renderAll();
};

function onOutput() {
    //get the objects on the page
    var objs = canvas.getObjects();
    
    //do the caculation
    process(objs);
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
                //do nothing
            break;
        }
    }
    
    canvas.renderAll();
};

function main() {
    var line = new fabric.Path('M 0 0');
    canvas = new fabric.Canvas('canvas');
    fabric.Image.fromURL('ruler.jpg', function(oImg) {
        oImg.set({ selectable: false, opacity: 0.35});
        canvas.add(oImg);
    });
    canvas.renderAll();
    
    canvas.on('mouse:down', onMouseDown);
    
    canvas.on('mouse:up', onMouseUp);
    
    canvas.on('mouse:move', onMouseMove);
}

