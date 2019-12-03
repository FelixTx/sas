
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

map.on("load", function () {
	/* Image: An image is loaded and added to the map. */
	map.loadImage("https://i.imgur.com/MK4NUzI.png", function(error, image) {
		if (error) throw error;
		map.addImage("custom-marker", image);
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
				"icon-image": "custom-marker",
				"icon-allow-overlap": true
			}
		});
	});

		// When a click event occurs on a feature in the places layer, open a popup at the
	// location of the feature, with description HTML from its properties.
	map.on('click', 'events', function (e) {
		var coordinates = e.features[0].geometry.coordinates.slice();
		var evt_description = e.features[0].properties.description;
		var evt_title = e.features[0].properties.title;
		var evt_date = e.features[0].properties.date;


	// Ensure that if the map is zoomed out such that multiple
	// copies of the feature are visible, the popup appears
	// over the copy being pointed to.
	while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
		coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
	}

	popup_content = "<h4>" + evt_title + "</h4>" + evt_description + "<p><i>" + evt_date + "</i></p>"

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
});
