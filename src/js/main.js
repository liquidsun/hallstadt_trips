// Using Leaflet for creating the map and adding controls for interacting with the map

//
//--- Part 1: adding base maps ---
//

//creating the map; defining the location in the center of the map (geographic coords) and the zoom level. These are properties of the leaflet map object
//the map window has been given the id 'map' in the .html file
var map = L.map('map', {
	center: [47.5, 13.05],
	zoom: 8
});

// alternatively the setView method could be used for placing the map in the window
//var map = L.map('map').setView([47.5, 13.05], 8);


//adding two base maps 
var landscape = L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', {
	attribution: 'Tiles from Thunderforest'}).addTo(map);

var toner = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>' });
	toner.addTo(map);

// for using the two base maps in the layer control, I defined a baseMaps variable
var baseMaps = {
	"Thunderforest landscape": landscape,
	"Toner": toner
}

//
//---- Part 2: Adding a scale bar
//



//
//---- Part 3: Adding symbols ---- 
//

//Marker Version 1
L.marker([47, 14], {title:'markerrrrrr', clickable:true}).addTo(map).bindPopup("newpopup");
	
//Marker Version 2
var mark = L.marker([47, 12], {title:'markerrrrrr', clickable:true}).addTo(map);
mark.bindPopup("this is my popup");

//Marker Version 3	
var myIcon = L.icon({
iconUrl: 'css/images/house.gif',
iconSize: [38, 38]
});

L.marker([48, 13], {icon: myIcon, title:'theHouse'}).addTo(map);

//adding a GeoJSON polygon feature set
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
}

//
//---- Part 4: adding features from the geojson file 
//

//the variable federalstateSBG is created in the Federalstates.js file
var fedstate= L.geoJson(federalstateSBG, {
    style: myStyle,
    onEachFeature: function (feature, layer) {
        layer.bindPopup('Feature name: ' + feature.properties.NAME + '<br>' + 'Feature area: ' +feature.properties.area);
    }
});

fedstate.addTo(map);

//
//---- Part 5: Adding a layer control for base maps and feature layers
//

//the variable features lists layers that I want to control with the layer control
var features = {
	"Marker 2": mark,
	"Salzburg": fedstate
}

//the legend uses the layer control with entries for the base maps and two of the layers we added
//in case either base maps or features are not used in the layer control, the respective element in the properties is null








