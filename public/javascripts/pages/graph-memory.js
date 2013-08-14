/*jshint unused:false*/
/*global d3*/
// unit of d is KB
function memorySizeFormat(d) {
	var kilobyte = 1024;
	var megabyte = kilobyte * 1024;
	var gigabyte = megabyte * 1024;
	var terabyte = gigabyte * 1024;
	var precision = 2;

	var bytes = d * 1024;

	function toFixed(nbr) {
		var operator = Math.pow(10,precision);
		return Math.floor(nbr * operator) / operator;
	}

	if ((bytes >= 0) && (bytes < kilobyte)) {
		return bytes + 'B';
	} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
		return toFixed(bytes / kilobyte) + 'K';
	} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
		return toFixed(bytes / megabyte) + 'M';
	} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		return toFixed(bytes / gigabyte) + 'G';
	} else if (bytes >= terabyte) {
		return toFixed(bytes / terabyte) + 'T';
	} else {
		return bytes + 'B';
	}

}

function memoryGraph(xdomain, data, interpolation) {

	var width=960; // canvas width
	var height=120; // canvas height

	var marginTop=6;
	var marginBottom=18;
	var marginLeft=60;

	var canvasWidth=width + marginLeft;
	var canvasHeight=height + marginTop + marginBottom;

	var minimumDataMax = 100 * 1024;

	// method: define how to map(distribute) data in x coordinate
	var x = d3.time.scale()
			.domain(xdomain)
			.range([0, width]);

	var dataMax=d3.max(data, function (d) {
			return d.data;
		});

	// minimum dataMax sets to 100MB
	if (dataMax < minimumDataMax) {
		dataMax = minimumDataMax;
	}

	//var yDomainMax = Math.ceil(dataMax / 1000) * 1000 + 1024 * 20;

	// method: define how to map(distribute) data in y coordinate
	var y = d3.scale.linear()
			.domain([0, dataMax])
			.range([height, 0]);

	// method: define how to generate area
	var area = d3.svg.area()
			.interpolate(interpolation) // set interpolation method
			.x(function (d){
				return x(d.timestamp);
			}) // set x generator
			.y0(height)
			.y1(function (d){
				return y(d.data);
			}); // set y generator

	// method: generate path
	var svg = d3.select('#memory').append('svg')
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)
		.append('g')
		.attr('transform', 'translate(' + marginLeft + ','+ marginTop +')'); // make axis visible from canvas

	svg.append('defs').append('clipPath')
		.attr('id','clip')
		.append('rect')
		.attr('width',width)
		.attr('height',height)
		.attr('x','1');

	// y axis
	var yAxis=svg.append('g')
		.attr('class', 'y axis')
		.call(y.axis=d3.svg.axis().scale(y).tickValues([0, dataMax]).tickFormat(memorySizeFormat).orient('left'));

	// x axis
	var xAxis = svg.append('g')
		.attr('class', 'x axis')
		.attr('transform','translate(0, ' + height + ')')
		.call(x.axis=d3.svg.axis().scale(x).ticks(d3.time.seconds,10).tickFormat(d3.time.format(':%S')).orient('bottom'));

	var path = svg.append('g')
		.attr('clip-path','url(#clip)')
		.append('path')
			.data([data])
			.attr('class','area')
			.attr('d', area);

	return {
		path: path,
		area: area,
		data: data,
		x: x,
		y: y,
		tickFormater:memorySizeFormat,
		xAxis: xAxis,
		yAxis: yAxis
	};
}
