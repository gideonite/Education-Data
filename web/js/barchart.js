var Barchart = function(data, el, params) {

    // --- munge ---
    var bar_data = _.chain(data)
        .filter(function(d) {
            return d.value !== "Does Not Apply"
                && d.value !=="Not Scored";
        })
        .groupBy(function(d) {
            return d.value;
        })
        .map(function(val,key) {
            return { answer: key, count: val.length };
        })
        .value();

    var defaults = { margin: {top: 20, right: 10, bottom: 25, left: 24},
        width: 500,
        height: 500
    };
    params = _.extend(defaults, params);

    // -- visualize --

    // margin conventions http://bl.ocks.org/mbostock/3019563
    var width = params.width - params.margin.left - params.margin.left;
    var height = params.height - params.margin.top - params.margin.bottom;

    var answers = ["Strongly Agree", "Agree", "Disagree", "Strongly Disagree"];
    var x = d3.scale.ordinal()
        .domain(answers)
        .rangePoints([0, width], 1);

    var y = d3.scale.linear()
        .domain([0, d3.max(_.map(bar_data, function(d) { return d.count; }))])
        .range([height, 0])

    var svg = d3.select(el).append('svg')
        .attr('width', params.width)
        .attr('height', params.height)
        .append('g')
        .attr('transform','translate(' + params.margin.left + ',' + params.margin.top + ')');

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    var xWidth = (function() {
        var range = x.range();
        return range[1] - range[0];
    }());

    var bar_width = xWidth / 2;
    var bar_offset = bar_width / 2;

    var rect = svg.selectAll('rect')
        .data(bar_data)
        .enter()
        .append('rect')
        .attr('width', xWidth / 2)
        .attr('height', function(d) { return height - y(d.count); })
        .attr('x', function(d) { return x(d.answer) - bar_offset; })
        .attr('y', function(d) { return y(d.count); })
        .attr('fill', 'steelblue')
        .on('mouseover', function() { d3.select(this).attr('opacity', 0.75) })
        .on('mouseout', function() { d3.select(this).attr('opacity', 1) })
        .on('click', function() {
            var d3this = d3.select(this);
            var selected = d3this.attr('selected');
            selected = (selected === 'true');     // NB bad code duplication
            console.log(selected);
            if (selected) {
                d3this.attr('fill', 'black')
            } else {
                d3this.attr('fill', 'steelblue')
            }
        })
    ;

    function bind_on_fn(on, fn) {
        rect.on(on, function(datum) {
            var answer = datum.answer;
            var datas = data.filter(function(d) {
                return d.value === answer;
            });

            fn(datas, this)
        });
    }

    _.each(params.on, function(fn, on) {
        bind_on_fn(on ,fn);
    });
};

// monkey patch
Barchart.dummy_svg = function(dom_el, params) {
    var defaults = { margin: {top: 20, right: 10, bottom: 25, left: 24},
        width: 500,
        height: 500
    };
    params = _.extend(defaults, params);

    d3.select(dom_el).append('svg')
        .attr('width', params.width)
        .attr('height', params.height);
}
