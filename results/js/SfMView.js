/**
* @author Bastien Jacquet @ ETH 
*
* - hold parameter of a picture in a SfM framework
*
*/

THREE.SfMView = function ( viewId, intrinsic, size, imageFilename, thumbnailFilename ) {

        this.viewId = ( viewId !== undefined ) ? viewId : THREE.SfMView.maxViewId + 1;
        this.intrinsic = ( intrinsic !== undefined ) ? intrinsic : new THREE.Matrix3();
        this.size = ( size === undefined ) ? new Array( 1, 0.8) :  new Array(size) ;
        this.imageFilename = ( imageFilename !== undefined ) ? imageFilename : "";
        this.thumbnailFilename = ( thumbnailFilename !== undefined ) ? thumbnailFilename : "mini/" + this.imageFilename;

        THREE.SfMView.maxViewId = Math.max( THREE.SfMView.maxViewId , this.viewId );
    };

THREE.SfMView.maxViewId = -1;

THREE.SfMView.prototype = {

    constructor: THREE.SfMView,

    width: function() {
        return this.size[0];
    },

    height: function() {
        return this.size[1];
    },

    vertical_fov: function() {
        // TODO : this is an approximation ... we could do better ! 
        return THREE.Math.radToDeg( 2 * Math.atan( ( this.height() / 2 ) / this.intrinsic.elements[4] ) );
    },

    setTbFilename: function (thumbnailFilename) {
        this.thumbnailFilename = ( thumbnailFilename !== undefined ) ? thumbnailFilename : "mini/" + this.imageFilename;
    },

    toString: function viewToString() {
        return "{ " +"id:#" + this.viewId
            + ", " + "intrinsic:[" + this.intrinsic.toArray() + "]"
            + ", " + "size:[" + this.size + "]"
            + ", " + "image:\"" + this.imageFilename + "\""
            + ", " + "thumbnail:\"" + this.thumbnailFilename  + "\""
            + " }" ;
    },
}


