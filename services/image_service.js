var db = require('./mongoConnect').db,
    error = require('./mongoConnect').err,
    Grid = require('mongodb').Grid,
    Collection = require('mongodb').Collection,
	grid = null,
    collection = null;

if (!error) {
	grid = new Grid(db, 'fs');
	collection = new Collection(db, 'fs.files');
}

module.exports.put = function (strData, type, callback) {
	if (error) return callback(error, null);

    var buffer = new Buffer(strData);

	grid.put(buffer, {metadata: {category:'image'}, content_type: type}, function(err, fileInfo){
		callback(err, fileInfo._id);
	});
};

module.exports.get = function (id, options, callback) {
	if (error) return callback(error, null);

	collection.find({"_id": id}, options, function(err, dataCursor){
		if (err) return callback(err, datas);

		var datas = [];
		var err = [];
		// asynchronously get image files from the array of image id 
		dataCursor.each(function(e, item) {
			if (e) err.push(e);
			if(item==null) dataCursor.close();
			else {
				grid.get(item._id, function(e, data) {
					if (e) err.push(e);
					datas.push({id: item._id, type: item.contentType, data: data});
				});
			}
		});
		// synchronize the callback
		var flag = setInterval(function() {
			if (dataCursor.isClosed()) {
				clearInterval(flag);
				callback(err, datas);
			}
		}, 1000);
	});
};

module.exports.delete = function (_id, callback) {
	if (error) return callback(error, null);

	grid.delete(_id, callback);
};