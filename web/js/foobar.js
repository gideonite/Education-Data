var colnames = {
    overall_score: "2010-2011 OVERALL SCORE",
    pupil_teacher:"SCHOOLWIDE PUPIL-TEACHER RATIO",
    math_test: "math_test_score",
    school_level: "SCHOOL LEVEL*"
};

var collist = [
    "SCHOOL LEVEL*",
    "2010-2011 OVERALL SCORE",
    "SCHOOLWIDE PUPIL-TEACHER RATIO",
    "math_test_score"
    ];

var parallel_coordinates = function(data, el, params) {

    // munge
    data = _.filter(data, function(d) { return d[colnames.school_level] !== undefined; });

    params = params || {
        margin: {top: 20, right: 10, bottom: 20, left: 24},
        width: 1000,
        height: 500
    };

    // margin conventions http://bl.ocks.org/mbostock/3019563
    var width = params.width - params.margin.left - params.margin.left;
    var height = params.height - params.margin.top - params.margin.bottom;

    var svg = d3.select(el).append('svg')
        .append('g')
        .attr('transform', 'translate(' + params.margin.left + ',' + params.margin.top + ')')
        .attr('width', params.width)
        .attr('height', params.height);

    // scales

    var x = d3.scale.ordinal().rangePoints([0, width], 1).domain(collist);
    var y = {};     // colname -> scale

    _.each(collist, function(colname) {
        y[colname] = d3.scale.linear()
            .range([height, 0])
            .domain(d3.extent(data, function(d) { return d[colname]; }))
    });

    y[colnames.school_level] = d3.scale.ordinal().rangePoints([0, height]).domain(_.chain(data)
        .map(function(d) { return d[colnames.school_level]; })
        .uniq()
        .value());

    // data
    svg.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', function(d) { return d["BOROUGH"] === "K" ? "brooklyn" : "not-brooklyn"; })
        ;

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
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); });

    coordinate.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -7)
      .text(function(d) { return d; });

    function path(d) {
        return d3.svg.line()(collist.map(function(colname) { return [x(colname), y[colname](d[colname]) || 0]; }));
    };

    return svg;
};

var Data;
d3.json("json/pupil-teacher_school-report_math-test.json", function(data) {
    Data = data;

    parallel_coordinates(data, document.getElementById('parallel-coordinates'));
});
