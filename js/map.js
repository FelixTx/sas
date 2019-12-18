var markers = {
	"type": "FeatureCollection",
};

(function($) {

	var data;
	var events = [];

	$.ajax({
		type: "GET",  
		url: "https://felixtx.github.io/sas/events.csv?" + Math.random(),
		dataType: "text",       
		success: function(response)  
		{
			data = CSV2JSON(response);

			data.forEach( m => {
				events.push({
					"type": "Feature",
					"geometry" : {"type" : "Point", "coordinates":[parseFloat(m.long), parseFloat(m.lat)]},
					"properties": m
				});
				delete(m.lat);
				delete(m.long);
			});

			markers.features = events;

			generateHtmlTable(data);
			loadmap(markers);
		}
	});



	function CSV2JSON(csv) {
		var lines = csv.split("\n");
		var titles = lines[0].split(";");
		var data = new Array(lines.length - 1);

		for (var i = 1; i < lines.length; i++) {
			data[i - 1] = {};
			lines[i] = lines[i].split(";");
			for (var j = 0; j < titles.length; j++) {
				data[i - 1][titles[j]] = lines[i][j];
			}
		}

		return data
	}

	$(document).ready(function(){
		$(".event-list-filter").change( function() {
			$('tr').show();
			var city = $("#city-filter").val().toLowerCase();
			var type = $("#type-filter").val().toLowerCase();
			$("#event-list tr").filter(function() {
				$(this).toggle($(this).text().toLowerCase().indexOf(city) > -1
					&& $(this).text().toLowerCase().indexOf(type) > -1)
			});
		});
	});

})(jQuery);


function generateHtmlTable(data) {
	var html_list = '';
	var cities = new Set([]);
	var types = new Set([]);
	if(typeof(data[0]) === 'undefined') {
		return null;
	} else {
		$.each(data, function( index, row ) {
			if (row.title == "") {
				return; // skip empty row
			}

		  	html_list += `<tr>
		  	<td class="description"><div>
		  	<h3>${row.title}</h3>
		  	<p>${row.description}</p>
		  	</div></td>
		  	<td class="type">${row.type}</td>
		  	<td class="city">${row.city}</td>
		  	<td class="date">${row.date}</td>
		  	</tr>'`;

	  		cities.add(row.city);
	  		types.add(row.type);
		});
		$('#event-list').find('tbody').append(html_list);
	}
	types.forEach(t => {		
		$('#type-filter').append(`<option value="${t}">${t}</option>`);
	});
	cities.forEach(c => {
		$('#city-filter').append(`<option value="${c}">${c}</option>`);
	});
}	




mapboxgl.accessToken = "pk.eyJ1IjoiZmVsaXh0IiwiYSI6ImNrM29reGh6dTBtYWYzcHFlYTI2dzRxbXUifQ.dprOgOf1zOZFS9-4HYNxcA";

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [2.340015,48.855838],
	maxZoom: 15,
	zoom: 12
});

map.addControl(
	new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		language: 'fr-FR',
		marker: false,
		placeholder: '     Où habitez-vous ?',
		mapboxgl: mapboxgl,
	}),
	'top-left'
	);

map.addControl(new mapboxgl.GeolocateControl({
	positionOptions: {
		enableHighAccuracy: true
	},
	trackUserLocation: true
}),
'bottom-left'
);

map.addControl(new mapboxgl.FullscreenControl());

function loadmap(markers) {

	map.on("load", function () {

		var category = "Atelier";

		/* Image: An image is loaded and added to the map. */
		map.loadImage("https://felixtx.github.io/sas/images/marker-Atelier.png", function(error, image) {
			if (error) throw error;
			map.addImage("Atelier", image);
		});

		map.loadImage("https://felixtx.github.io/sas/images/marker-Autre.png", function(error, image) {
			if (error) throw error;
			map.addImage("Autre", image);
		});

		map.loadImage("https://felixtx.github.io/sas/images/marker-Débat.png", function(error, image) {
			if (error) throw error;
			map.addImage("Débat", image);
		});

		map.loadImage("https://felixtx.github.io/sas/images/marker-Exposition.png", function(error, image) {
			if (error) throw error;
			map.addImage("Exposition", image);
		});
		
		map.loadImage("https://felixtx.github.io/sas/images/marker-Projection.png", function(error, image) {
			if (error) throw error;
			map.addImage("Projection", image);
		});		
		
		map.loadImage("https://felixtx.github.io/sas/images/marker-Rencontre.png", function(error, image) {
			if (error) throw error;
			map.addImage("Rencontre", image);
		});	

		map.loadImage("https://felixtx.github.io/sas/images/marker-Repas.png", function(error, image) {
			if (error) throw error;
			map.addImage("Repas", image);

			/* Style layer: A style layer ties together the source and image and specifies how they are displayed on the map. */
			map.addLayer({
				id: "events",
				type: "symbol",
				/* Source: A data source specifies the geographic coordinate where the image marker gets placed. */
				source: {
					type: "geojson",
					data: markers
				},
				layout: {
					"icon-image": "{type}",
					"icon-allow-overlap": true
				},
				"filter": ["==", "type", category]
			});
		});	

		// When a click event occurs on a feature in the places layer, open a popup at the
	// location of the feature, with description HTML from its properties.
	map.on('click', 'events', function (e) {
		var coordinates = e.features[0].geometry.coordinates.slice();
		var evt_description = e.features[0].properties.description;
		var evt_title = e.features[0].properties.title;
		var evt_type = e.features[0].properties.type;
		var evt_place = e.features[0].properties.location_name;
		var evt_date = e.features[0].properties.date;
		var evt_organizer = e.features[0].properties.organizer;


	// Ensure that if the map is zoomed out such that multiple
	// copies of the feature are visible, the popup appears
	// over the copy being pointed to.
	while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
		coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
	}

	popup_content = `
	<h4>${evt_title}</h4>
	<i>le ${evt_date}</i>
	<a>lieu: ${evt_place}</a> 
	<a>${evt_type}</a>
	<p>${evt_description}</p>
	<a>organisé par ${evt_organizer}</a>
	`
	new mapboxgl.Popup()
	.setLngLat(coordinates)
	.setHTML(popup_content)
	.addTo(map);
});

	// Change the cursor to a pointer when the mouse is over the places layer.
	map.on('mouseenter', 'events', function () {
		map.getCanvas().style.cursor = 'pointer';
	});

	// Change it back to a pointer when it leaves.
	map.on('mouseleave', 'events', function () {
		map.getCanvas().style.cursor = '';
	});
})
}