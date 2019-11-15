var elevPicker = new L.tileLayer.colorPicker();
var map;
var fedstates;
var elevationGraph;
var editsLayer;


//Loads json from url or local path and returns it
function load_json(source) {
	let json_result;
	json_result = fetch(source).then(function(data){
	 	return data.json();
	}).then(function (result) {
		 return result
	 });
	return json_result
}

//Returns elevation from MapBox elevation service for given latlon
function get_elevation(latlon) {
	//console.log(location)
	var color = elevPicker.getColor(latlon)
	let R = color[0];
	let G = color[1];
	let B = color[2];

	let height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
	let heightRounded = Math.round( height * 10) / 10
	return heightRounded;
	
}

//to be continued...
function mapOnClikHandler(e) {
	console.log(get_elevation(e.latlng))
}

//Activates drawing capability
function activate_drawing(){
	map.pm.addControls({
		position: 'topleft',
		drawCircle: false,
		drawMarker: false,
		drawPolygon: false,
		editPolygon: false,
		drawPolyline: true,
		deleteLayer: true,
		dragMode: false,
		cutPolygon: false,
		drawRectangle: false,
		drawCircleMarker: false
	});
}

//activates elevation graph
function createElevationGraph() {
	elevationGraph = L.control.heightgraph({
		width: 800,
		height: 280,
		margins: {
			top: 10,
			right: 30,
			bottom: 55,
			left: 50
		},
		position: "bottomright",
		mappings: undefined
	});

	//elevationGraph.addTo(map);
	//console.log(elevationGraph)
}

//triggers on feature creation end, converts created feature to appropriate geoJSON format
//and loads it to elevation graph
function createEventHandler(e) {
	//console.log(e.layer.getLatLngs());
	var jsonLayer = e.layer.toGeoJSON();
	//iterate through layer latlongs, pass it to get_elevation function
	//and add returned elevation to respective geojson coordinates

	console.log(e.layer.getLatLngs());
	smoothLine(e.layer.getLatLngs());

	e.layer.getLatLngs().forEach(f=>{
		//console.log(f);
		jsonLayer.geometry.coordinates[e.layer.getLatLngs().indexOf(f)].push(get_elevation(f))
	});
	//console.log(jsonLayer);

	var featureCollection = [{
		type: "FeatureCollection",
		features:[{
			type: "Feature",
			geometry: jsonLayer.geometry,
			properties: jsonLayer.properties
		}],
		properties: {
			summary: "Steepness"
		}
	}];

	editsLayer.addData(featureCollection);
	console.log(featureCollection);
	elevationGraph.addData(featureCollection);

}

//Adds additional vertices for elevation profiles
function smoothLine(geometry){

	point1 = LatLon(geometry[0].lat,geometry[0].lng);
	point2 = LatLon(geometry[1].lat,geometry[1].lng);

	point3 = point1.intermediatePointTo(point2,0.1)
	console.log(point3)


}

//Main function, on document load
function on_load() {
	map = L.map('map', {
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

	editsLayer = new L.geoJSON();
	editsLayer.addTo(map);

	//adding a GeoJSON polygon feature set


	let fedstates_promise = load_json('data/Federalstates.geojson')
	fedstates_promise.then(res => {
		fedstates = L.geoJSON(res);
		fedstates.addTo(map);
	});

	//create vector group
	var features = {
	"Custom tracks":editsLayer,
	//"Salzburg": fedstates
	}

	//add layercontrol
	L.control.layers(baseMaps,features).addTo(map);

	//add drawing toolbar
	activate_drawing();

	//add elevation toolbar
	createElevationGraph();

	//add event listeners
	//map.on('click',on_clik)

	//drawstart and vertex added events
	map.on('pm:drawstart', ({workingLayer}) => {
		workingLayer.on('pm:vertexadded',e=>{

		})
	});

	//on feature create event
	map.on('pm:create',createEventHandler)

};



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
//const myStyle = {
// 		"color": "#ff7800",
// 		"weight": 5,
// 		"opacity": 0.65
// 	}



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

// console.log(FeatureCollections)
// console.log(track)
// hg.addData(FeatureCollections);







