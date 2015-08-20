var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var Grid = mongodb.Grid;
var Collection = mongodb.Collection;

var masterGrid = {};
var dataCollection = {};
var fileCollection = {};

module.exports.init = function(callback) {
	MongoClient.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/pics', function(err, db) {
		//module.exports.db = db;

		dataCollection = new Collection(db, "imgData");
		fileCollection = new Collection(db, "fs.files");
		masterGrid = new Grid(db, 'fs');

		callback(err);
	});
};

// deals with data records
module.exports.record = function (dataBundle) {
	dataCollection.insert(dataBundle, function(err, records) {
		if (err) console.log(err);
		else console.log(records);
	});
};

module.exports.retrieve = function(id, callback) {
	dataCollection.find(id, function(err, docs) {
		if (err) console.log(err);
		else {
			docs.toArray(function(err, docArr) {
				callback(docArr);
			});
		}
	});
};

module.exports.remove = function(id, callback) {
	dataCollection.delete(id, callback);
};

// deals with file collection
module.exports.put = function (strData, callback) {
	var buffer = new Buffer(strData);
	masterGrid.put(buffer, {metadata: {category:'image'}, content_type: 'jpg'}, function(err, fileInfo){
		callback(err, fileInfo._id);
	});
};

module.exports.get = function (_id, callback) {
	var error = null;

	fileCollection.find({"_id": _id}, function(err, dataCursor){
		if (err) error=err;

		var datas = [];
		dataCursor.each(function(err, item) {
			if(item==null) dataCursor.close();
			else {
				masterGrid.get(item._id, function(err, data) {
					if (err) error=err;

					datas.push({id: item._id, data: data});
				});
			}
		});

		var flag = setInterval(function() {
			if (dataCursor.isClosed()) {
				clearInterval(flag);
				callback(error, datas);
			}
		}, 1000);
	});
};

module.exports.delete = function (_id, callback) {
	masterGrid.delete(_id, function(err, result) {
		if (err) callback(err);
		else callback(false);
	});
};