var csv_data;

// Find the window dimensions
var margins = {top: 10, right: 80, bottom: 60, left: 60};
var width = parseInt(d3.select("#d3-chart").style("width")) 
height = parseInt(d3.select("#d3-chart").style("height"));
// console.log( width, height );

// Setup container & chart dimensions
var container_dimensions = {width: width, height: height},
chart_dimensions = {
	width: container_dimensions.width - margins.left - margins.right,
	height: container_dimensions.height - margins.top - margins.bottom
};

// Setup SVG
var chart = d3.select("#d3-chart")
.append("svg")
.attr("width", container_dimensions.width)
.attr("height", container_dimensions.height)
.append("g")
.attr("transform", "translate(" + margins.left + "," + margins.top + ")")
.attr("id","chart");

// Variables for scales & axis
var time_scale, percent_scale, pop_scale;
var time_axis, count_axis, pop_axis;

// Draw function
function draw(data) {
	// Make the data avaialble to the console
	csv_data = data;

	// Just population data
	var pop_data = data.map( function(d) { return [ d.year, d.pop ] } );

	// Get the extend of the data	
	var years = d3.extent(data, function(d) { return d.year });
	var ghcs = d3.extent(data, function(d) { return d.ghcs });
	var pops = d3.extent(data, function(d) { return d.pop });
	// Muck with dates
	var low_year = new Date ( years[0] );
	var high_year = new Date ( years[1] );
	low_year = low_year.setDate( low_year.getDate() - 365 );
	high_year = high_year.setDate( high_year.getDate() + 365 );
	// Setup the scales
	time_scale = d3.time.scale()
	.range([0,chart_dimensions.width])
	.domain([low_year,high_year]);
	percent_scale = d3.scale.linear()
	.range([chart_dimensions.height, 0])
	.domain([ghcs[0]-50,ghcs[1]+10]);
	pop_scale = d3.scale.linear()
	.range([chart_dimensions.height, 0])
	.domain([pops[0]-1,pops[1]+1]);

	// Setup axis
	time_axis = d3.svg.axis()
	.scale(time_scale);		
	count_axis = d3.svg.axis()
	.scale(percent_scale)
	.orient("left");
	pop_axis = d3.svg.axis()
	.scale(pop_scale)
	.orient("right");

	// Add the time axis
	chart.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + chart_dimensions.height + ")")
	.call(time_axis);
	// Add the percent axis
	chart.append("g")
	.attr("class", "y axis")
	.call(count_axis);
	// Add the pop axis
	chart.append("g")
	.attr("class", "p axis")
	.attr("transform", "translate(" + chart_dimensions.width + " , 0)")
	.call(pop_axis);

	// Axis labels
	// Add the y label
	d3.select(".y.axis")
	.append("text")
	.attr("text-anchor","middle")
	.text("GHCs")
	.attr("x", -chart_dimensions.height/2)
	.attr("y", -40)
	.attr("transform", "rotate(-90)");
	// Add the other y label
	d3.select(".p.axis")
	.append("text")
	.attr("text-anchor","middle")
	.text("Population")
	.attr("x", -chart_dimensions.height/2)
	.attr("y", 40)
	.attr("transform", "rotate(-90)");

	// Create lines for the values
	var line = d3.svg.line()
	.x(function(d){return time_scale(d.year)})
	.y(function(d){return percent_scale(d.ghcs)})
	.interpolate("linear");	
	var k_line = d3.svg.line()
	.x(function(d){return time_scale(d.year)})
	.y(function(d){return percent_scale(d.kyoto)})
	.interpolate("linear");	
	var p_line = d3.svg.line()
	.x(function(d){return time_scale(d.year)})
	.y(function(d){return pop_scale(d.pop)})
	.interpolate("linear");	

	// Add a group for the lines
	// TODO Need to add various groups for lines,
	// then add a more generalized selector for transitions
	// and mouse overs

	var g = d3.select("#chart")
	.append("g")
	g.append("path")
	.attr("class", "line")
	.attr("id", "ghcs")
	.attr("d", line(data));
	g.append("path")
	.attr("class", "line")
	.attr("id", "kyoto")
	.attr("d", k_line(data));
	g.append("path")
	.attr("class", "line")
	.attr("id", "ghcs")
	.attr("d", p_line(data));

	// This is not DRY!
	// GCHs
	var g_ghcs = d3.select("#chart")
	.append("g");
	// Add points to line
	g_ghcs.selectAll("circle")
	.data(data)
	.enter()
	.append("circle")
	.attr("cx", function(d) {return time_scale( d.year )})
	.attr("cy", function(d) {return percent_scale( d.ghcs )})
	.attr("r",0)
	.attr("class", "circle");

	// Population
	var g_pop = d3.select("#chart")
	.append("g");
	// Add points to line
	g_pop.selectAll("circle")
	.data(data)
	.enter()
	.append("circle")
	.attr("cx", function(d) {return time_scale( d.year )})
	.attr("cy", function(d) {return pop_scale( d.pop )})
	.attr("r",0)
	.attr("class", "circle");

	// Add mouse overs & transitions (GHCs)

	chart.selectAll("circle")
	.on("mouseover", function(d){
		d3.select(this)
		.transition()
		.attr("r",12);
	})
	.on("mouseout", function(d){
		d3.select(this)
		.transition()
		.attr("r",5);
	});
	var enter_duration = 2000;
	chart.selectAll("circle")
	.transition()
	.delay(function(d, i) { return i / data.length * enter_duration; })
	.attr("r", 5);


	g_ghcs.selectAll("circle")
	.on("mouseover.tooltip", function(d){
		d3.select("text#ghcs").remove();
		d3.select("#chart")
		.append("text")
		.text(d.ghcs + "TK")
		.attr("x", time_scale(d.year) + 15)
		.attr("y", percent_scale(d.ghcs) - 15)
		.attr("id", "ghcs");

	});
	g_ghcs.selectAll("circle")
	.on("mouseout.tooltip", function(d){
		d3.select("text#ghcs")
		.transition()
		.duration(500)
		.style("opacity",0)
		.remove();
	});


	// Responsive function
	// When the window changes size, re-calcuate the scales & re-draw
	function resize() {
		/* Find the new window dimensions */
		var width = parseInt(d3.select("#d3-chart").style("width")) - margins.left, 
		height = parseInt(d3.select("#d3-chart").style("height")) - margins.bottom;
		console.log( width, height );
		/* Update the range of the scale with new width/height */
		time_scale.range([0, width]).nice(d3.time.year);
		percent_scale.range([height, 0]).nice();

		/* Update the axis with the new scale */
		chart.select('.x.axis')
		.attr("transform", "translate(0," + height + ")")
		.call(time_axis);
		//
		chart.select('.y.axis')
		.call(count_axis);

		chart.selectAll('.line')
		.datum(data)
		.attr("d", line);

		chart.selectAll('.circle')
		.data(data)
		.attr("cx", function(d) {return time_scale( d.year )})
		.attr("cy", function(d) {return percent_scale( d.ghcs )});

	}
	d3.select(window).on('resize', resize);

}


d3.csv("/data/data.csv", function(d) {
	return {
		year: new Date(+d.Year, 0, 1), // convert "Year" column to Date
		ghcs: +d.GHCs,
		pop: +d.Population,
		kyoto: +d.Kyoto
	};
}, draw );

