var mongoose = require('mongoose');

mongoose.connect('localhost', 'bus-schedules-aarhus');

var stopSchema = mongoose.Schema({
  name: String,
  id: { type : Number , unique : true, required : true, dropDups: true, index:true },
  location: {
    type: [Number],
    index: '2d'
  }
});

module.exports.Stop = mongoose.model('stops', stopSchema);

var tripSchema = mongoose.Schema({
  line: String,
  id: { type : Number , unique : true, required : true, dropDups: true, index:true },
  origin: String,
  destination: String,
  stops: [stopSchema]
  route: {

  }
});


//http://tugdualgrall.blogspot.dk/2014/08/introduction-to-mongodb-geospatial.html
//http://mongoosejs.com/docs/2.7.x/docs/embedded-documents.html

//
/*

We want to store stops!




We want to store routes!

We want to store trips: start stop at each stop

*/
