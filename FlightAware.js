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
var fetchUrl = 'https://flightaware.com/ajax/trackpoll.rvt?token=88dd7c1a0d41355dafa2ce4ff0e607704b11c422c13281777c192da6458ee4dac7bac9c3e7d3966a--191f3494adc1b5f35896037658161abc1755299a&locale=en_US&summary=0';
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
					flightId: d.flightId,
					carrier: d.flightId.match(/^([a-zA-Z]*)/)[1],
					takeoff: new Date((d.takeoffTimes.actual || 0) * 1000),
					landed: new Date((d.landingTimes.actual || 0) * 1000)
				}
			}
		})
	}
})
.then(geoJson => {
	document.querySelectorAll('code[id="esriThingy"]').forEach(d => document.body.removeChild(d));
	let dElem = document.createElement('div');
	let bElem = document.createElement('button');
	let cElem = document.createElement('code');
	cElem.setAttribute('id', 'esriThingy');
	document.body.appendChild(dElem);
	dElem.appendChild(bElem);
	dElem.appendChild(cElem);
	cElem.innerText = JSON.stringify(geoJson);
	bElem.onClick = () => { navigator.clipboard.writeText(JSON.stringify(geoJson)); };
	console.log(geoJson);
})
