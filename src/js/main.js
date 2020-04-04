var elevPicker = new L.tileLayer.colorPicker();
var map;
var imageryOverlay;
var elevationGraph;
var editsLayer;
var highlightedLineFeature;

//Loads json from url or local path and returns it
function load_json(source,params) {
	let json_result;
	json_result = fetch(source,params).then(function(data){
	 	return data.json();
	}).then(function (result) {
		 return result
	 });
	return json_result
}

//Returns elevation from MapBox elevation service for given latlon
function get_elevation(latlon) {
	//console.log(location)
	var color = elevPicker.getColor(latlon);
	let R = color[0];
	let G = color[1];
	let B = color[2];

	let height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);
	let heightRounded = Math.round( height * 10) / 10;
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
	var colorMappings = {
		steepness: {
			'1': {
				text: 'Light slope',
				color: '#69f264'
			},
			'2': {
				text: 'Medium slope',
				color: '#dee054'
			},
			'3': {
				text: 'Steep',
				color: '#cf5352'
			},
			'4': {
				text: 'Extremely steep',
				color: '#be1612'
			}
		}
	};
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
			expandCallback: function (expanded) {

				this.expand = false
			},
			mappings: colorMappings
		}
	);
	elevationGraph.addTo(map);
	//console.log(elevationGraph)
}


//Adds additional vertices for elevation profiles
function smoothLine(geometry) {
	var smoothedLine = [];
	//iterate through linestring points array
	for (var j = 0; j < geometry.length; j++) {
		//add current point to new line
		smoothedLine.push(geometry[j]);
		//convert current point to geodesy library format
		var point1 = LatLon(geometry[j].lat,geometry[j].lng);
		//if next point exists
		if (geometry[j + 1]) {
			// convert next point to geodesy library format
			var point2 = LatLon(geometry[j+1].lat,geometry[j+1].lng);
			//create 5 intermediate points between this two points
			//and add them to new line
			for (var i = 0.2; i < 1; i=i+0.2) {
				var point3 = point1.intermediatePointTo(point2,i);

				smoothedLine.push(L.latLng(point3.lat,point3.lon))
			}
		}
	}
	return smoothedLine;
}


//Adds additional vertices using turf.js alternative

function smoothLineTurf(geometry) {
	var smoothedLine = [];
	for (var j = 0; j < geometry.length; j++) {
		smoothedLine.push(geometry[j]);
		if (geometry[j + 1]) {
			var segment = turf.lineString([[geometry[j].lng,geometry[j].lat],[geometry[j+1].lng,geometry[j+1].lat]]);
			for (var i = 50; i<=turf.length(segment,{units: 'meters'});i = i+50){
				var smoothPoint = turf.along(segment,i,{units: 'meters'});
				smoothedLine.push(L.latLng(smoothPoint.geometry.coordinates[1],smoothPoint.geometry.coordinates[0]))
			}
		}
	}
	return smoothedLine
}

//convert slope value to category
function slopeToCategory(slope){
	if(slope <= 5) {
		return 1
	} else
	if(slope > 5 && slope<=16.5){
		return 2
	} else
	if (slope > 16.5 && slope <= 35){
		return 3
	}else
	if(slope>35){
		return 4
	}
}


//highlight feature
function hilightFeature(layer) {

	switch (layer.feature.geometry.type) {
		case 'LineString':
			if (highlightedLineFeature){
				highlightedLineFeature.setStyle(highlightedLineFeature.defaultOptions.style)
			}
			//console.log(feature);
			highlightedLineFeature = layer;
			//console.log('here')
			highlightedLineFeature.setStyle({
				weight: 5,
				color: '#e5e407',
				fillOpacity: 0.7

			});
			if (!L.Browser.ie && !L.Browser.opera) {
				highlightedLineFeature.bringToFront();
			}
		// case 'Point':
		// 	if (highLightedPoint){
		//
		// 		console.log(highLightedPoint);
		// 		highLightedPoint.setIcon(highLightedPoint.defaultOptions.ic)
		// 	}
		// 	//console.log(feature);
		//
		// 	let defaultIcon = layer.defaultOptions.icon;
		// 	highLightedPoint = layer;
		// 	let icon = highLightedPoint.options.icon;
		// 	icon.options.markerColor = "yellow";
		// 	console.log(icon);
		// 	highLightedPoint.setIcon(icon)


	}


	//highLightLayer.addTo(map)
}


