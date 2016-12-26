var param = {
	//colors: [[207, 192, 255], [192, 211, 255], [192, 226, 255], [184, 255, 184], [231, 255, 184], [255, 243, 184], [255, 231, 184], [255, 216, 216], [255, 184, 184], [255, 184, 224], [231, 188, 255]],
	//colors: [[245, 245, 255], [245, 255, 255], [255, 255, 245], [255, 245, 245], [255, 245, 255], [245, 255, 245]],
	colors : [[250, 250, 250]],
	colorsDesc : {"H":["rgb(245, 245, 255)","rgb(235, 235, 255)"], "F":["rgb(255, 245, 245)","rgb(255, 235, 235)"]}, // Color per gender and then {spouse, direct child}
	strokeColor : "#BBB",
	expandStart : 2,
	oneLineNameStart : 7,
	oneLineNameStartDesc: 5,
	stopDisplayName : 9,
	radius : 55,
	centerSize : 85,
	radiusRadial : 145,
	nameFontSize : 11,
	fnameFontSize : 10,
	additionalInfoFontSize: 6,
	downOutsideDesc : 1, // should we write descendants counter-clockwise  ?
	expandStartDesc : 0,
	spouseRadiusRatio : 0.8,
	angle : 1.2 * Math.PI,
	angleDesc : 0.8 * Math.PI, // if <0 then take the remaining space
	padding : 0.1,
	navigator : 2, //2 for chrome, 1 for Firefox
	factor : 1.05,
	ascDescSpacing : 5, //in pixels,
	descGenerationSpacing : 5, //in pixels
	displayAdditionalInfo : true,
}; 
