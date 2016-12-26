THREE.ObjectMouseEvent =  function ( _renderer) {
    if (THREE.ObjectMouseEvent._instance) 
        return THREE.ObjectMouseEvent._instance;

    THREE.ObjectMouseEvent._instance = this;

	// initialize object to perform world/screen calculations
    this._domElement = _renderer.domElement || renderer.domElement;
	this.projector = new THREE.Projector();
    this.raycaster = new THREE.Raycaster();
    this.camera = null;

	this.intersectedObject = null;
    this.selectedObject = null;
    this.mouseDownObject = null;
    this.mouseDownPosition = { x:0, y:0 };
    this.mouseGL = { x:0, y:0 };

};
THREE.ObjectMouseEvent.prototype = {

	constructor: THREE.ObjectMouseEvent,

    _onMouseDown: function onDocumentMouseDown( event ) {
        var Mouse = new THREE.ObjectMouseEvent();

	    Mouse.mouseDownPosition = { x:event.clientX, y:event.clientY };
	    //event.preventDefault();
	    var intersects = Mouse.getObjectsUnderCursor(event);

	    if ( intersects.length > 0 ) {
            controls.enabled = false;
            Mouse.mouseDownObject = intersects[0];
            if (Mouse.onMouseDownObject)
                Mouse.onMouseDownObject(Mouse.mouseDownObject);
		    //var intersects = raycaster.intersectObject( plane );
		    //offset.copy( intersects[ 0 ].point ).sub( plane.position );

		    container.style.cursor = 'move';
	    }

    },

    _onMouseUp: function ( event ) {
        var Mouse = new THREE.ObjectMouseEvent();
        var mouseDist = new THREE.Vector2( Mouse.mouseDownPosition.x - event.clientX,  Mouse.mouseDownPosition.y - event.clientY ).length();
	    
        //event.preventDefault();
	    controls.enabled = true;

        var intersects = Mouse.getObjectsUnderCursor(event);

        if ( Mouse.mouseDownObject ) {  // we were dragging
            if (intersects.length > 0  ) {  // we dropped on an object
	            if ( intersects[0] === Mouse.mouseDownObject ) { // Actually it was just a drag/drop on itself -> click !
                    // TODO if we move the object while dragging, the drop will occur on itself !!!
                    if ( mouseDist < 10 ){
                        if (Mouse.onObjectClick)
                            Mouse.onObjectClick(Mouse.mouseDownObject);
                    }
	            } else { // dropped on another object
                    //TODO
                    console.warn("drag/drop not implemented yet")
                }
            }
        }
	    Mouse.mouseDownObject = null;
	    container.style.cursor = 'auto';
    },

    _onMouseMove: function ( event ) {
        var Mouse = THREE.ObjectMouseEvent._instance;
        
	    //event.preventDefault();
	
	    if ( Mouse.mouseDownObject ) { // Dragging object
            if (Mouse.onMoveObject) 
                Mouse.onMoveObject( Mouse.mouseDownObject, event );
		    return;
	    }

        var intersects = Mouse.getObjectsUnderCursor(event);

	    if ( intersects.length > 0 ) {

		    if ( Mouse.intersectedObject != intersects[ 0 ].object ) {

			    if ( Mouse.intersectedObject ) 
                    if (Mouse.onMouseOut) 
                        Mouse.onMouseOut( Mouse.intersectedObject );

			    Mouse.intersectedObject = intersects[ 0 ].object;
                if (Mouse.onMouseOver) 
                    Mouse.onMouseOver( Mouse.intersectedObject );
		    }

		    container.style.cursor = 'pointer';

	    } else {

		    if ( Mouse.intersectedObject ) 
                if (Mouse.onMouseOut) 
                    Mouse.onMouseOut(Mouse.intersectedObject);

		    Mouse.intersectedObject = null;

		    container.style.cursor = 'auto';
	    }
    },

    _onClick: function ( event ) {
        console.log("Click");
    },

    _onDblClick: function ( event ) {
        console.log("DblClick");
    },

    addListeners: function () {

	    var _this	= this;
	    this._$onClick		= function(){ _this._onClick.apply(_this, arguments);		};
	    this._$onDblClick	= function(){ _this._onDblClick.apply(_this, arguments);	};
	    this._$onMouseMove	= function(){ _this._onMouseMove.apply(_this, arguments);	};
	    this._$onMouseDown	= function(){ _this._onMouseDown.apply(_this, arguments);	};
	    this._$onMouseUp	= function(){ _this._onMouseUp.apply(_this, arguments);		};
	    this._$onTouchMove	= function(){ _this._onTouchMove.apply(_this, arguments);	};
	    this._$onTouchStart	= function(){ _this._onTouchStart.apply(_this, arguments);	};
	    this._$onTouchEnd	= function(){ _this._onTouchEnd.apply(_this, arguments);	};
	    //this._domElement.addEventListener( 'click'	, this._$onClick	, false );
	    //this._domElement.addEventListener( 'dblclick'	, this._$onDblClick	, false );
	    this._domElement.addEventListener( 'mousemove'	, this._$onMouseMove	, false );
	    this._domElement.addEventListener( 'mousedown'	, this._$onMouseDown	, false );
	    this._domElement.addEventListener( 'mouseup'	, this._$onMouseUp	, false );
	    this._domElement.addEventListener( 'touchmove'	, this._$onTouchMove	, false );
	    this._domElement.addEventListener( 'touchstart'	, this._$onTouchStart	, false );
	    this._domElement.addEventListener( 'touchend'	, this._$onTouchEnd	, false );
    },

    getObjectsUnderCursor: function ( event , objectHierarchy ) {

        objectHierarchy = objectHierarchy || scene.children;

        // update the mouse variable
	    this.mouseGL.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	    this.mouseGL.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        
        if (this.camera === null ) return [];
        // create a Ray with origin at the mouse position
	    //   and direction into the scene (camera direction)
	    var vector = new THREE.Vector3( this.mouseGL.x, this.mouseGL.y, 0.5 );
	    this.projector.unprojectVector( vector, this.camera );
	    this.raycaster.set( this.camera.position, vector.sub( this.camera.position ).normalize() );

	    // create an array containing all objects in the scene with which the ray intersects
	    var currentIntersectedObjects = this.raycaster.intersectObjects( objectHierarchy );

	    // currentIntersectedObj = the intersected objects in the scene from the closest to the camera
        return currentIntersectedObjects;
    }
}
function _init() 
{

	// create a canvas element
	canvas1 = document.createElement('canvas');
	context1 = canvas1.getContext('2d');
	context1.font = "Bold 20px Arial";
	context1.fillStyle = "rgba(0,0,0,0.95)";
    context1.fillText('Hello, world!', 0, 20);
    
	// canvas contents will be used for a texture
	texture1 = new THREE.Texture(canvas1) 
	texture1.needsUpdate = true;
	
	////////////////////////////////////////
	
	var spriteMaterial = new THREE.SpriteMaterial( { map: texture1, useScreenCoordinates: true, alignment: THREE.SpriteAlignment.topLeft } );
	
	sprite1 = new THREE.Sprite( spriteMaterial );
	sprite1.scale.set(200,100,1.0);
	sprite1.position.set( 50, 50, 0 );
	scene.add( sprite1 );	

	//////////////////////////////////////////
	
}










