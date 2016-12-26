varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;
uniform vec4 offsetRepeat;
varying vec3 vWorldPosition;

uniform mat4 textureMatrixProj; // for projective texturing
varying vec4 texCoordProj; // for projective texturing

void main() {
	vUv = uv * offsetRepeat.zw + offsetRepeat.xy;

	vec3 transformedNormal = normalMatrix * normal;
	vNormal = normalize( transformedNormal );

	vec4 mvPosition;
	mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vViewPosition = -mvPosition.xyz;

	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
	vWorldPosition = worldPosition.xyz;

	texCoordProj = textureMatrixProj * modelMatrix * vec4(position, 1.0);  // for projective texturing
} 
