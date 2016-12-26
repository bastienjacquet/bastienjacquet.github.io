/**
* @author Bastien Jacquet @ ETH 
*
* - a camera with a general projection matrix
*   NOTE that opengl will only allow orthogonal vertical and horizontal axis
*
*/

// General Camera Model with arbitrary projection matrix
THREE.GeneralIntrinsicCamera = function ( intrinsic, sensorSize, near, far ) {
    THREE.Camera.call( this );
    //intrinsic = sensorSize = undefined;
    this.intrinsic = intrinsic !== undefined ? intrinsic.clone() : new THREE.Matrix3().fromArray([1, 0, 0, 0, 1, 0, 0.5, 0.5, 1 ]);
    this.sensorSize = sensorSize !== undefined ? sensorSize : new Array(1, 0.8);
    this.near = near !== undefined ? near : 0.1;
    this.far = far !== undefined ? far : 2000;

    if (this.intrinsic.elements[3] != 0) 
        console.warn( 'THREE.GeneralIntrinsicCamera: camera matrices with skew factor are unsupported ! Skew will be ignored.') ;
    
    this.updateProjectionMatrix();
};

THREE.GeneralIntrinsicCamera.prototype = Object.create( THREE.Camera.prototype );

THREE.GeneralIntrinsicCamera.prototype.updateProjectionMatrix = function () {
    this.projectionMatrix.makeFrustumFromIntrinsic( this.intrinsic, this.sensorSize, this.near, this.far);
};

THREE.GeneralIntrinsicCamera.prototype.clone = function () {
    var camera = new THREE.GeneralIntrinsicCamera();
    THREE.Camera.prototype.clone.call( this, camera );
    camera.intrinsic = this.intrinsic;
    camera.sensorSize = this.sensorSize;
    camera.near = this.near;
    camera.far = this.far;
    return camera;
};

