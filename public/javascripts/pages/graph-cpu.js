/*jshint unused:false*/
/*global d3*/

function cpuGraph(xdomain, ydomain, data, interpolation) {

	var width=960; // canvas width
	var height=120; // canvas height

	var marginTop=6;
	var marginBottom=18;
	var marginLeft=40;

	var canvasWidth=width + marginLeft;
	var canvasHeight=height + marginTop + marginBottom;

	// method: define how to map(distribute) data in x coordinate
	var x = d3.time.scale()
			.domain(xdomain)
			.range([0, width]);

	// method: define how to map(distribute) data in y coordinate
	var y = d3.scale.linear()
			.domain(ydomain)
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
	var svg = d3.select('#cpu').append('svg')
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
	svg.append('g')
		.attr('class', 'y axis')
		.call(d3.svg.axis().scale(y).ticks(4).orient('left'));
	
	var reference = svg.append('g')
			.attr('class','reference');

	var xReferCount=10;
	var unit = (ydomain[1] - ydomain[0])/xReferCount;

	d3.range(xReferCount).map(function (v){
		var posy = y(ydomain[0] + (v+1) * unit);
		reference.append('line')
			.attr('x1',1)
			.attr('y1',posy)
			.attr('x2',width)
			.attr('y2',posy);
	});

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
		xAxis: xAxis
	};
}

