var colors = {}
colors.red = "#b35806"
colors.blue ="#542788"
colors.others = "#fee0b6"

document.addEventListener("DOMContentLoaded", function() {
  bootstrap()
});

/*
TODO: Animate
TODO: Hover
*/


function bootstrap(){
  visualiseBlockBar("000")
  visualiseBarChart("000")
}


function visualiseBarChart(area){
  var chart = document.querySelector("#barchart")
  var height = chart.clientHeight;
  var width = chart.clientWidth;

  var votes = getBlockVotes(area)

  var max = d3.max(votes, function(d) {
      return d.votes+1000000;
  });
  console.log(votes)
  console.log(max)

  var x = d3.scaleLinear()
      .range([0, width])
      .domain([0, max]);

  var svg = d3.select(chart).append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.selectAll("rect")
      .data(votes, function(d) { return d; })
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i)=>{
        return i*(height/3);
      })
      .attr("height", height/3-10)
      .attr("width", 0)
      .transition()
      .duration(1000)

      .attr("width", (d)=>{
        console.log(x(d.votes))
        return x(d.votes);
      })
      .attr("fill",(d)=>{
        return colors[d.block]
      })

}


function visualiseBlockBar(area){
    var bar = document.querySelector("#percentbar")
    var height = bar.clientHeight;
    var width = bar.clientWidth;

    var votes = getBlockVotes(area)
    var stackVotes = []
    obj = {}
    votes.forEach((el)=>{
      obj[el.block] = el.votes
    });
    stackVotes.push(obj)


    console.log(stackVotes)

    var stack = d3.stack()
        .keys(["blue", "others", "red"])

    var stacked = stack(stackVotes); //we need to do that again

    var maxX = d3.max(stacked, function(d) {
        return d3.sum(d, function(d) {
          return d[1];
        });
    });

    var x = d3.scaleLinear()
        .range([width, 0])
        .domain([0, maxX]);

    var svg, layers

    if(!bar.hasChildNodes()) {
      svg = d3.select(bar).append('svg').attr("width", width);

      layers = svg.selectAll('g.layer')
        .data(stacked, function(d) { return d.key; })
          .enter()
            .append('g')
              .attr('class', 'layer')
              .attr('fill', function(d) {
                return colors[d.key];
              });

              // bind a <rect> to each value inside the layer
      layers.selectAll('rect')
        .data(function(d) { return d; })
        .enter()
        .append('rect')
              .attr('y', 0)
              .attr('height', height)
              .attr('x', function(d) {

                  return x(d[1]);
              })
              .attr("width", 0)
    } else {
      svg = d3.select(bar).select("svg")
    }

    layers = svg.selectAll('g.layer')
      .data(stacked, function(d) { return d.key; })


      layers.selectAll('rect')
        .data(function(d) { return d; })
        .transition()
        .duration(1000)
        .attr('x', function(d) {
          return x(d[1]);
        })
        .attr('width', function(d) {
        return x(d[0]) - x(d[1]);
      });

}

function loadJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../data/kvres-2017-data.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
          }
    };
    xobj.send(null);
 }

 function getBlockVotes(areaCode) {
   var area;
   for(var i = 0; i < voting_data.areas.length; i++){
     var a = voting_data.areas[i]
     if(a.code === areaCode){
       area = a;
       break;
     }
   }

   var votes = [
     {block: "red", votes:area.red},{block: "blue", votes:area.blue},{block: "others", votes:area.others}
   ]

   return votes
 }
