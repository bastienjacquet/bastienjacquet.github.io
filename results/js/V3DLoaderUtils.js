THREE.V3DLoader.loadingPage = function() {
	var div = document.createElement("div");
	div.id="message";
	div.innerHTML = '<span>Loading ...</span>'
			+ '<center>'
				+ '<div id="start" class="disabled">Please wait a moment while the meshes are downloaded ...</div>'
				+ '<progress value="0" id="progressbar" class="shadow"></progress>'
				+ '<div id="loaded"></div>'
			+ '</center>';
	div.getElementsByTagName('div')[1].style.backgroundColor = 'transparent';
	div.style.backgroundColor = 'transparent';
	div.style.position = 'absolute';
	div.style.top = '0px';
	div.style.zIndex = 100;
	div.style.width =  "100%";
	return div;
}

THREE.V3DLoader.cleanUpLoadingPage = function cleanUpLoadingPage() {
	document.getElementById( "message" ).style.display = "none";
}

THREE.V3DLoader.cleanUpLoadingScene = function (loadScene) {
  	cancelAnimationFrame(loadScene.requestAnimationFrameID);
}

THREE.V3DLoader.defaultProgressFunction = function ( item, loaded, total ) {
	document.getElementById( "progressbar" ).value = loaded;
	document.getElementById( "progressbar" ).max = total;
	var spanTag = document.createElement( 'span' );
	spanTag.innerHTML = item+"<br />";
	document.getElementById( "loaded" ).appendChild(spanTag);
	//console.log( item, loaded, total );
};

THREE.V3DLoader.createLoadScene = function createLoadScene() {

	var result = {

		scene:  new THREE.Scene(),
		camera: new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 1000 )

	};

	result.camera.position.z = 100;
	result.scene.add( result.camera );

	var object, geometry, material, light, count = 200, range = 200;

	material = new THREE.MeshLambertMaterial( { color:0xffffff } );
	geometry = new THREE.BoxGeometry( 5, 5, 5 );

	for( var i = 0; i < count; i++ ) {

		material = new THREE.MeshLambertMaterial( { color:Math.random()*0xffffff } );
	    object = new THREE.Mesh( geometry, material );

		object.position.x = ( Math.random() - 0.5 ) * range;
		object.position.y = ( Math.random() - 0.5 ) * range;
		object.position.z = ( Math.random() - 0.5 ) * range;

		object.rotation.x = Math.random() * 6;
		object.rotation.y = Math.random() * 6;
		object.rotation.z = Math.random() * 6;
        object.matrixAutoUpdate = false;
		object.updateMatrix();

		result.scene.add( object );

	}
    timeStep = 0.05;
    result.updateScene = function () {
        result.scene.traverse( function (object){

	        if ( !(object instanceof THREE.Mesh ) ) return;
            if (! object.speed)
                object.speed = new THREE.Vector3();
            object.speed.add(new THREE.Vector3( ( Math.random() - 0.5 ) * range * timeStep,
                                            ( Math.random() - 0.5 ) * range * timeStep,
                                            ( Math.random() - 0.5 ) * range * timeStep));
	        object.translateOnAxis( object.speed, timeStep );

	        object.rotateX(  Math.random() * timeStep );
	        object.rotateY(  Math.random() * timeStep );
	        object.rotateZ(  Math.random() * timeStep );

	        object.updateMatrix();
        });
    }

	result.scene.matrixAutoUpdate = false;

	light = new THREE.PointLight( 0xffffff );
	result.scene.add( light );

	light = new THREE.DirectionalLight( 0x111111 );
	light.position.x = 1;
	result.scene.add( light );

	return result;

}

THREE.V3DLoader.initStandardLoadingScene = function initStandardLoadingPage() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// create a loadScene to show while loading meshes.
	var loadScene = THREE.V3DLoader.createLoadScene();
	camera = camera_fly = loadScene.camera;
	scene = loadScene.scene;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = "relative";
	container.appendChild( renderer.domElement );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMapEnabled = true;

	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.right = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );

	// EVENTS
	window.addEventListener( 'resize', onWindowResize, false );

	// Controls
    controls = new THREE.TrackballControls( camera_fly, container );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 5;
    controls.panSpeed = 1;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.5;
    controls.keys = [ 65, 83, 68 ];
    controls.addEventListener( 'change', render );

	//Animations
	function animate() {
		loadScene.requestAnimationFrameID = requestAnimationFrame( animate );
		if (controls) controls.update();
		loadScene.updateScene();
		render();
		stats.update();
	}
	animate();
	return loadScene;
}

