var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var Grid = mongodb.Grid;
var masterDb = {};
var masterGrid = {};

module.exports.init = function(callback) {
	MongoClient.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/pics', function(err, db) {
		//module.exports.db = db;
		masterDb = db;
		masterGrid = new Grid(db, 'fs');
		
		callback(err);
	});
};

module.exports.put = function (strData) {
	var buffer = new Buffer(strData);
	masterGrid.put(buffer, {metadata: {category:'image'}, content_type: 'jpg'}, function(err, fileInfo){
		if(err) console.log(err);
		else {
			console.log('Finished writing file to Mongo');
			return fileInfo._id;
		}
	});
};

module.exports.get = function (_id) {
	masterGrid.get(_id, function(err, data) {
		if (err) console.log(err);
		else {
			console.log("Retrieved data: " + data.toString());
		}
	});
};

module.exports.delete = function (_id) {
	masterGrid.delete(_id, function(err, result) {
		if (err) console.log(err);
		else console.log('success: '+result);
	});
};