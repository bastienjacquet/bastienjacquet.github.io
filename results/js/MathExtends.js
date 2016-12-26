/**
* @author Bastien Jacquet @ ETH 
*
* - hold parameter of a picture in a SfM framework
*
*/

THREE.Matrix4.prototype.toString = function() {
    var te = this.elements;
    var n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
    var n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
    var n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
    var n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];
    return "\n[" + n11 + "," + n12 + "," + n13 + "," + n14 + ";\n"
            + n21 + "," + n22 + "," + n23 + "," + n24 + ";\n"
            + n31 + "," + n32 + "," + n33 + "," + n34 + ";\n"
            + n41 + "," + n42 + "," + n43 + "," + n44 + "]"
}



THREE.Matrix4.prototype.setRotationFromMatrix3 = function( m ) {
    var te = this.elements;
    var me = m.elements;
    te[ 0 ] = me[ 0 ];
    te[ 1 ] = me[ 1 ];
    te[ 2 ] = me[ 2 ];

    te[ 4 ] = me[ 3 ];
    te[ 5 ] = me[ 4 ];
    te[ 6 ] = me[ 5 ];

    te[ 8 ] = me[ 6 ];
    te[ 9 ] = me[ 7 ];
    te[ 10 ] = me[ 8 ];

    return this;
}

THREE.Matrix4.prototype.makeFrustumFromIntrinsic = function( intrinsic, sensorSize, near, far ) {
    var GLViewPortToImage = new THREE.Matrix3().fromArray([sensorSize[0]/2, 0, 0, 0, sensorSize[1]/2, 0, sensorSize[0]/2, sensorSize[1]/2, 1 ]);

    var intrinsicInverse = new THREE.Matrix3().getInverse( new THREE.Matrix4().identity().setRotationFromMatrix3(intrinsic) );
    // TODO with (0,0) being the principal point, we want to compute xmin, xmax, ymin, ymax (in the right?? frame)
    
    var topLeft = new THREE.Vector3(0, 0, 1).applyMatrix3(intrinsicInverse);
    var bottomRight = new THREE.Vector3( sensorSize[0], sensorSize[1], 1).applyMatrix3(intrinsicInverse);

    var ymax = near * Math.max( bottomRight.y, topLeft.y );
    var ymin = near * Math.min( bottomRight.y, topLeft.y );
    var xmin = near * Math.min( bottomRight.x, topLeft.x );
    var xmax = near * Math.max( bottomRight.x, topLeft.x );
    return this.makeFrustum( xmin, xmax, ymin, ymax, near, far );
}

