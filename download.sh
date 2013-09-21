#!/bin/bash

# csv files that are downloaded directly (not via the web api) are always named
# rows.csv...
#
# instead of having to mention that name every time, just pass in the new name
# and the rest is taken care of
CSV_DOWNLOAD_NAME='rows.csv?accessType=DOWNLOAD'
DATA_DIR='data'
function rename_csv_download() {
    mv -v $CSV_DOWNLOAD_NAME $DATA_DIR/$1
}

function class_size() {
    wget 'https://data.cityofnewyork.us/api/views/urz7-pzb3/rows.csv?accessType=DOWNLOAD'
    rename_csv_download class_size_2010_11.csv
    head -n 100 class_size_2010_11.csv > $DATA_DIR/class_size_2010_11.mini.csv  # for playing with
}

function wifi_locations() {
    wget 'https://data.cityofnewyork.us/api/views/4u6b-frhh/rows.csv?accessType=DOWNLOAD'
    rename_csv_download wifi.csv
}

function nyc_jobs() {
    wget 'https://data.cityofnewyork.us/api/views/kpav-sd4t/rows.csv?accessType=DOWNLOAD'
    rename_csv_download nyc_jobs.csv
}

function math_test_results_2006_11() {
    wget 'https://data.cityofnewyork.us/api/views/jufi-gzgp/rows.csv?accessType=DOWNLOAD'
    rename_csv_download math_test_results_2006_11.csv

    FILEN=$DATA_DIR/math_test_results_2006_11.csv

    # N.B. what does this record mean??  Just ignoring for now
    grep -v 's,s,s,s,s,s,s,s,s,s,s' $FILEN >tmp
    mv tmp $FILEN
}

function graduation_outcomes() {
    wget 'https://data.cityofnewyork.us/api/views/cma4-zi8m/rows.csv?accessType=DOWNLOAD'
    rename_csv_download graduation_outcomes.csv
}

function graduation_outcomes() {
    wget 'https://data.cityofnewyork.us/api/views/cma4-zi8m/rows.csv?accessType=DOWNLOAD'
    rename_csv_download graduation_outcomes.csv
}

function enrollment_statistics_2010_11() {
    wget 'https://data.cityofnewyork.us/api/views/7z8d-msnt/rows.csv?accessType=DOWNLOAD'
    rename_csv_download enrollment_statistics_2010_11.csv
}

function school_demographics_and_accountability_2006_12() {
    wget 'https://data.cityofnewyork.us/api/views/ihfw-zy9j/rows.csv?accessType=DOWNLOAD'
    rename_csv_download school_demographics_and_accountability_2006_12.csv
}

function school_reports_2010_11() {
    wget 'https://data.cityofnewyork.us/api/views/upwt-zvh3/rows.csv?accessType=DOWNLOAD'
    rename_csv_download school_reports_2010_11.csv
}

function school_point_locations() {
    wget 'https://data.cityofnewyork.us/download/jfju-ynrr/application/zip'
    mv -v zip data/school_point_locations.zip

    # this is what you can do with it
    #ogr2ogr \
    #    -f GeoJSON \
    #    # N.B. `-t_srs` to convert between coordinate systems, see http://stackoverflow.com/questions/16925131/shapefile-to-topojson-conversion-problems
    #    -t_srs EPSG:4326 \
    #    -select "ADDRESS, LOC_CODE, ZIP, FAX, SCHOOLNAME" \
    #    school_locations.json Public_Schools_Points_2011-2012A.shp
}

function school_districts() {
    wget 'http://www.nyc.gov/html/dcp/download/bytes/nysd_13a.zip'
    mv -v nysd_13a.zip school_districts.zip
}

function school_safety_reports() {
    wget 'https://data.cityofnewyork.us/api/views/qybk-bjjc/rows.csv?accessType=DOWNLOAD'
    rename_csv_download school_safety_reports.csv
}

# exec all
#wifi_locations
#nyc_jobs
#class_size
#math_test_results_2006_11
#graduation_outcomes
#enrollment_statistics_2010_11
#school_demographics_and_accountability_2006_12
school_safety_reports

# check out survey data here:
# http://schools.nyc.gov/Accountability/tools/survey/default.htm
