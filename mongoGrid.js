function mongoGridPut(db) {
	var Grid = require('mongodb').Grid;

	var grid = new Grid(db, 'fs');
	var buffer = new Buffer('Hello World1');
	grid.put(buffer, {metadata: {category:'text'}, content_type: 'text'}, function(err, fileInfo){
		if(err) console.log(err);
		else {
			console.log('Finished writing file to Mongo');
			mongoGridGet(db, fileInfo._id);
		}
	});
};

function mongoGridGet(db, _id) {
	var Grid = require('mongodb').Grid;

	var grid = new Grid(db, 'fs');
	grid.get(_id, function(err, data) {
		if (err) console.log(err);
		else {
			console.log("Retrieved data: " + data.toString());
			mongoGridDelete(db, _id);
		}
	});
}

function mongoGridDelete(db, _id) {
	var Grid = require('mongodb').Grid;

	var grid = new Grid(db, 'fs');
	grid.delete(_id, function(err, result) {
		if (err) console.log(err);
		else console.log('success: '+result);
	});
}

module.exports = {put: mongoGridPut, get: mongoGridGet, delete: mongoGridDelete};