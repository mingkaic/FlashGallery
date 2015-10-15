var db = require('./mongoConnect').db,
    error = require('./mongoConnect').err,
    Collection = require('mongodb').Collection, 
    collect = null;

if (!error) collect = new Collection(db, 'imgData');

module.exports.put = function (dataBundle, callback) {
    if (error) callback(error);

	collect.insert(dataBundle, function(err, records) {
		if (err) callback(err);
		else callback(null);
	});
};

module.exports.get = function(id, callback) {
	if (error) callback(error, null);

    collect.find(id, function(err, docs) {
		if (err) return callback(err, null);

		docs.toArray(callback);
	});
};

module.exports.delete = function(id, callback) {
	if (error) callback(error);

    collect.remove(id, callback);
};