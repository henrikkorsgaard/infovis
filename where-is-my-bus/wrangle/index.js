var csv = require('csvtojson');
var fs = require('fs');
var GeoJSON = require('geojson');
var gju = require('geojson-utils');
var Stop = require('./model/model.js').Stop

var cityRoutes = ["1A", "2A", "3A", "4A", "5A", "6A", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "31", "32", "33", "35", "40", "41", "42", "43", "44", "45", "46"]
var AarhusCoordinates = [[[9.948588,55.995712],[10.389087,55.995712],[10.389087,56.330448],[9.948588,56.330448],[9.948588,55.995712]]]

/*

Notes:

1. Storing stops should be as

*/


/*
 *   First step is to transform the route csv file into json objects.
 *   I filter by the name of the agency (see agency.txt), i.e. midttrafik
 *   and the names of the bus lines in Aarhus. This will give some dublicates
 *   on the line name, as few of the line names are the same in 3-4 four cities
 *   in Jutland. We will deal with that later. I also remove unneccesary fields
 *   as I don't like the clutter.
 *
 *   The output json is saved in ./data/output/midttrafik-routes.json
 *
 */

function one() {
    loadFile("./data/routes.txt", (data) => {
        var objects = []
        data.forEach((obj) => {
            if (obj.agency_id === "281" && cityRoutes.indexOf(obj.route_short_name) > -1) {
                delete obj.route_long_name;
                delete obj.route_type;
                delete obj.route_color;
                delete obj.route_text_color;
                delete obj.route_desc
                objects.push(obj)
            }
        })
        saveJSON("./data/output/midttrafik-routes.json", objects);
    })
}

/*
 *   Second step is to transform the trips csv file into json objects.
 *   I filter by the route_id's from the route json file because we do not want
 *   trips that do not belong to lines running in Aarhus. I also remove unneccesary fields
 *   as I don't like the clutter.
 *
 *   The output json is saved in ./data/output/midttrafik-trips.json
 *
 */

function two() {
    readJSONFile("./data/output/midttrafik-routes.json", (jsData) => {
        loadFile("./data/trips.txt", (data) => {
            var objects = []
            data.forEach((obj) => {
                jsData.forEach((jsObj) => {
                    if (obj.route_id === jsObj.route_id) {
                        delete obj.block_id;
                        delete obj.trip_short_name;
                        delete obj.shape_id;
                        objects.push(obj)
                    }
                })
            })
            saveJSON("./data/output/midttrafik-trips.json", objects);
        })
    })
}

/*
 *   Step three is to transform the stops.txt file into json objects.
 *   I just want to transform the stops into simplified json objects.
 *
 *   The output json is saved in ./data/output/midttrafik-stops.json
 *
 */

function three() {
    loadFile("./data/stops.txt", (data) => {
        var objects = {}
        data.forEach((obj) => {
            delete obj.stop_code
            delete obj.stop_desc
            delete obj.location_type
            delete obj.parent_station
            var point = GeoJSON.parse(obj, {'Point': ['stop_lon', 'stop_lat']})
            var inside = gju.pointInPolygon({"type":"Point","coordinates":[obj.stop_lon,obj.stop_lat]},
                 {"type":"Polygon", "coordinates":AarhusCoordinates})

            if(inside){
                objects[obj.stop_id] = obj
            }

        })
        saveJSON("./data/output/midttrafik-stops.json", objects);
    })
}

/*
 *   Fourth step is to transform the stop_times csv file into json objects.
 *   I filter by the trip_id's from the trip json file because we do not want
 *   times that do not belong to lines running in Aarhus. I also remove unneccesary fields
 *   as I don't like the clutter.
 *
 *   The output json is saved in ./data/output/midttrafik-stop-times.json
 *
 *   NOTE: stop_times.txt is a big file and nodejs will fail with an memory error
 *   unless we resixe the max heap memory with:
 *    node --max-old-space-size=8192 index.js
 *
 */


