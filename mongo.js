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
		// else console.log(records);
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
	dataCollection.remove(id, callback);
};

// deals with file collection
module.exports.put = function (strData, type, callback) {
	var buffer = new Buffer(strData);
	masterGrid.put(buffer, {metadata: {category:'image'}, content_type: type}, function(err, fileInfo){
		callback(err, fileInfo._id);
	});
};

module.exports.get = function (id, options, callback) {
	var error = null;

	// master grid can only obtain image at a time.
	// accessing fs.file directly to obtain an array of id of images
	fileCollection.find({"_id": id}, options, function(err, dataCursor){
		if (err) error=err;

		var datas = [];
		// asynchronously get image files from the array of image id 
		dataCursor.each(function(err, item) {
			if (err) console.log(err);
			
			if(item==null) dataCursor.close();
			else {
				masterGrid.get(item._id, function(err, data) {
					if (err) error=err;

					datas.push({id: item._id, type: item.contentType, data: data});
				});
			}
		});
		
		// synchronize the callback
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
		else callback(result);
	});
};