/**
* @author Bastien Jacquet @ ETH based on work from alteredq / http://alteredqualia.com/
*
* - shows frustum, line of sight and up of the sfMCamera
* - suitable for fast updates
* - based on frustum visualization in lightgl.js shadowmap example
* http://evanw.github.com/lightgl.js/tests/shadowmap.html
*/

THREE.SfMCameraHelper = function ( sfMCamera ) {

    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );

    var useImageTexture = true;
    var imageGeometry = new THREE.Geometry();
    var imageTexture, imageMaterial, imageMesh;

    var pointMap = {};

    // colors

    var hexFrustum = 0xffaa00;
    var hexCone = 0xff0000;
    var hexUp = 0x00aaff;
    var hexTarget = 0xffffff;
    var hexCross = 0x333333;

    // near

    addLine( "n1", "n2", hexFrustum );
    addLine( "n2", "n4", hexFrustum );
    addLine( "n4", "n3", hexFrustum );
    addLine( "n3", "n1", hexFrustum );

    // far

    addLine( "f1", "f2", hexFrustum );
    addLine( "f2", "f4", hexFrustum );
    addLine( "f4", "f3", hexFrustum );
    addLine( "f3", "f1", hexFrustum );

    // sides

    addLine( "n1", "f1", hexFrustum );
    addLine( "n2", "f2", hexFrustum );
    addLine( "n3", "f3", hexFrustum );
    addLine( "n4", "f4", hexFrustum );

    // cone

    addLine( "p", "n1", hexCone );
    addLine( "p", "n2", hexCone );
    addLine( "p", "n3", hexCone );
    addLine( "p", "n4", hexCone );

    // up

    addLine( "u1", "u2", hexUp );
    addLine( "u2", "u3", hexUp );
    addLine( "u3", "u1", hexUp );

    // target

    addLine( "c", "t", hexTarget );
    addLine( "p", "c", hexCross );

    // cross

    addLine( "cn1", "cn2", hexCross );
    addLine( "cn3", "cn4", hexCross );

    addLine( "cf1", "cf2", hexCross );
    addLine( "cf3", "cf4", hexCross );

    function addLine( a, b, hex ) {

        addPoint( a, hex );
        addPoint( b, hex );

    }

    function addPoint( id, hex ) {

        geometry.vertices.push( new THREE.Vector3() );
        geometry.colors.push( new THREE.Color( hex ) );

        if ( pointMap[ id ] === undefined ) {

            pointMap[ id ] = [];

        }

        pointMap[ id ].push( geometry.vertices.length - 1 );

    }
    THREE.Object3D.call( this);
    this.wireframeMesh = new THREE.Line(geometry, material, THREE.LinePieces );
    this.add(this.wireframeMesh);

    this.imageMesh = undefined;
    if (useImageTexture) {
        for (var i = 0 ; i < 4 ; i++) {
            imageGeometry.vertices.push( new THREE.Vector3() );
        }
        // with positive depth
        // corner id        triangles
        // 2  --  3         023  --  123
        // 0  --  1         012  --  013
        //


        imageGeometry.faces.push(new THREE.Face3(1, 0, 3) );  
        imageGeometry.faces.push(new THREE.Face3(0, 2, 3) );
        // Draw the image texture
        var imageCoord = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1)
        ];
        imageGeometry.faceVertexUvs[0] = [];
        imageGeometry.faceVertexUvs[0][0] = [ imageCoord[0], imageCoord[1], imageCoord[3] ];
        imageGeometry.faceVertexUvs[0][1] = [ imageCoord[1], imageCoord[2], imageCoord[3] ];

       
        var imageTexture = new THREE.ImageUtils.loadTexture( sfMCamera.view.thumbnailFilename );
	    var imageMaterial = new THREE.MeshLambertMaterial( { map: imageTexture, emissive: 0xffffff, side: THREE.DoubleSide } );
        //var imageMaterial = new THREE.MeshPhongMaterial( { ambient: 0x050505, color: 0x0033ff, specular: 0x555555, shininess: 30, side: THREE.DoubleSide  } );
 
        this.imageMesh = new THREE.Mesh(imageGeometry, imageMaterial );
        this.add(this.imageMesh);
    }
    this.sfMCamera = sfMCamera;
    this.matrixWorld = sfMCamera.camera.matrixWorld;
    this.matrixAutoUpdate = false;
    this.useImageTexture = useImageTexture;

    this.pointMap = pointMap;
    this.sensorRect = [-0.5, 0.5, -0.4, 0.4];
    this.sensorRect = [-1, 1, -1, 1];
    //this.sfMCamera.view.intrinsic = new THREE.Matrix3();
    //this.updateSensorRect();
    this.showProjectionCube = false;
    this.update();

};