function four() {
    readJSONFile("./data/output/midttrafik-trips.json", (jsData) => {

        loadFile("./data/stop_times.txt", (data) => {
            var objects = []
            data.forEach((obj) => {
                jsData.forEach((jsObj) => {
                    if (obj.trip_id === jsObj.trip_id) {
                        delete obj.pickup_type;
                        delete obj.drop_off_type;
                        delete obj.stop_headsign
                        objects.push(obj)
                    }
                })
            })
            saveJSON("./data/output/midttrafik-stop-times.json", objects);
        })
    })
}

/*
 *   Fifth step is to transform put it all together in a file shoing all the lines,
 *   trips and stop times. First I iterate through all the trips and put each stop
 *   object into a final trip array. Then I add the route_id and the line name.
 *
 *   The output json is saved in ./data/output/midttrafik-trips-final.json
 */

function five() {
    readJSONFile("./data/output/midttrafik-stops.json", (stopData) => {

        readJSONFile("./data/output/midttrafik-stop-times.json", (jsData) => {
            var trips = {}
            var routes = {}
            jsData.forEach((obj) => {
                var trip_id = obj.trip_id
                if (!trips.hasOwnProperty(trip_id)) {
                    trips[trip_id] = {}
                    trips[trip_id].trip_id = trip_id
                    trips[trip_id].stops = []
                }
                delete obj.trip_id
                trips[trip_id].stops.push(obj)
            })
            readJSONFile("./data/output/midttrafik-trips.json", (jsData) => {
                jsData.forEach((obj) => {
                    if (trips.hasOwnProperty(obj.trip_id)) {
                        trips[obj.trip_id].route_id = obj.route_id;
                    }
                })

                readJSONFile("./data/output/midttrafik-routes.json", (jsData) => {
                    jsData.forEach((obj) => {
                        for (var k in trips) {
                            if (trips[k].route_id === obj.route_id) {
                                var line = obj.route_short_name
                                var stops = trips[k].stops
                                var localRoute = false;
                                for (var i = 0; i < stops.length; i++) {
                                    var id = stops[i].stop_id
                                    if(stopData.hasOwnProperty(id)){
                                        localRoute = true;
                                    }
                                }

                                trips[k].line = line
                                if (!routes.hasOwnProperty(line)) {
                                    routes[line] = []
                                }
                                if(localRoute){
                                    routes[line].push(trips[k])
                                }

                            }
                        }
                    })

                    for (var k in routes) {
                        saveJSON("./data/output/mt-route-" + k + "-final.json", routes[k]);
                    }
                })
            })
        })
    })
}


/*
 *   Step six is where I insert the stop data in the MongoDB
 *
 *  I use the Stop model in ./model/model.js
 */

function six() {
    readJSONFile("./data/output/midttrafik-stops.json", (data) => {
        var c = 0;
        for(var k in data){
            new Stop({name:data[k].stop_name, id:data[k].stop_id, location: [data[k].stop_lon, data[k].stop_lat]}).save(function(err){
                c++;
                if(c === Object.keys(data).length){
                    process.exit()
                }
            });
        }
    })
}

/*
 *   Step seven is where I insert the route data in the MongoDB
 *
 *  I use the Route model in ./model/model.js
 */

function seven() {
    readJSONFile("./data/output/midttrafik-routes.json", (data) => {
        var c = 0;

        for(var k in data){
            console.log(data[k])
            /*
            new Stop({name:data[k].stop_name, id:data[k].stop_id, location: [data[k].stop_lon, data[k].stop_lat]}).save(function(err){
                c++;
                if(c === Object.keys(data).length){
                    process.exit()
                }
            });
            */
        }
    })
}

//{"stop_id":"000751000100","stop_name":"Aarhus Rutebilstation","stop_lat":"56.151871000000","stop_lon":"10.209167000000"},
seven()

function loadFile(file, callback) {
    data = []
    csv().fromFile(file)
        .on('json', (jsonObj) => {
            data.push(jsonObj)
        })
        .on('done', (error) => {
            if (error) {
                console.log(error)
            } else {
                callback(data)
            }
        })
}


function readJSONFile(file, callback) {
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            console.log(err)
        } else {
            callback(JSON.parse(data))
        }
    });
}

function saveJSON(filename, json) {
    console.log("Saving json file: " + filename)
    fs.writeFile(filename, JSON.stringify(json))
}
