var markers = {
	"type": "FeatureCollection",
};

(function($) {

	var data;
	var events = [];

	$.ajax({
		type: "GET",  
		//url: "http://sortonslagriculturedusalon.fr/events.tsv?" + Math.random(),
		url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQm5xowwY1yJ2p5Ejuk9bfKXHs3OnGwK9WD7P7CO7Zw3YYznDfWuTFw-BTlVzgq0awtN3_jNV_Vl60/pub?gid=0&single=true&output=tsv",
		dataType: "text",    
		success: function(response)  
		{
			data = CSV2JSON(response);

			data.forEach( m => {
				if (m.validated) {
					events.push({
						"type": "Feature",
						"geometry" : {"type" : "Point", "coordinates":[parseFloat(m.long), parseFloat(m.lat)]},
						"properties": m
					});
				}
				delete(m.lat);
				delete(m.long);
			});
			console.log(markers);
			markers.features = events;
			generateHtmlTable(data);
			loadmap(markers);
		}
	});



	function CSV2JSON(csv) {
		var lines = csv.split("\r");
		var titles = lines[0].split('\t');
		var data = new Array(lines.length - 1);

		for (var i = 1; i < lines.length; i++) {
			data[i - 1] = {};
			lines[i] = lines[i].split('\t');
			for (var j = 0; j < titles.length; j++) {
				if (lines[i][j]) {
				data[i - 1][titles[j]] = lines[i][j].trim();					
				}
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
			if (row.title == undefined) {
				return;
			}
			if (row.end_date) {date_string = row.start_date + " > " + row.end_date} else { date_string = row.start_date };
			if (row.end_time) {time_string = row.start_time + " - " + row.end_time} else { time_string = row.start_time };

		  	html_list += `<tr>
		  	<td class="description"><div>
		  	<h3><a href="${row.facebook}" title="événement Facebook">${row.title}</a></h3>
		  	<h4>${row.location_name} <a class="list-s">${row.city}, ${row.postcode}</a></h4>
		  	<a class="list-s">type: ${row.type}</a>
		  	<a class="list-s">${date_string} <br> ${time_string}</a>
		  	<p>${row.description}</p>
		  	</div></td>
		  	<td class="type"><a class="list-l">${row.type}</a></td>
		  	<td class="city"><a class="list-l">${row.city}, ${row.postcode}</a></td>
		  	<td class="date"><a class="list-l">${date_string} ${time_string}</a></td>
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
	center: [2.568093, 47.181719],
	maxZoom: 15,
	minZoom: 5,
	zoom: 6
});

map.addControl(
	new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		countries: 'fr',
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

// map.on("load", function () {
// 	loadmap(markers);
// })

function loadmap(markers) {

	const images =[
	{url: 'http://sortonslagriculturedusalon.fr/images/marker-Atelier.png', id: 'Atelier'},
	{url: 'http://sortonslagriculturedusalon.fr/images/marker-Autre.png', id: 'Autre'},
	{url: 'http://sortonslagriculturedusalon.fr/images/marker-Conférence.png', id: 'Conférence'},
	{url: 'http://sortonslagriculturedusalon.fr/images/marker-Exposition.png', id: 'Exposition'},
	{url: 'http://sortonslagriculturedusalon.fr/images/marker-Projection.png', id: 'Projection'},
	{url: 'http://sortonslagriculturedusalon.fr/images/marker-Rencontre.png', id: 'Rencontre'},
	{url: 'http://sortonslagriculturedusalon.fr/images/marker-Repas.png', id: 'Repas'}
	]
	var filterGroup = document.getElementById('filter-group');

	Promise.all(
		images.map(img => new Promise((resolve, reject) => {
			map.loadImage(img.url, function (error, res) {
				map.addImage(img.id, res);
				resolve();
			})
		}))
		)
	.then(
		map.on("load", function () {
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
					"icon-allow-overlap": true,
					"icon-size": .7
				},
			//	"filter": ["==", "type", category]
		})

			// map.setFilter('events', ["in", "type", "Repas","Atelier"]);
		})
		);

		// When a click event occurs on a feature in the places layer, open a popup at the
	// location of the feature, with description HTML from its properties.
	map.on('click', 'events', function (e) {
		var coordinates = e.features[0].geometry.coordinates.slice();
		var description = e.features[0].properties.description;
		var title = e.features[0].properties.title;
		var type = e.features[0].properties.type;
		var place = e.features[0].properties.location_name;
		var address = e.features[0].properties.address;
		var start_date = e.features[0].properties.start_date;
		var end_date = e.features[0].properties.end_date;
		var start_time = e.features[0].properties.start_time;
		var end_time = e.features[0].properties.end_time;
		var organizer = e.features[0].properties.organizer;
		var facebook = e.features[0].properties.facebook;

	// Ensure that if the map is zoomed out such that multiple
	// copies of the feature are visible, the popup appears
	// over the copy being pointed to.
	while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
		coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
	}
	if (end_date) {date_string = start_date + " - " + end_date} else { date_string = start_date };
	if (end_time) {time_string = start_time + " - " + end_time} else { time_string = start_time };
	popup_content = `
	<h4><a href="${facebook}" title="événement Facebook">${title}</a></h4>
	<br><a><b>${type}</b></a>
	<br><i>${date_string} // ${time_string}</i>
	<br><a><img src="http://sortonslagriculturedusalon.fr/images/marker-${type}.png" height="15px;">${place}</a>
	<br><a>organisé par <i>${organizer}</i></a>
	<p><br>${description}</p>
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
}

map.once('styleimagemissing', function(e) {
	map.removeLayer("events");
	loadmap(markers);
});