THREE.SfMCameraHelper.prototype = Object.create( THREE.Object3D.prototype );

THREE.SfMCameraHelper.prototype.updateSensorRect = function () {
    var intrinsicInverse = new THREE.Matrix3().getInverse( new THREE.Matrix4().identity().setRotationFromMatrix3(this.sfMCamera.view.intrinsic) );
    var topLeft = new THREE.Vector3(0, 0, 1).applyMatrix3(intrinsicInverse);
    var bottomRight = new THREE.Vector3( this.sfMCamera.view.size[0], this.sfMCamera.view.size[1], 1).applyMatrix3(intrinsicInverse);

    var ymax = Math.max( bottomRight.y, topLeft.y );
    var ymin = Math.min( bottomRight.y, topLeft.y );
    var xmin = Math.min( bottomRight.x, topLeft.x );
    var xmax = Math.max( bottomRight.x, topLeft.x );

    this.sensorRect = [xmin, xmax, ymin, ymax];
}
THREE.SfMCameraHelper.prototype.setColor = function( hex ){
    var scope = this;
    function changeColorPoint(id, hex){
        var points = scope.pointMap[ id ];
        if ( points !== undefined ) {
            for ( var i = 0, il = points.length; i < il; i ++ ) {
                scope.wireframeMesh.geometry.colors[ points[ i ] ].set(hex);
            }

        }
    }
    changeColorPoint("p",hex);
}
THREE.SfMCameraHelper.prototype.update = function () {

    var vector = new THREE.Vector3();
    var camera = new THREE.Camera();
    var projector = new THREE.Projector();

    return function () {

        var scope = this;

        var l = scope.sensorRect[0], r = scope.sensorRect[1], b = scope.sensorRect[2], t = scope.sensorRect[3];
        var ppx = ( l + r ) / 2;
        var ppy = ( t + b ) / 2;
        var f = this.sfMCamera.showProjectionCube ? 1 : -1 ;
        
        // we need to compute the sensor corners in camera coordinates

        camera.projectionMatrix.copy( this.sfMCamera.camera.projectionMatrix );

        // center / target

        setPoint( "c", ppx, ppy, - 1 );
        setPoint( "t", ppx, ppy, f );

        // near

        setPoint( "n1", l,  b, - 1 );
        setPoint( "n2", r,  b, - 1 );
        setPoint( "n3", l, t, - 1 );
        setPoint( "n4", r, t, - 1 );

        // far

        setPoint( "f1", l,  b, f );
        setPoint( "f2", r,  b, f );
        setPoint( "f3", l, t, f );
        setPoint( "f4", r, t, f );

        // up

        setPoint( "u1", r * 0.7, t * 1.1, - 1 );
        setPoint( "u2", l * 0.7, t * 1.1, - 1 );
        setPoint( "u3", 0, t * 2, - 1 );

        // cross

        setPoint( "cf1", l, 0, f );
        setPoint( "cf2", r, 0, f );
        setPoint( "cf3", 0,  b, f );
        setPoint( "cf4", 0, t, f );

        setPoint( "cn1", l, 0, - 1 );
        setPoint( "cn2", r, 0, - 1 );
        setPoint( "cn3", 0,  b, - 1 );
        setPoint( "cn4", 0, t, - 1 );

        function setPoint( point, x, y, z ) {

            vector.set( x, y, z );
            projector.unprojectVector( vector, camera );

            var points = scope.pointMap[ point ];

            if ( points !== undefined ) {

                for ( var i = 0, il = points.length; i < il; i ++ ) {

                    scope.wireframeMesh.geometry.vertices[ points[ i ] ].copy( vector );

                }

            }

        }
        this.wireframeMesh.geometry.verticesNeedUpdate = true;

        if (scope.useImageTexture) {
            scope.imageMesh.geometry.vertices[ 0 ].copy( scope.wireframeMesh.geometry.vertices[ scope.pointMap[ "n1" ][ 0 ] ] );
            scope.imageMesh.geometry.vertices[ 1 ].copy( scope.wireframeMesh.geometry.vertices[ scope.pointMap[ "n2" ][ 0 ] ] );
            scope.imageMesh.geometry.vertices[ 2 ].copy( scope.wireframeMesh.geometry.vertices[ scope.pointMap[ "n3" ][ 0 ] ] );
            scope.imageMesh.geometry.vertices[ 3 ].copy( scope.wireframeMesh.geometry.vertices[ scope.pointMap[ "n4" ][ 0 ] ] );
            this.imageMesh.geometry.verticesNeedUpdate = true;
        }
        
    
    };

}();
