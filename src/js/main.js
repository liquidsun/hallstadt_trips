var elevPicker = new L.tileLayer.colorPicker();

function load_json(source) {
	let json_result;
	json_result = fetch(source).then(function(data){
	 	return data.json();
	}).then(function (result) {
		 return result
	 });
	return json_result
}

function get_elevation(location) {
	var color = elevPicker.getColor(location)
	let R = color[0];
	let G = color[1];
	let B = color[2];

	let height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
	let heightRounded = Math.round( height * 10) / 10 + ' meters';
	return heightRounded;
	
}

function on_clik(e) {

	console.log(get_elevation(e.latlng))
}


function on_load() {
	const map = L.map('map', {
		center: [47.58, 13.65],
		zoom: 13,
		minZoom: 12,
		maxZoom: 16
	});

	//define basemaps
	const landscape = L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', {
		attribution: 'Tiles from Thunderforest',});

	const toner = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png',
		{attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
				'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ' +
				'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under ' +
				'<a href="http://www.openstreetmap.org/copyright">ODbL</a>' });

	elevPicker = L.tileLayer.colorPicker('https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?' +
		'access_token=pk.eyJ1IjoibGlxdWlkc3VuODYiLCJhIjoiY2syeDkwb2RzMDlnbTNncGQ3amU1aGR2OSJ9.YU3MLFHx8BoYbrF0Xl9Lag',
		{attribution: 'Tiles from mapbox',
			id: 'mapbox.outdoors',
			accessToken: 'your mapbox accesstoken'}).addTo(map)

	// for using the two base maps in the layer control, defined a baseMaps variable
	const baseMaps = {
		"Thunderforest landscape": landscape,
		"Toner": toner
	}

	toner.addTo(map);
	landscape.addTo(map);

	//Add map controls
	const scale_control = new L.control.scale({imperial:false, metric:true, position:'bottomleft', maxWidth:100})
	scale_control.addTo(map)




	//add vector layers

	//adding a GeoJSON polygon feature set
	const myStyle = {
		"color": "#ff7800",
		"weight": 5,
		"opacity": 0.65
	}
	let fedstates_promise = load_json('data/Federalstates.geojson')
	let fedstates
	fedstates_promise.then(function (res) {
		fedstates = L.geoJSON(res);
		fedstates.addTo(map);
	})

	//add layercontrol
	L.control.layers(baseMaps).addTo(map);

	//add event listeners
	map.on('click',on_clik)
}



document.addEventListener("DOMContentLoaded", on_load);

// //Marker Version 1
// L.marker([47, 14], {title:'markerrrrrr', clickable:true}).addTo(map).bindPopup("newpopup");
//
// //Marker Version 2
// var mark = L.marker([47, 12], {title:'markerrrrrr', clickable:true}).addTo(map);
// mark.bindPopup("this is my popup");
//
// //Marker Version 3
// var myIcon = L.icon({
// iconUrl: 'src/css/images/house.gif',
// iconSize: [38, 38]
// });
//




//
//---- Part 4: adding features from the geojson file 
//



//the variable federalstateSBG is created in the Federalstates.js file


// var track = L.geoJSON(FeatureCollections);
//
//
// fedstate.addTo(map);
// track.addTo(map);
//
// //console.log(hike_tracks.getLayers()[0])
// //
// //---- Part 5: Adding a layer control for base maps and feature layers
// //
//
//
// //the variable features lists layers that I want to control with the layer control
// var features = {
// 	"hike_tracks":track,
// 	"Marker 2": mark,
// 	"Salzburg": fedstate
// }
//
//
// //the legend uses the layer control with entries for the base maps and two of the layers we added
// //in case either base maps or features are not used in the layer control, the respective element in the properties is null
//
// //create graph object
//
// var hg = L.control.heightgraph({
// 	width: 800,
// 	height: 280,
// 	margins: {
// 		top: 10,
// 		right: 30,
// 		bottom: 55,
// 		left: 50
// 	},
// 	position: "bottomright",
// 	mappings: undefined
// });
// hg.addTo(map);
// console.log(FeatureCollections)
// console.log(track)
// hg.addData(FeatureCollections);







