// Creates groups the data into InAir and OnGround collections
var fetchUrl = 'https://flightaware.com/ajax/trackpoll.rvt?token=88dd7c1a0d41355d976ff0058b24601b6dd7489867c9cb0a--ea2472772572b854fc56c7b1dcd7c03d6da8702d&locale=en_US&summary=0';

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
				// TODO: Ignore prime-meridian cosses since most software handles this fairly well
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
	document.body.insertBefore(dElem, document.body.firstChild)
	console.log(geoJson);
});
