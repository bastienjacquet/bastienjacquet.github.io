/**
* @author Bastien Jacquet @ ETH 
*
* - hold parameter of a picture in a SfM framework
*
*/

// SfMCamera
THREE.SfMCamera = function ( extrinsic, view ) {

    THREE.Object3D.call( this);

    this.view = ( view !== undefined ) ? view : new THREE.SfMView();
    //this.camera = new THREE.PerspectiveCamera( this.view.vertical_fov(), this.view.width() / this.view.height(), THREE.SfMCamera.near, THREE.SfMCamera.far );
    //console.log(this.camera.projectionMatrix.toArray())
    this.camera = new THREE.GeneralIntrinsicCamera( this.view.intrinsic, this.view.size,  THREE.SfMCamera.near, THREE.SfMCamera.far);
    //console.log(this.camera.projectionMatrix.toArray())
    this.showCamera = true;
    this.add(this.camera);

	var _translation = new THREE.Vector3();
    var _quaternion = new THREE.Quaternion();
    var _scale = new THREE.Vector3();
    // var extrinsic is in [R,T] SfM notation. projection model is x(image_pixel) = K * (R * X + T ) with 3D point X in world coordinates.
    //  SfM conventionis that cameras look towards +Z
    camera_pose = new THREE.Matrix4().getInverse(extrinsic);
    camera_pose.decompose( _translation, _quaternion, _scale );  // Get back R and T from [R,T]
    var _position = _translation;//.applyQuaternion( _quaternion.clone().inverse() ).negate();
    
    // THREE.js : when an object is placed with R (as quaternion), scale S and position P. 
    //      then object.matrix is : [ S * R | P ]. 
    //      Child objects get as worldMatrix : Parent_matrix * local_matrix
    //      So worldPoint = object.matrix * localPoint
    // projection model is : gl_Position(in[-1,1]) = camera.projectionMatrix * camera.matrixWorldInverse * object.matrixWorld * vec4( position_in_object, 1.0 );
    //      THREE.js cameras are looking in -Z directions, and screen is -1 to 1
    //
    // See https://github.com/mrdoob/three.js/issues/1188

    // TL; DR: camera.matrix needs to be the **Inverse** of the SfM extrinsic

    this.quaternion.copy( _quaternion );
    this.position.copy( _position );
    this.updateMatrix(true);
    this.updateMatrixWorld();

    if ( this.showCamera ) {
        this.cameraHelper = new THREE.SfMCameraHelper( this );
        this.camera.add( this.cameraHelper );
    }
}

THREE.SfMCamera.near = -20;
THREE.SfMCamera.far = THREE.SfMCamera.near * 10 ;

THREE.SfMCamera.prototype = Object.create( THREE.Object3D.prototype );

THREE.SfMCamera.prototype.toString =  function SfMCameraToString() {
    var extrinsic = new THREE.Matrix4().getInverse(this.matrix);
    return "{ " +"View: " + this.view
        + ", \n" + "extrinsic:" + extrinsic
        + ", \n" + "center:[" + this.camera.position.toArray() + "]"
        + " }" ;
}



