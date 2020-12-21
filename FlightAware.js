// Creates groups the data into InAir and OnGround collections
var fetchUrl = 'https://flightaware.com/ajax/trackpoll.rvt?token=88dd7c1a0d41355dafa2ce4ff0e607704b11c422c132817794d3877132d3aaa34ae69c9170ff4785--364cc6200dbb7fcf5b4e272df5e944ceaef41605&locale=en_US&summary=1';

fetch(fetchUrl)
.then(result => result.json())
.then(data => data.flights)
.then(data => Object.keys(data).map(d => {
	data[d].flightId = d;
	return data[d];
}))
.then(data => {
	return {
		inAir: data.filter(f => f.landingTimes && f.landingTimes.actual == null),
		onGround: data.filter(f => f.landingTimes && f.landingTimes.actual != null)
	};
})
.then(data => console.log(data))




// Creates a GeoJSON of flights which have landed for importing into ArcGIS
var fetchUrl = 'https://flightaware.com/ajax/trackpoll.rvt?token=88dd7c1a0d41355dafa2ce4ff0e607704b11c422c132817794d3877132d3aaa34ae69c9170ff4785--364cc6200dbb7fcf5b4e272df5e944ceaef41605&locale=en_US&summary=1';
fetch(fetchUrl)
.then(result => result.json())
.then(data => data.flights)
.then(data => Object.keys(data).map(d => {
	data[d].flightId = d;
	return data[d];
}))
.then(data => data.filter(f => f.landingTimes && f.landingTimes.actual != null))
.then(data => {
	return {
		type: 'FeatureCollection',
		features: data.map(d => {
			return {
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: d.track.map(m => m.coord)
				},
				properties: {
					flightId: d.flightId
				}
			}
		})
	}
})
.then(geoJson => {
	let dElem = document.createElement('div');
	let cElem = document.createElement('code');
	document.body.appendChild(dElem);
	document.body.appendChild(cElem);
	cElem.innerText = JSON.stringify(geoJson);

	console.log(geoJson)
});
