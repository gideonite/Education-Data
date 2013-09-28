function schoolmap(geo_school, dom_el) {
    var width = 500, height = 350;

    var svg = d3.select(dom_el).append("svg")
        .attr("width", width)
        .attr("height", height);

    var projection = d3.geo.albers()
        .center([22.04, 40.35])
        .scale(50000);

    var path = d3.geo.path().projection(projection);

    var transformation = 'scale(2), translate(-300, 100)';

    // add districts
    svg.selectAll('g.district')
        .data(topojson.feature(geo_school, geo_school.objects.school_districts).features)
        .enter().append('g')
        .attr('transform', transformation)
        .attr('class', 'district')
        .append('path')
        .attr('d', path);

    // add schools
    var schools = svg.selectAll('g.school')
        .data(topojson.feature(geo_school, geo_school.objects.school_locations).features)
        .enter().append('g')
        .attr('transform', transformation)
        .attr('class', 'school')
        .append('path')
        .attr('fill', "#444")
        .attr('display', 'none')
        .attr('d', path);

    function hide_all() { schools.attr('display', 'none'); };

    return {
        show_school_set: function(school_set) {
            hide_all();
            schools.filter(function(d) {
                return _.has(school_set, d.properties["SCHOOL CODE"]);
            }).attr('display', 'block')
        },
        show_all: function() { schools.attr('display', 'block'); },
        hide_all: hide_all
    };
}