//converts standart geojson object to appropriate form for elevation plugin form
function prepareGeoJSONForElev(jsonlayer){

	//Cut geojson line to segments
	featureCollection = turf.lineSegment(jsonlayer);

	turf.featureEach(featureCollection,(current,index) => {

	var coords = turf.coordAll(current);
	//calculate slope angle in segment
	var angle = turf.radiansToDegrees(Math.atan((coords[1][2]-coords[0][2])/turf.length(current,{units:'meters'})));
	//add it as a property to segment
	current.properties = {attributeType: slopeToCategory(Math.abs(angle))};
	});

	//define property name for styling
	featureCollection['properties'] = {
		summary:"steepness"
	};

	return [featureCollection];
}


//create icon style for OSM layers
function getStyle(osmType,iconColor){
	var Marker;
	switch (osmType) {
		case 'viewpoint':
			Marker = L.ExtraMarkers.icon({
				icon: 'fa-camera',
				markerColor: 'orange-dark',
				shape: 'square',
				prefix: 'fas',
				iconColor:iconColor
			});
			return Marker;
		case 'alpine_hut':
			Marker = L.ExtraMarkers.icon({
				icon: 'fa-home',
				markerColor: 'orange-dark',
				shape: 'square',
				prefix: 'fas',
				iconColor:iconColor
			});
			return Marker;
		case 'picnic_site':
			Marker = L.ExtraMarkers.icon({
				icon: 'fa-tree',
				markerColor: 'orange-dark',
				shape: 'square',
				prefix: 'fas',
				iconColor:iconColor
			});
			return Marker;
		case 'parking':
			Marker = L.ExtraMarkers.icon({
				icon: 'fa-parking',
				markerColor: 'blue-dark',
				shape: 'square',
				prefix: 'fas',
				iconColor:iconColor
			});
			return Marker;
		case 'bus_stop':
			Marker = L.ExtraMarkers.icon({
				icon: 'fa-bus-alt',
				markerColor: 'blue-dark',
				shape: 'square',
				prefix: 'fas',
				iconColor:iconColor
			});
			return Marker;
	}

}

//Compiles overpass api request from array of desired OSM tag with array of values
function compileOverpassRequest(overpassQuery){

	var bounds = (map.getBounds().getSouth() - 0.05) + ',' + (map.getBounds().getWest() - 0.05) + ','
		+ (map.getBounds().getNorth() + 0.05) + ',' + (map.getBounds().getEast() +0.05);

	var elemQuery;
	var key = Object.keys(overpassQuery)[0];
	overpassQuery[key].forEach(e=>{
		!elemQuery ? elemQuery = 'nwr[' + key + '=' + e + '](' + bounds + ');' : elemQuery += 'nwr[' + key + '=' + e  + '](' + bounds + ');';
	});
	var query = '?data=[out:json];(' + elemQuery + '); out body geom;';
	var baseUrl = 'http://overpass-api.de/api/interpreter';
	var resultUrl = baseUrl + query;
	return resultUrl
}


//adds OSM features from overpass as geojson
async function addOverpass(overpassQuery) {
	var key = Object.keys(overpassQuery)[0]
	var	osmData = await load_json(compileOverpassRequest(overpassQuery));
	var resultAsGeojson = osmtogeojson(osmData);
	console.log(resultAsGeojson)
	//console.log(resultAsGeojson);
	var resultLayer = L.geoJson(resultAsGeojson, {
		style:feature=> {
			return {color: "#ff0000"};
			},
		filter: (feature, layer)=> {
			var isPolygon = (feature.geometry) && (feature.geometry.type !== undefined) && (feature.geometry.type === "Polygon");
			if (isPolygon) {
				feature.geometry.type = "Point";
				var polygonCenter = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
				feature.geometry.coordinates = [ polygonCenter.lat, polygonCenter.lng ];
			}
			if (feature.properties[key]=='viewpoint'&&!feature.properties.name){
				return false;
			}
			return true;
			},
		pointToLayer: (feature, latlng)=>  {
			return L.marker(latlng, {icon:getStyle(feature.properties[key],'white'),riseOnHover:true});
			},
		onEachFeature: (feature, layer)=>  {
			// layer.on('mouseover',e=>{
			// 	hilightFeature(e.target);
			// });
			createOsmPopup(feature,key).then(e=> {
				//console.log(e);
				layer.bindPopup(e,{className:'custom-popup'});
			})
        	}
        });
	return resultLayer;
    }

