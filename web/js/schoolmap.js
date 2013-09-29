function schoolmap(geo_school, dom_el) {
    var width = 500, height = 450;

    var svg = d3.select(dom_el).append("svg")
        .attr("width", width)
        .attr("height", height);

    var projection = d3.geo.albers()
        .center([22.04, 40.35])
        .scale(50000);

    var path = d3.geo.path().projection(projection);

    var transformation = 'scale(2.5), translate(-300, 100)';

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
        .append('circle')
        .attr('r', 1.5)
        .attr('cx', function(d) {
            return projection(d.geometry.coordinates)[0];
        })
        .attr('cy', function(d) {
            return projection(d.geometry.coordinates)[1];
        })
        .attr('fill', '#444')
        .attr('display', 'none');

    //Fax Number: "718-623-3193"
    //Location Name: "P.S. 003 The Bedford Village"
    //Open Date: "Jul 1 1950"
    //Primary Address: "50 JEFFERSON AVENUE"
    //Principal Name: "KRISTINA BEECHER"
    //Principal Title: "PRINCIPAL"
    //SCHOOL CODE: "K003"
    //Zip: 11216
    var qtip_template = _.template("<%=name%><br/>"
            + "<%=principal%>, <%=principal_title%><br/>"
            + "open date: <%=open_date%><br/>"
            + "fax number: <%=fax_number%>");

    function qtip(orgs) {
        schools.each(function(d) {
            var school_code = d.properties["SCHOOL CODE"];
            var org_data = orgs[school_code] || {};

            if (_.isEmpty(org_data)) {
                console.log(
                "missing org data for " + JSON.stringify(school_code)
                )
            }

            function capitalize(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }

            function getter_with_missing_data(map, key) {
                return function(key) {
                    var gotten = map[key];
                    if (!gotten) { return "missing data"; }
                    if (key === "Principal Title") {
                        gotten = capitalize(gotten.toLowerCase());
                    }
                    return gotten;
                }
            }

            var getter = getter_with_missing_data(org_data);

            var template_format = {
                name: getter("Location Name"),
                principal: getter("Principal Name"),
                principal_title: getter("Principal Title"),
                open_date: getter("Open Date"),
                fax_number: getter("Fax Number")
            };

            $(this).qtip({
                content: { text: qtip_template(template_format) }
            });
        })
    }

    function hide_all() { schools.attr('display', 'none'); };

    function set(list) {
        return _.chain(list)
            .map(function(i) {
                return [i["SCHOOL CODE"], undefined];
            })
            .object()
            .value();
    }

    return {
        show_school_list: function(school_list) {
            var school_set = set(school_list);

            hide_all();
            schools.filter(function(d) {
                return _.has(school_set, d.properties["SCHOOL CODE"]);
            }).attr('display', 'block')
        },
        show_all: function() { schools.attr('display', 'block'); },
        hide_all: hide_all,
        qtip: qtip
    };
}