THREE.V3DLoader.initDefaultGUI = function initGUI() {
	// Collect models/meshes 
	var Meshes = [];
    scene.traverse( function (mesh){
        if (! (mesh instanceof THREE.Mesh) || (!mesh.name)) return;
		Meshes.push(mesh);
    });
    gui = new dat.GUI();
    // Main Camera
    var guiCamera = gui.addFolder('Viewer');
    fov = guiCamera.add( camera_fly , 'fov', 10, 180 ).step(2).name("Cam Vert FoV");
    fov.onChange(function(value) {
        camera_fly.updateProjectionMatrix();
	    render();
    });
    // Main Camera base mesh 
	var cameraBaseMeshes ={};
    for (var m in Meshes){
		var mesh = Meshes[m];
		cameraBaseMeshes[mesh.parent.name] = mesh.parent.id;
    }
	if (Meshes.length > 1) {
		params["cameraBaseMesh"] = scene.getMainObject().id;
		guiCamera.add(params, "cameraBaseMesh", cameraBaseMeshes).name("Camera base").onChange(function (baseMeshId){
			scene.getObjectById(parseInt(baseMeshId),true)
				.add(camera_fly)
				.add(spotLight);
		})
		scene.getObjectById(parseInt(params["cameraBaseMesh"]),true)
				.add(camera_fly)
				.add(spotLight);
	}
    // Camera selection
    gui_array = {"  None  ":-1};
    gui_cameraArray = {};
    scene.traverse( function collectSfMCameras(obj){
        if (!(obj instanceof THREE.SfMCamera)) return;
        var cameraStr = "SFM #" + obj.view.viewId + " | " + obj.parent.name;
        gui_array[cameraStr]= obj.id ;
    });


    guiCamera.add(params, "camera_selected", gui_array).name("SfM Camera").onChange(function (e) {
		var result;
			if (e>=0){
				var cam_i = scene.getObjectById(parseInt(e),true);
				cam_i.parent.add(camera_fly)
				camera_fly.position.copy(cam_i.position);
				//camera_fly.rotation.copy(cam_i.rotation);
				//camera=cam_i.camera;
				render();
			}else{
				//camera_fly.position = camera.position.clone();
				//camera_fly.rotation.set(camera.position);
				//camera=camera_fly;
				render();
			}
		});
    // Light
    guiCamera.add(spotLight, "intensity").min(0).max(1).step(0.05).name("Spotlight I");
    guiCamera.add(params, "showSfMCameras").name("Show Cameras").onChange(showSfMCameras);
    /*guiCamera.add(params, "showCamerasCones").name("Cameras cones").onChange(function (visible) {
        scene.traverse( function (obj){
            if (!(obj instanceof THREE.SfMCamera)) return;
            obj.showProjectionCube = visible;
        });
        render();
    });*/
	guiCamera.open();
    // Options for Meshes 
    scene.traverse( function (mesh){
        if (! (mesh instanceof THREE.Mesh) || (!mesh.name)) return;
        params.meshes[m] = { color : mesh.material.color.getHex() , mesh: mesh, side:"front"}
        var guiMeshCurrent = gui.addFolder('Mesh '+ m + ': "' + mesh.parent.name + '"');
        // Gui for mesh color / opacity
		mesh.parent.meshColor = '#'+mesh.material.color.getHexString();
        var color = guiMeshCurrent.addColor(mesh.parent, 'meshColor').name("Color")
        	.onChange(function(value) {
            mesh.parent.meshColor=String(mesh.parent.meshColor).replace( '#','0x' );
			mesh.material.color.setHex(mesh.parent.meshColor);
			mesh.material.ambient.setHex(mesh.parent.meshColor);
            
			mesh.parent.traverse( function (obj){
				if (!(obj instanceof THREE.SfMCamera)) return;
				obj.cameraHelper.setColor(mesh.parent.meshColor) ;
			});

            render();
        });
        var opacity = guiMeshCurrent.add(params.meshes[m].mesh.material, 'opacity').name("Opacity").min(0).max(1).step(0.5)
                .listen().onChange(function (e) {
            // Here we force visibility/transparency for extreme opacity value
            //    This is a known limitation of transparency in openGL/webGL (object should be rendered back to front to avoid alpha z-buffer occlusion, but intersecting transparent objects cannot be sorted)
            //    See https://github.com/mrdoob/three.js/issues/4814
            mesh.material.visible=(mesh.material.opacity!=0);
            mesh.material.transparent=(mesh.material.opacity!=1);
            mesh.material.needsUpdate = true;
            render();
        });
        var wireFrame = guiMeshCurrent.add(mesh.material, 'wireframe').onChange(function (e) {
            if (mesh.geometry instanceof THREE.Geometry){
                mesh.material.wireframe = e;
                return;
            }else {
                if (!mesh.WireframeHelper){
                    mesh.WireframeHelper = new THREE.WireframeHelper (mesh);
                    scene.add(mesh.WireframeHelper)
                }
                mesh.WireframeHelper.material.color = mesh.material.color;
                mesh.WireframeHelper.visible = e;
                mesh.visible = !e;
            }
        });
        
        //var visible = guiMeshCurrent.add(params.meshes[m].mesh.material, 'visible').onChange(render);
        if (mesh.parent.obsMatrix){
            var obsRel = {};
            for (var r in mesh.parent.obsMatrix)
                obsRel[ "#"+ r + (mesh.parent.obsMatrix[ r ].viewId || "") ]=r;
            mesh.parent.curObs = 0 ;
            guiMeshCurrent.add(mesh.parent, 'curObs', obsRel).name("Observed Pose").onChange(function (e) {
				mesh.parent.autoAnimateDelta = 0;
                mesh.parent.obsMatrix[e].matrix.decompose( mesh.parent.position, mesh.parent.quaternion, mesh.parent.scale );
            });
            // Provide auto animation
			mesh.parent.autoAnimateDelta = 1 ;
            guiMeshCurrent.add(mesh.parent, 'autoAnimateDelta').min(0).max(10).step(0.5).listen()
			var autoAnimate = function() {
				if (mesh.parent.autoAnimateDelta <= 0) return;
				var r = clock.getElapsedTime();
				var obj = mesh.parent;
				var state = Math.floor ( (r / mesh.parent.autoAnimateDelta) % obj.obsMatrix.length ) ;
				obj.obsMatrix[state].matrix.decompose( obj.position, obj.quaternion, obj.scale );
			}
			if (! animate.funcs ) animate.funcs=[];
			animate.funcs.push(autoAnimate);
        }
		mesh.on('mouseover', function (){ 
			mesh.realColor = mesh.material.color;
			mesh.material.color = new THREE.Color(1,1,0);
			});
		mesh.on('mouseout', function (){ 
			mesh.material.color = mesh.realColor;
			});
		//guiMeshCurrent.open();
    })
    //alert(nMesh + " processed")
}


