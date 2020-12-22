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
var fetchUrl = 'https://flightaware.com/ajax/trackpoll.rvt?token=88dd7c1a0d41355dafa2ce4ff0e607704b11c422c13281775651937b72b4fb06cf96a80adf3baec3--19461d238fdf1821397aa69593ea0dbc0dee55c2&locale=en_US&summary=0';
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
			// We have to do this crazy coordinate thing to handle cross-meridian lines
			//   or a straight line will be drawn across the screen when crossing the
			//   antimeridian... multiline string is perfect for this.
			// newCoords will be an array of arrays for each segment which crosses a
			//   meridian and can handle multiple paths zig-zagging back & forth
			var newCoords = d.track.reduce((t, n, i, e) => {
				// Checks to see if the current longitude's sign differs from the previous longitude's sign
				// TODO: Implement better way of handling AntiMeridian crossings rather than using hard-coded
				//   numbers (ie: 150)
				let crossedMeridian = i > 0 ? !((e[i].coord[0] < 150) == (e[i-1].coord[0] < 150)) : false;
				if(i == 0 || crossedMeridian) { t.push([]); }
				t[t.length-1].push(n.coord);
				return t;
			}, []);

			return {
				type: 'Feature',
				geometry: {
					type: 'MultiLineString',
					coordinates: newCoords
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
	document.querySelectorAll('div[id="esriThingy"]').forEach(d => document.body.removeChild(d));
	let dElem = document.createElement('div');
		dElem.setAttribute('id', 'esriThingy');
	let cElem = document.createElement('code');
		cElem.innerText = JSON.stringify(geoJson);
	let bElem = document.createElement('button');
		bElem.innerText = 'Copy To Clipboard';
		bElem.setAttribute('onClick', "javascript:navigator.clipboard.writeText(document.querySelector('div[id=\"esriThingy\"] code').innerText)");
	dElem.appendChild(bElem);
	dElem.appendChild(cElem);
	document.body.appendChild(dElem);
	console.log(geoJson);
});
