document.addEventListener( "DOMContentLoaded", function () {
    queue()
        .defer( d3.json, "./data/kommuner.topojson" )
        .defer( d3.json, "./data/kvres-2013-data.json" )
        .await( loaded );

} );

colors = {
  a:"#a32f2a",
  v:"#2e4360",
  b:"#683879",
  f:"#ca2172",
  o:"#edce60",
  "ø":"#da8038",
  i:"#7fc6ce",
  c:"#a6va4d",
  other: "white"
}

/*
  Data wrangle issues:

  Party letters
  Have votes as array of objects {party: name, votes: number}
  Slevig is part of others in all national surveys
*/


function loaded( err, dkmap, kvres ) {

    var container = document.querySelector( "#slide_1" );
    var map = container.querySelector( "#map" );
    var chart = container.querySelector( "#chart" );
    var width = 500;
    var height = 500;

    var projection = d3.geoAlbers()
        .center( [ 2.4, 56.15 ] )
        .rotate( [ -8, 0 ] )
        .scale( 9000 )
        .translate( [ width / 2, height / 2 ] );

    var path = d3.geoPath()
        .projection( projection );

    var svg = d3.select( map ).append( "svg" )
        .attr( "width", width )
        .attr( "height", height );

    var geojson = topojson.feature( dkmap, dkmap.objects.stdin );
    svg.append( "g" )
        .selectAll( "path" )
        .data( geojson.features )
        .enter().append( "path" )
        .attr( "d", path )
        .attr( "stroke-width", 1 )
        .attr( "fill", function ( d ) {
            var municipalityCode = parseInt( d.properties.KOMKODE )
            var municipality;
            var color = "#2c7bb6"
            kvres.areas.forEach( function ( el ) {
                if ( parseInt( el.code ) === municipalityCode ) {
                    municipality = el;
                }
            } );

            if ( municipality.blue < municipality.red ) {
                color = "#d7191c"
            }
            return color
        } )
        .attr( "stroke", "#2e3037" )
        .on( "mouseover", function ( d ) {
          var municipalityCode = parseInt( d.properties.KOMKODE )
          var municipality;

          kvres.areas.forEach( function ( el ) {
              if ( parseInt( el.code ) === municipalityCode ) {
                  municipality = el;
              }
          } );
          updateBarChart(municipality)

        } )
        .filter( function ( d ) {
            var municipalityCode = parseInt( d.properties.KOMKODE )
            if ( municipalityCode === 400 || municipalityCode === 411 ) {
                return d;
            }
        } ).attr( "transform", "translate(-250,-300)" )


    // set the ranges
    var x = d3.scaleBand()
        .range( [ 0, width ] )
        .padding( 0.1 );
    var y = d3.scaleLinear()
        .range( [ 400, 0 ] );

    var data = []

    for( var key in kvres.danmark.parties){
      var obj = kvres.danmark.parties[key]
      data.push({party: key, votes:obj})
    }

    x.domain(data.map(function(d) { return d.party; }));
    y.domain([0, d3.sum(data, function(d) { return d.votes; })]);

    var svgChart = d3.select( chart ).append( "svg" )
    .attr( "width", width )
    .attr( "height", height );

    svgChart.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", function(d) {
        return x(d.party); })
      .attr("width", x.bandwidth())
      .attr( "transform", "translate(0,-120)" )
      .attr("height", function(d) { return height - y(d.votes); })
      .attr("y", function(d) { return y(d.votes); })
      .attr("fill", function(d){
        console.log(d)
        return colors[d.party]
      })

    svgChart.append("text")
    .text("Danmark")
    .attr("y", 420)
    .attr("x", 250)
    .attr("fill", "white")
    .style("text-anchor", "middle")
    .style("font-size", "24px")
}

var mapcolors = [ '#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6' ]

function updateBarChart(municipality) {
  var height = 500;
  var data = []

  for( var key in municipality.parties){
    var obj = municipality.parties[key]
    data.push({party: key, votes:obj})
  }

  var y = d3.scaleLinear()
      .range( [ 400, 0 ] );

  y.domain([0, d3.sum(data, function(d) { return d.votes; })]);

  var svgChart = d3.select( chart ).select("svg")
  svgChart.selectAll("rect")
    .data(data)
    .transition()
    .duration(500)
    .attr("y", function(d) { return y(d.votes); })
    .attr("height", function(d) { return height - y(d.votes); })

    svgChart.select("text").text(municipality.label)

}
