var MongoClient = require('mongodb').MongoClient, 
    Server = require('mongodb').Server;

module.exports.init = function() {
    MongoClient.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/pics', function(err, db) {
        module.exports.db = db;
        module.exports.err = err;
    });
};