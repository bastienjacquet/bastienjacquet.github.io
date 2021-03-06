/**
 * @author Bastien Jacquet @ ETH 
 * needs THREE.DeviceOrientationControls.js
 *
 */ 
/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

THREE.TrackballDeviceOrientationControls = function ( object ) {

	var _this = this;

	this.object = object;

	// API

	this.enabled = true;
	
	this.useRelativeNorthDir = true;
	
	// internals

	this.target = new THREE.Vector3();

	this.useModelGravityDir = true;
	this.modelGravityDir = new THREE.Vector3(0,0,-1);
	this.modelNorth = new THREE.Vector3(1,0,0);
	scene.add(new THREE.ArrowHelper( this.modelGravityDir, new THREE.Vector3(), 5, 0xffff00 ) ); 
	var _eye = new THREE.Vector3();
	
    var deviceOrientation = new THREE.Object3D();
    
    /*scene.add(deviceOrientation);
    axisHelperDevice = new THREE.AxisHelper(80);
	deviceOrientation.add(axisHelperDevice);
	
	axisHelperDeviceRel = new THREE.AxisHelper(10);
	scene.add(axisHelperDeviceRel);
	axisHelperDeviceInit = new THREE.AxisHelper(5);
	scene.add(axisHelperDeviceInit);*/
	
	this.controls = new THREE.DeviceOrientationControls( deviceOrientation );
	// for reset

	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();
	this.firstRotation = null;
	
	this.disconnect = this.controls.disconnect;
	this.connect = function () {
	
	    _this.target0 = _this.target.clone();
	    _this.position0 = _this.object.position.clone();
	    _this.up0 = _this.object.up.clone();
	    
	    _this.controls.connect();	    
    }
    
    this.rotateCamera = function () {
		var firstRotation = (_this.firstRotation || deviceOrientation.quaternion).clone();
		var relativeRotation = 
			deviceOrientation.quaternion.clone().multiply( firstRotation.inverse() );

		//axisHelperDeviceRel.quaternion.copy(relativeRotation);
			
		var targetDist = _eye.subVectors( _this.object.position, _this.target ).length();
        
        _eye.subVectors( _this.position0, _this.target ).applyQuaternion( relativeRotation );
        
		_this.object.up.copy( _this.up0 ).applyQuaternion( relativeRotation );
		
    }
    
    this.initPose = function (deviceOrient) {
		_this.firstRotation = deviceOrient.quaternion.clone();
		if (_this.useModelGravityDir){
			var q0 = new THREE.Quaternion().setFromUnitVectors( _this.modelGravityDir, new THREE.Vector3(0,0,-1) )
			// TODO: check formula
			_this.firstRotation.multiplyQuaternions( q0.inverse(),_this.firstRotation );
		}
		if (_this.useRelativeNorthDir){
			// we define the north in our model such that first observed position 
			// 		coresponds to the predefined position
			_this.modelNorth = _this.modelNorth.set(0,1,0).applyMatrix4(deviceOrient.matrix);
		}
		_this.modelNorth.sub( _this.modelGravityDir.clone().multiplyScalar( _this.modelNorth.dot( _this.modelGravityDir ) ) );
		
		//axisHelperDeviceInit.quaternion.copy(deviceOrient.quaternion);
	}
	
	this.update = function () {
		
		_this.controls.update();
		
		// Initialize the reference orientation of the model relatively to the earth
	    if ( _this.firstRotation ==null && _this.controls.deviceOrientation.alpha){
			_this.initPose(deviceOrientation);
		}
		
        _this.rotateCamera();

		_this.object.position.addVectors( _this.target, _eye );

		//_this.checkDistances();

		_this.object.lookAt( _this.target );
	}
		
};

function is_touch_device() {
  return ('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0);
}
function is_orientation_device() {
    var android = (navigator.userAgent.toLowerCase().indexOf('android') > -1);
    var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
    var has_orientation_api = !! window.DeviceOrientationEvent;
  return (android || iOS) && has_orientation_api;
}
