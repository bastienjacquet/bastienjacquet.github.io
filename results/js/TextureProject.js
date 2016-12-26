
	//
	// Using Projective texturing to modulate spot lights by Popov
	//
	// brick textures from here: http://www.graphictivitis.com/index.php/25-amazing-brick-textures/ 
	// vendetta logo from here: http://www.seeklogo.com/v-for-vendetta-logo-146928.html

	var camera, scene, renderer, light;
	var uniforms, mesh;

	var moveLightTarget = false, rotateCube = true;

	

	function initProjector() {
	    var sfmCam = sfmCameras[0];
		var texture = sfmCam.imageTexture;

        THREE.ShaderLoader.loadShaders(["textureProjector.fragment","textureProjector.vertex"], function (shader){
    		var shaderPhong = THREE.ShaderLib[ "phong" ];

		    uniforms = THREE.UniformsUtils.clone( shaderPhong.uniforms);
		    uniforms[ "map" ].value = texture;
		    uniforms[ "specular" ].value = new THREE.Color(0x808080);
		    uniforms[ "shininess" ].value = 2000;
		    uniforms[ "mapProj"] = {
			    "type": "t", "value": texture
		    };
		    uniforms[ "textureMatrixProj"] = {
			    "type": "m4", "value": sfmCam.camera.projectionMatrix
		    };

		    var vertexShader = document.getElementById( 'vertexShader' ).textContent;
		    var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;

		    var parameters = {
			    fragmentShader: fragmentShader,
			    vertexShader: vertexShader,
			    uniforms: uniforms,
			    lights: true
		    };
		    
		    mesh = new THREE.Mesh( new THREE.CubeGeometry( 1000,600,600, 1, 1, 1 ), new THREE.ShaderMaterial( parameters ) );

		    scene.add( mesh );
        })
	}

	function makeProjectiveMatrixForLight(l) {
		var lightCamera = new THREE.PerspectiveCamera( 2*l.angle*180/Math.PI, 1.0, 1, 1000 );
		var lightMatrix = new THREE.Matrix4();
		var targetPosition = new THREE.Vector3();

		lightCamera.position.getPositionFromMatrix( l.matrixWorld );
		targetPosition.getPositionFromMatrix( l.target.matrixWorld );
		lightCamera.lookAt( targetPosition );
		lightCamera.updateMatrixWorld();

		lightCamera.matrixWorldInverse.getInverse( lightCamera.matrixWorld );

		lightMatrix.set( 0.5, 0.0, 0.0, 0.5,
						  0.0, 0.5, 0.0, 0.5,
						  0.0, 0.0, 0.5, 0.5,
						  0.0, 0.0, 0.0, 1.0 );

		lightMatrix.multiply( lightCamera.projectionMatrix );
		lightMatrix.multiply( lightCamera.matrixWorldInverse );

		return lightMatrix;
	}

