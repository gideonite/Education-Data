var colnames = {
    overall_score: "2010-2011 OVERALL SCORE",
    pupil_teacher:"SCHOOLWIDE PUPIL-TEACHER RATIO",
    math_test: "math_test_score",
    school_level: "SCHOOL LEVEL*"
};

var collist = _.values(colnames);

var parallel_coordinates = function(data, el, params) {

    params = params || {
        margin: {top: 20, right: 10, bottom: 20, left: 10},
        width: 3000,
        height: 500
    };

    // margin conventions http://bl.ocks.org/mbostock/3019563
    var width = params.width - params.margin.left - params.margin.left;
    var height = params.height - params.margin.top - params.margin.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width', params.width)
        .attr('height', params.height);

    // scales

    var x = d3.scale.ordinal().rangePoints([0, width], 1).domain(collist);
    var y = {};     // colname -> scale

    var a = _.each(collist, function(colname) {
        y[colname] = d3.scale.linear()
            .range([height, 0])
            .domain(d3.extent(data, function(d) { return d[colname]; }))
    });

    // Add a group element for each coordinate.
    var coordinate = svg.selectAll(".coordinate")
        .data(collist)
        .enter()
        .append("g")
        .attr("class", "coordinate")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    var axis = d3.svg.axis().orient("left");

    coordinate.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -9)
      .text(String);

    svg.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', path);

    function path(d) {
        return d3.svg.line()(collist.map(function(colname) { return [x(colname), y[colname](d[colname]) || 0]; }));
    };

    return svg;
};

var Data;
d3.json("json/pupil-teacher_school-report_math-test.json", function(data) {
    Data = data;
    console.log(data[0]);

    parallel_coordinates(data, document.getElementById('parallel-coordinates'));
});