//Creates popup content for osm feature
async function createOsmPopup(feature,keyTag) {
	var popupContent = "";
	popupContent = popupContent + "<div class=container><dl class=row><dt class = col-3>Type:</dt><dd class = col-9>"
		+ feature.properties[keyTag] + "</dd>";

	//var keys = Object.keys(feature.properties);
		if(feature.properties['wikipedia']) {
			popupContent = popupContent + "<dt class = col-3>Wiki:</dt><dd class = col-9><a target=_blank href=https://de.wikipedia.org/wiki/"
				+ feature.properties['wikipedia'] + "\>" + 'Wikipedia' + "</a></dd>";
		}
		if(feature.properties['website']) {
		popupContent = popupContent + "<dt class = col-3>Website: </dt><dd class = col-9><a target=_blank href="
			+ feature.properties['website'] + "\>" + 'Website' + "</a></dd>";
		}
		if(feature.properties['name']){
			popupContent = popupContent + "</dl></div>";
			var img = await getFlickrPhoto(feature.properties['name']).then(
				e=>{
					return e
				});
			if(img) {
				popupContent = popupContent + "<img height=200 width=200 src=" + img + ">";
			}

			return popupContent;

		}if(!feature.properties['name']){
			//console.log('here')
		 popupContent = popupContent + "</dl></div>";
		 return popupContent
	 }
}

//Get photos by place name from flickr
async function getFlickrPhoto(string) {
	var promise = $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
		{
			tags: string,
			tagmode: "any",
			format: "json"
		}).then(data=>{
		if (data.items.length>0) {
			var rnd = Math.floor(Math.random() * data.items.length);
			return data.items[rnd]['media']['m'].replace("_m", "_b");
		}
		});
	//console.log(image)
			return await promise
}

//Handler for export geojson layer
function onExportCLick(layer) {
	var file = 'customTracks' + '.geojson';
	saveAs(new File([JSON.stringify(layer.toGeoJSON())], file, {
		type: "text/plain;charset=utf-8"
	}), file);

}

//Higlightes clicked line feature and adds it to elevation graph
function lineFeatureOnClickHandler(e) {
	//console.log(e)
	if (!map.pm.globalRemovalEnabled()) {
		hilightFeature(e.target);

		var elevGeojson = prepareGeoJSONForElev(e.target.toGeoJSON())
		elevationGraph.addData(elevGeojson)
		//console.log(elevGeojson)
	}
}



//triggers on feature creation end, converts created feature to appropriate geoJSON format
//and loads it to elevation graph
function createEventHandler(e) {

	//Get array of line points, pass it to function, get back new array
	//with additional points along
	e.layer.setLatLngs(smoothLineTurf(e.layer.getLatLngs()));
	var rawGeojson = e.layer.toGeoJSON();

	//iterate through layer latlongs, pass it to get_elevation function
	//and add returned elevation to respective geojson coordinates
	e.layer.getLatLngs().forEach(f=>{
		rawGeojson.geometry.coordinates[e.layer.getLatLngs().indexOf(f)].push(get_elevation(f))
	});

	//Convert modified geojson with additional points and elevation to appropriate for
	//elevation graph format
	var elevGeojson = prepareGeoJSONForElev(rawGeojson);

	editsLayer.addData(rawGeojson);
	editsLayer.eachLayer(l =>{
		l.on('click',lineFeatureOnClickHandler)
	});

	map.removeLayer(e.layer);
	elevationGraph.addData(elevGeojson);
}

