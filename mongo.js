var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var Grid = mongodb.Grid;

module.exports.init = function(callback) {
	MongoClient.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/pics', function(err, db) {
		module.exports.db = db;
		callback(err);
	});
};

module.exports.put = function (db, strData) {
	var grid = new Grid(db, 'fs');
	var buffer = new Buffer('Hello World!');
	grid.put(buffer, {metadata: {category:'text'}, content_type: 'text'}, function(err, fileInfo){
		if(err) console.log(err);
		else {
			console.log('Finished writing file to Mongo');
			module.exports.get(db, fileInfo._id);
		}
	});
};

module.exports.get = function (db, _id) {
	var grid = new Grid(db, 'fs');
	grid.get(_id, function(err, data) {
		if (err) console.log(err);
		else {
			console.log("Retrieved data: " + data.toString());
			module.exports.delete(db, _id);
		}
	});
};

module.exports.delete = function (db, _id) {
	var grid = new Grid(db, 'fs');
	grid.delete(_id, function(err, result) {
		if (err) console.log(err);
		else console.log('success: '+result);
	});
};