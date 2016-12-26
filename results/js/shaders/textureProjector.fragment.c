uniform vec3 diffuse;
uniform float opacity;
const vec3 ambient = vec3(1.0, 1.0, 1.0);
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
varying vec2 vUv;
uniform sampler2D map;
const vec3 ambientLightColor = vec3(0.25, 0.25, 0.25);

uniform vec3 spotLightColor[ 1 ];
uniform vec3 spotLightPosition[ 1 ];
uniform vec3 spotLightDirection[ 1 ];
uniform float spotLightAngleCos[ 1 ];
uniform float spotLightExponent[ 1 ];
uniform float spotLightDistance[ 1 ];
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;

uniform sampler2D mapProj;  // for projective texturing
varying vec4 texCoordProj; // for projective texturing

void main() {
	gl_FragColor = vec4( vec3 ( 1.0 ), opacity );

	vec4 texelColor = texture2D( map, vUv );

	gl_FragColor = gl_FragColor * texelColor;
	
	vec4 texColorProj = texCoordProj.q < 0.0 ? vec4(0.0, 0.0, 0.0, 0.0) : texture2DProj( mapProj, texCoordProj); // for projective texturing
	float projectorAttenuation = texColorProj.a; // for projective texturing

	float specularStrength = 1.0;

	vec3 normal = normalize( vNormal );
	vec3 viewPosition = normalize( vViewPosition );
	vec3 spotDiffuse  = vec3( 0.0 );
	vec3 spotSpecular = vec3( 0.0 );
	for ( int i = 0; i < 1; i ++ ) {
		vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );
		vec3 lVector = lPosition.xyz + vViewPosition.xyz;
		float lDistance = 1.0;
		if ( spotLightDistance[ i ] > 0.0 )
			lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );
		lVector = normalize( lVector );
		float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - vWorldPosition ) );
		if ( spotEffect > spotLightAngleCos[ i ] ) {
			spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );
			float dotProduct = dot( normal, lVector );
			float spotDiffuseWeight = max( dotProduct, 0.0 );
			spotDiffuse += diffuse * spotLightColor[ i ] * spotDiffuseWeight * lDistance * spotEffect * projectorAttenuation; // corrected by the projector attenuation
			vec3 spotHalfVector = normalize( lVector + viewPosition );
			float spotDotNormalHalf = max( dot( normal, spotHalfVector ), 0.0 );
			float spotSpecularWeight = specularStrength * max( pow( spotDotNormalHalf, shininess ), 0.0 );
			spotSpecular += specular * spotLightColor[ i ] * spotSpecularWeight * spotDiffuseWeight * lDistance * spotEffect * projectorAttenuation; // corrected by the projector attenuation
		}
	}
	vec3 totalDiffuse = vec3( 0.0 );
	vec3 totalSpecular = vec3( 0.0 );
	totalDiffuse += spotDiffuse;
	totalSpecular += spotSpecular;
	gl_FragColor.xyz = gl_FragColor.xyz * ( emissive + totalDiffuse + ambientLightColor * ambient ) + totalSpecular;
}