//event handler to remove feature from geojson layer permanently

function removeHandler(e){
	editsLayer.removeLayer(e.layer)
}

//Main function, on document load
function on_load() {
	map = L.map('map', {
		center: [47.58, 13.65],
		zoom: 13,
		minZoom: 12
	});

	//define basemaps
	const landscape = L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=b90b8bc10e3147d8ae791be159d56aff',
		{attribution: 'Tiles from Thunderforest',});


	var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {

	});
	imageryOverlay = Esri_WorldImagery

	elevPicker = L.tileLayer.colorPicker('https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?' +
		'access_token=pk.eyJ1IjoibGlxdWlkc3VuODYiLCJhIjoiY2syeDkwb2RzMDlnbTNncGQ3amU1aGR2OSJ9.YU3MLFHx8BoYbrF0Xl9Lag',
		{attribution: 'Tiles from mapbox',
			id: 'mapbox.outdoors'}).addTo(map)

	landscape.addTo(map);
	Esri_WorldImagery.addTo(map);

	//Add map controls
	const scale_control = new L.control.scale({imperial:false, metric:true, position:'bottomleft', maxWidth:100})
	scale_control.addTo(map)

	var layerControl = new L.control.layers().addTo(map);

	//add cluster layer

	var markers = L.markerClusterGroup({
		showCoverageOnHover: false,
		zoomToBoundsOnClick: false,
		maxClusterRadius:50
	});

	//add vector layers

	editsLayer = new L.geoJSON(null,{
		style: {
			color: "#4e61ff",
			weight: 3,
			opacity: 1
	}
	});
	editsLayer.addTo(map);
	layerControl.addOverlay(editsLayer,'CustomTracks');

	//add osm overpass layers
	var osmTourism =  addOverpass({tourism:['alpine_hut','picnic_site','viewpoint']});

	var osmAmenities =  addOverpass({amenity:['parking']});

	var osmBusStops =  addOverpass({highway:['bus_stop']});

	osmTourism.then(l=>{
		map.addLayer(l);
		layerControl.addOverlay(l,'Tourism');
	});
	osmAmenities.then(l=>{
		markers.addLayer(l);
		map.addLayer(markers)
		layerControl.addOverlay(markers,'Parkings');
	});
	osmBusStops.then(l=>{
		map.addLayer(l);
		layerControl.addOverlay(l,'BusStops');
	});

	//add drawing toolbar
	activate_drawing();

	//add elevation toolbar
	createElevationGraph();

	//add swipe control

	L.control.sideBySide(Esri_WorldImagery, landscape).addTo(map);

	//add export button

	L.easyButton('fa-folder',function () {
		if(editsLayer.getLayers().length>0) {
			onExportCLick(editsLayer);
		}
		else{
			alert('Nothing to export')
		}
	}).addTo(map);

	//add event listeners


	//drawstart and vertex added events
	map.on('pm:drawstart', ({workingLayer}) => {
		workingLayer.on('pm:vertexadded',e=>{
		//console.log('here')
		})
	});

	//on feature create event
	map.on('pm:create',createEventHandler);

	//on feature remove event

	map.on('pm:remove',removeHandler);

	//events for custom marker size manipulation
	map.on('zoomend', ()=>{
		var ExtraMarkers = document.getElementsByClassName("extra-marker");
		for(l=0; l< ExtraMarkers.length; l++){
			oldS = ExtraMarkers[l].style.transform;
			newS = oldS + " scale(0.8) translateY(20%) translateX(20%)";
			ExtraMarkers[l].style.transform = newS

		}
	});
	map.on("layeradd",(layer)=>{
		if(layer.layer._icon &&
			layer.layer._icon.classList.contains("extra-marker")){
			oldS = layer.layer._icon.style.transform;
			newS = oldS + " scale(0.8) translateY(20%) translateX(20%)" ;
			layer.layer._icon.style.transform = newS
		}
	});
}

document.addEventListener("DOMContentLoaded", on_load);








