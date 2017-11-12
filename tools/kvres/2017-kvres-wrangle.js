JSONstat=require('../lib/json-stat.js')
var fs = require('fs');
var util = require('util');

var rawData = JSON.parse(fs.readFileSync('./kvres-jsonstat.json', 'utf8'));
var populationRaw = JSON.parse(fs.readFileSync('./kvres-folk1a.json', 'utf8'));
var jstatData=JSONstat(rawData)
var dataset = jstatData.Dataset(0)
var jstatPopulation = JSONstat(populationRaw)
var population = jstatPopulation.Dataset(0)

var result= {}
result.areas = []

dataset.Dimension("OMRÅDE").Category().forEach((el)=>{
  switch (el.label) {
    case '084 Region Hovedstaden':
    case '085 Region Sjælland':
    case '083 Region Syddanmark':
    case '082 Region Midtjylland':
    case '081 Region Nordjylland':
      break;
    default:
      var key = el.label.substring(0,3)
      var area = {}
      area.label = el.label.substring(4, el.label.length)
      area.code = key
      area.voters = dataset.Data({"OMRÅDE": key, "VALRES": "V"}).value
      area.votes = dataset.Data({"OMRÅDE": key, "VALRES": "AS"}).value
      area.letter = dataset.Data({"OMRÅDE": key, "VALRES": "GB"}).value
      area.personal = dataset.Data({"OMRÅDE": key, "VALRES": "PS"}).value
      area.valid = dataset.Data({"OMRÅDE": key, "VALRES": "GS"}).value
      area.invalid = dataset.Data({"OMRÅDE": key, "VALRES": "AGS"}).value
      area.blank = dataset.Data({"OMRÅDE": key, "VALRES": "BS"}).value

      //RED VOTES
      var a = dataset.Data({"OMRÅDE": key, "VALRES": "GSA"}).value
      var b = dataset.Data({"OMRÅDE": key, "VALRES": "GSB"}).value
      var f = dataset.Data({"OMRÅDE": key, "VALRES": "GSF"}).value
      var ø = dataset.Data({"OMRÅDE": key, "VALRES": "GSØ"}).value
      area.red = a + b+ f + ø


      //BLUE VOTES
      var v = dataset.Data({"OMRÅDE": key, "VALRES": "GSV"}).value
      var c = dataset.Data({"OMRÅDE": key, "VALRES": "GSC"}).value
      var o = dataset.Data({"OMRÅDE": key, "VALRES": "GSO"}).value
      var i = dataset.Data({"OMRÅDE": key, "VALRES": "GSI"}).value
      area.blue = v + c + o + i

      var s = dataset.Data({"OMRÅDE": key, "VALRES": "GSS"}).value
      var other = dataset.Data({"OMRÅDE": key, "VALRES": "GSEJR"}).value
      area.other = s + other

      area.parties = {}
      area.parties.a = a;
      area.parties.b = b;
      area.parties.f = f;
      area.parties.ø = ø;
      area.parties.v = v;
      area.parties.c = c;
      area.parties.o = o;
      area.parties.i = i;
      area.parties.s = s;
      area.parties.other = other;


      area.population = population.Data({"OMRÅDE": key})[0].value
      result.areas.push(area)
      if(key === "000"){
        result.danmark = area
      }
      break;
  }
});

fs.writeFile("./kvres-2017-data.json", JSON.stringify(result), 'utf8', function (err) {
    if (err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

fs.writeFile("./kvres-2017-data.js", util.inspect(result), 'utf8', function (err) {
    if (err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});
