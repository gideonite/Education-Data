var parallel_coordinates = function(data, el, params) {

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

    // munge
    data = _.filter(data, function(d) { return d[colnames.school_level] !== undefined; });

    var defaults = { margin: {top: 20, right: 10, bottom: 20, left: 24},
        width: 1000,
        height: 500
    };

    params = _.extend(defaults, params);

    // margin conventions http://bl.ocks.org/mbostock/3019563
    var width = params.width - params.margin.left - params.margin.left;
    var height = params.height - params.margin.top - params.margin.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width', params.width)
        .attr('height', params.height)
        .append('g')
        .attr('transform', 'translate(' + params.margin.left + ',' + params.margin.top + ')')
        ;

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

    // background
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", path);

    // foreground
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", path);

    // Add a group element for each coordinate.
    var coordinate = svg.selectAll(".coordinate")
        .data(collist)
        .enter()
        .append("g")
        .attr("class", "coordinate")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    // add axises for each coordinate
    var axis = d3.svg.axis().orient("left");
    coordinate.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); });

    // give each coordinate a label
    coordinate.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -7)
      .text(function(d) { return d; });

    // add and store a brush for each coordinate
    coordinate.append("g")
        .attr("class", "brush")
        .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    function path(d) {
        return d3.svg.line()(collist.map(function(colname) { return [x(colname), y[colname](d[colname]) || 0]; }));
    };

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = collist.filter(function(p) { return !y[p].brush.empty(); }),
            extents = actives.map(function(p) { return y[p].brush.extent(); });
        foreground.style("display", function(d) {
            return actives.every(function(property, i) {
                var this_scale = y[property];
                var extent = extents[i];
                var value = d[property];

                // if string, lets map to a numerical scale
                if (_.isString(value)) {
                    return extent[0] <= this_scale(value) && this_scale(value) <= extent[1];
                } else {
                    return extent[0] <= value && value <= extent[1];
                }
            }) ? null : "none";
        });
    }

    return svg;
};

var Data;
d3.json("json/pupil-teacher_school-report_math-test.json", function(data) {
    Data = data;

    parallel_coordinates(data, document.getElementById('parallel-coordinates'));
});
