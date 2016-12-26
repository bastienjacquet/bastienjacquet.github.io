/**
 * @author Bastien Jacquet @ ETH 
 */

THREE.V3DLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
    this.data = {};
    this.isLoaded = {};
    this.queueDepGraph = [];// list of {name:'',func:function,dependsOn:[]}
    this.logParseInfo = false;
    this.manager.onProgress = function ( item, loaded, total ) {

		console.log( item, loaded, total );

	};

    var scope = this;
    this.manager.onLoad = function () {
        scope.async_callback_gate();
        scope.isLoaded['AllLoaded'] = true;
        scope.async_callback_gate();
        if ( scope.onAllLoaded !== undefined )
            scope.onAllLoaded();

    }
    this.scene = new THREE.Scene();
	this.scene.getMainObject = function () {
		if (this.mainObjectName){
			return this.getObjectByName(this.mainObjectName,true);
		} else {
			return this.children.filter(function(o){return (o.name);})[0];
		}
	}
    var loader = this;
};

THREE.V3DLoader.prototype = {

	constructor: THREE.V3DLoader,
    
    async_callback_gate: function async_callback_gate( ) {
        for ( var q in this.queueDepGraph ){
            var queuedAction = this.queueDepGraph[ q ] ;
            if ( queuedAction.isExecuted ) continue;
            var areDependenciesLoaded = true;
            for ( var d in queuedAction.dependsOn )
                areDependenciesLoaded = areDependenciesLoaded && this.isLoaded[ queuedAction.dependsOn[ d ] ];
            if ( areDependenciesLoaded ) {
                this.isLoaded[ queuedAction.name ] = queuedAction.isExecuted = true;
                args = [];
                if (queuedAction.data) args.push(queuedAction.data)
                for ( var d in queuedAction.dependsOn ) args.push( this.data[ queuedAction.dependsOn[ d ] ] )
                this.data[ queuedAction.name ] = queuedAction.func.apply( undefined, args );
                this.async_callback_gate();
            }
        }
    },

    asyncLoadedCallbackWrapper: function( name, func, dependsOn ){
        this.isLoaded[name] = false;
        var scope = this;
        return function processLoadedData( data ) {
            scope.queueDepGraph.push( {name:name, func:func, data:data, dependsOn:dependsOn} )
            scope.async_callback_gate.call( scope );
        }
    },

	loadFileNames: function ( url, onLoad ) {

		var scope = this;
        if (onLoad) this.queueDepGraph.push( {name:'FileNamesCB', func:onLoad, dependsOn:['Views'] });

		var loader = new THREE.XHRLoader( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
        loader.setResponseType( 'text' );
		loader.load( url, this.asyncLoadedCallbackWrapper ( 'FileNames', scope.parseFilenames ) );
	},

    loadCalibDb: function ( url, onLoad ) {

		var scope = this;
        if (onLoad) this.queueDepGraph.push( {name:'CalibCB', func:onLoad, dependsOn:['Views'] });
        
        this.queueDepGraph.push( {name:'Views', func:this.mergeFilenameCalibDb, dependsOn:['FileNames','Calibs'] });

		var loader = new THREE.XHRLoader( scope.manager );
		loader.setCrossOrigin( this.crossOrigin );
        loader.setResponseType( 'text' );
		loader.load( url, this.asyncLoadedCallbackWrapper ( 'Calibs', scope.parseCalibDb ) );
	},

	loadExtrinsics: function ( url, onLoad ) {
		var scope = this;
        var _url = ( url instanceof Array ) ? url[0] : url;
        var _parentObjectName = (url instanceof Array && url.length > 1)? url[1] : "main";
        onLoad = onLoad || this.defaultExtrinsicLoaderCallbackCreator() ;

        var deps = [];
        if (this.isLoaded.Calibs !== undefined ) deps.push('Views')

		var loader = new THREE.XHRLoader( scope.manager );
		loader.setCrossOrigin( this.crossOrigin );
        loader.setResponseType( 'text' );
        var handleExtrinsics = function ( data, views ) { 
            return onLoad( scope.parseExtrinsics( data, views ), _parentObjectName );
        } ;

		loader.load( _url, this.asyncLoadedCallbackWrapper( 'Extrinsics', handleExtrinsics, deps ) );

	},

    loadMesh: function ( url, onLoad ) {
        var scope = this;
        _url = ( url instanceof Array ) ? url[0] : url;
        _color = ( ( url instanceof Array ) && ( url.length > 1 ) ) ? url[ 1 ] : 0xffffff ;
        _parentObjectName = (url instanceof Array && url.length > 2 )? url[ 2 ] : "main";
        onLoad = onLoad || this.defaultMeshGeometryCallbackCreator( _color, _parentObjectName ) ;

        this.manager.itemStart( _url )
        var loader = new THREE.CTMLoader();
        var handleCTM = function (geometry) {
            onLoad(geometry);
            scope.manager.itemEnd( _url );
        }
        loader.load( _url, handleCTM, { useWorker: true } );// 
    },

    loadRelativeObservations: function ( url, objMap, onLoad ) {
		var scope = this;
        onLoad = onLoad || this.defaultRelativeObservationsLoaderCallbackCreator() ;

        var loader = new THREE.XHRLoader( scope.manager );
		loader.setCrossOrigin( this.crossOrigin );
        loader.setResponseType( 'text' );
        var handleRelativeObs = function ( data ) { 
            return onLoad( scope.parseRelativeObservations( data, objMap ) );
        } ;

		loader.load( url, this.asyncLoadedCallbackWrapper( 'RelativeObs', handleRelativeObs, ['AllLoaded'] ) );

	},
	setInitialCameraBase: function (objectName){
		this.scene.mainObjectName = objectName;
	},
	
	parseFilenames: function ( text ) {

		var filenames = [];

		var lines = text.split( '\n' );
		for ( var i = 0; i < lines.length ; i ++ ) {
            var line = lines[ i ].trim();
            if ( line.length == 0 ) continue;
            filenames.push( { viewId: filenames.length, imageFilename: line} );
            if (this.logParseInfo) 
                console.log( "THREE.V3DLoader.parseFilenames: View id #" + filenames.slice(-1)[0].viewId + " : " + line );
		}

		return filenames;

	},

	parseCalibDb: function ( text ) {

		var views = [];

		var lines = text.split( '\n' );
        var num_cameras = parseInt(lines[ 0 ]);
        var matrix_line_pattern = /(\s*[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)/;
		for ( var i = 0; i < num_cameras; i ++ ) {
            var _intrinsic = new THREE.Matrix3(); 
            var size = new Array();
            var line = lines[ i + 1 ].trim();
            var result = matrix_line_pattern.exec( line );
            if (result === null || result.length != 12) console.warn("THREE.V3DLoader.CalibDb : error parsing line '" + line + "'");

            // THREE matrix are column major, V3D file is in row major
            _intrinsic.elements[ 0 ] = parseFloat( result[ 1 ] );
            _intrinsic.elements[ 3 ] = parseFloat( result[ 2 ] );
            _intrinsic.elements[ 6 ] = parseFloat( result[ 3 ] );
            _intrinsic.elements[ 4 ] = parseFloat( result[ 4 ] );
            _intrinsic.elements[ 7 ] = parseFloat( result[ 5 ] );
            _intrinsic.elements[ 1 ] = 0;
            _intrinsic.elements[ 2 ] = 0;
            _intrinsic.elements[ 5 ] = 0;
            _intrinsic.elements[ 8 ] = 1;

            size[0] = parseFloat( result[ 10 ] );
            size[1] = parseFloat( result[ 11 ] );

            views.push( {viewId: views.length, intrinsic: _intrinsic, size: size} );
            if (this.logParseInfo) 
                console.log( "THREE.V3DLoader.parseCalibDb: Calib of View #" + i + ": size " + size[0] + "x" + size[1] + ", intrinsic " + _intrinsic.toArray() );
		}

		return views;

	},

    mergeFilenameCalibDb: function ( filenameDb, calibDb) {
        var views = [];
		for ( var i = 0 ; i < filenameDb.length ; i ++ ) {
            var viewId = filenameDb[ i ].viewId;
            if ( views[ viewId ] === undefined ) views[ viewId ] = new THREE.SfMView(viewId);
            views[ viewId ].imageFilename = filenameDb[ i ].imageFilename;
            views[ viewId ].setTbFilename();
        }
		for ( var i = 0 ; i < calibDb.length ; i ++ ) {
            var viewId = calibDb[ i ].viewId;
            if ( views[ viewId ] === undefined ) views[ viewId ] = new THREE.SfMView(viewId);
            views[ viewId ].intrinsic = calibDb[ i ].intrinsic;
            views[ viewId ].size = calibDb[ i ].size;
        }

        return views;
    },

	parseExtrinsics: function ( text, views ) {
        
		var cameras = [];
		var lines = text.split( '\n' );
        var num_cameras = parseInt(lines[ 0 ]);
        var matrix_line_pattern = /(\s*[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)/;
		for ( var i = 0; i < num_cameras; i ++ ) {

            var line_i = 1 + (i * 4);
            var camera_id = parseInt(lines[ line_i ])
            
            //var camera_matrix = THREE.V3DLoader.prototype.parseMatrix(3 ,4 , lines, line_i + 1, 4, 4); 
            var camera_matrix = new THREE.Matrix4().identity(); 

			for (var l = 0 ; l < 3; l++){
                var line = lines[ line_i + l + 1 ].trim();
                var result = matrix_line_pattern.exec( line );
                if (result === null || result.length != 5) console.warn("THREE.V3DLoader : error parsing line '" + line + "'");
                for (var c = 0 ; c < 4; c++){
                    // THREE matrix are column major
                    camera_matrix.elements[ c * 4 + l ] = parseFloat( result[ 1 + c ] );
                }
            }
            cameras.push( new THREE.SfMCamera( camera_matrix, views ? views[ camera_id ] : new THREE.SfMView() ) );
            if (this.logParseInfo) 
                console.log( "THREE.V3DLoader.parseExtrinsics: Camera " + i + " using view #" + camera_id + ": "+ views[ camera_id ]  + ", extrinsic:[" + camera_matrix.toArray() + "]"  );
		}

		return cameras;
	},
	
	parseMatrix: function parseMatrix(srcN, srcM, lines, lineOffset, dstN, dstM ){
	    String.prototype.repeat = function( num )
        {
            return new Array( num + 1 ).join( this );
        }
	    function regExpForLine(M){
	        return new RegExp("(\\s*[\\d|\\.|\\+|\\-|e]+)" + "(\\s+[\\d|\\.|\\+|\\-|e]+)".repeat( M - 1 ));
        }
        dstN = dstN || srcN, dstM = dstM || srcM;
        elements = [];
        elements[dstN * dstM - 1 ] = 0;
        lineRegExp = regExpForLine(srcM);
        
        for (var l = 0 ; l < srcN; l++){
            var line = lines[ lineOffset + l ].trim();
            var result = lineRegExp.exec( line );
            if (result === null || (result.length - 1) != srcM) console.warn("THREE.parseMatrix : error parsing line '" + line + "' : should have " + srcM + " int, here : " + result.length + lineRegExp + result);
            for (var c = 0 ; c < srcM; c++)
                elements[ c * dstN + l ] = parseFloat( result[ 1 + c ] ); // THREE matrix are column major
            
        }
        if (dstN!=dstM) console.warn( "THREE.V3DLoader.parseMatrix: Non square matrix " + dstN + " x " + dstM );
        if (dstN==4) return new THREE.Matrix4().fromArray(elements);
        if (dstN==3) return new THREE.Matrix3().fromArray(elements);
	},
	
	parseRelativeObservations: function ( text, objMap ) {
	    var relativeTransforms =[];
		var lines = text.split( /\n+/ );
        var num_mat = Math.floor( lines.length / 4 );
        var matrix_line_pattern = /(\s*[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)/;
        var edge_line_pattern = /(\s*[\d|\.|\+|\-|e]+)(\s+[\d|\.|\+|\-|e]+)/;
		for ( var i = 0; i < num_mat; i ++ ) {
            var line_i =  (i * 4);

            var result = edge_line_pattern.exec( lines[ line_i ] )
            var ref = parseInt(result[1]), dst = parseInt(result[2]);
            
            var matrix = new THREE.Matrix4().identity(); // THREE matrix are column major

			for (var l = 0 ; l < 3; l++){
                var line = lines[ line_i + l + 1 ].trim();
                var result = matrix_line_pattern.exec( line );
                if (result === null || result.length != 5) console.warn("THREE.V3DLoader : error parsing line '" + line + "'");
                for (var c = 0 ; c < 4; c++){
                    // THREE matrix are column major
                    matrix.elements[ c * 4 + l ] = parseFloat( result[ 1 + c ] );
                }
            }
            relativeTransforms.push( {ref:objMap[ ref ], obj:objMap[ dst ], matrix:matrix } );
            if (this.logParseInfo) 
                console.log( "THREE.V3DLoader.parseRelativeObservations: " + objMap[ ref ] + "  -> " + objMap[ dst ] + ": [" + matrix.toArray() + "]"  );
		}

		return relativeTransforms;
	},

    defaultExtrinsicLoaderCallbackCreator: function (){
        var scope = this;
        return function cameraLoader( SfMCameras, parentObjectName  ) {
            var parentObjectName = parentObjectName || "main";
            var parentObject = scope.scene.getObjectByName(parentObjectName, true);
            if ( parentObject === undefined ){
                parentObject = new THREE.Object3D();
                parentObject.name = parentObjectName;
                scope.scene.add(parentObject);
            }
            for (var i = 0 ; i < SfMCameras.length ; i++){
                parentObject.add( SfMCameras[ i ] );
                if (this.logParseInfo) console.log("THREE.V3DLoader.defaultExtrinsicLoader: camera " + i + ": " + SfMCameras[ i ] );
            }
        }
    },

    defaultMeshGeometryCallbackCreator: function meshLoader( meshColor, parentObjectName  ) {
        var scope = this;
        return function defaultMeshGeometryCallback(geometry){
            parentObjectName = parentObjectName || "main";
            var parentObject = scope.scene.getObjectByName(parentObjectName, true);
            if ( parentObject === undefined ){
                parentObject = new THREE.Object3D();
                parentObject.name = parentObjectName;
                scope.scene.add(parentObject);
            }
            var material = new THREE.MeshPhongMaterial( { 
                ambient: meshColor, color: meshColor, /*emissive: meshColor,*/ specular: 0x333333, 
                shininess: 10, shading: THREE.SmoothShading,transparent: false, opacity: 1 } );
		    var mesh = new THREE.Mesh( geometry, material );
		    mesh.castShadow = true;
		    mesh.receiveShadow = true;
            mesh.name = parentObjectName + "|Mesh";
		    parentObject.add( mesh );
		}
    },
    
    defaultRelativeObservationsLoaderCallbackCreator: function (){
        var scope = this;
        return function defaultRelativeObservationsLoaderCallback(relativeTransforms){
            for (var i in relativeTransforms) {
                var parentObjectName = relativeTransforms[i].ref;
                var parentObject = scope.scene.getObjectByName(parentObjectName, true);
                var curObjectName = relativeTransforms[i].obj;
                var curObject = scope.scene.getObjectByName(curObjectName, true);
                parentObject.add(curObject);
                if (! curObject.obsMatrix) curObject.obsMatrix=[];
                curObject.obsMatrix.push({matrix:relativeTransforms[i].matrix,viewId:relativeTransforms[i].viewId});
            }
        }
    },
};