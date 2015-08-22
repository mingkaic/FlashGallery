var express = require('express');
var fs = require('fs');
var multipart = require('connect-multiparty');

var mongo = require('../mongo');
var ObjectID = require('mongodb').ObjectID;

var multipartMiddleware = multipart();
var router = express.Router();

var imgFolderPath = __dirname + "/../public/images/temp/";

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// loops through datas sequentially
// pipes together the write file functions to ensure single threading
function multiLocal(iteration, datas, callback) {
	var len = datas.length;

	if (iteration >= len) return callback();

	var pathId = makeid();
	var imgPath = imgFolderPath+pathId+'.jpg';

	fs.writeFile(imgPath, datas[iteration].data, function (err) {
		if (err) console.log(err);
		mongo.record({imgId: ObjectID(datas[iteration].id), imgPath: pathId+'.jpg'});

		multiLocal(iteration+1, datas, callback);
	});
}

function clearLocal(path, res, callback) {
	mongo.retrieve({'imgPath': path}, function(localImgs) {
		if (localImgs == null || localImgs.length <= 0) callback(null, res);
		mongo.remove({'_id': ObjectID(localImgs[0].imgId)}, function(err) {
			if (err) console.log(err);
			else {
				fs.unlink(imgFolderPath+path, function(err) {
					if (err) console.log(err);
					callback(localImgs[0].imgId, res);
				});
			}
		});
	});
}

/* GET home page. */
router.get('/', function(req, res, next) {
	mongo.retrieve({}, function(localImgs) {
		var localImgId = [];
		var len = localImgs.length;
		for (var i = 0; i < len; i++) {
			localImgId.push(localImgs[i].imgId);
		}

		// simply get all images from mongo not found in local
		mongo.get({"$nin": localImgId}, function(err, datas) {
			console.log(datas);
			if (err) console.log(err);

			var iteration = 0;

			multiLocal(iteration, datas, function() {
				console.log(imgFolderPath);
				fs.readdir(imgFolderPath, function(err, files) {
					var imgUrl = [];

					if (err) console.log(err);
					else {
						var length = files.length;
						for (var i = 0; i < length; i++) {
							imgUrl.push('/images/temp/'+files[i]);
						}
					}

					// this is the object being rendered!
					var vm = {
						title: 'The Flash Gallery',
						imageUrl: imgUrl
					};

					res.render('index', vm);
				});
			});
		});
	});
});

router.post('/uploads', multipartMiddleware, function(req, res, next) {
	fs.readFile(req.files.displayImage.path, function (err, data) {
		if (data=='') return res.redirect('back');

		// write to mongo first
		mongo.put(data, function(err, id){
			if (err) console.log(err);
			else {
				var pathId = makeid();
				var imgPath = imgFolderPath+pathId+'.jpg';
				// next create a local copy on the imgPath
				fs.writeFile(imgPath, data, function (err) {
					if (err) console.log(err);

					// finally once the local picture is made,
					// store the mongo id and path of stored image
					// to prevent retrieving duplicate images from mongo
					else {
						mongo.record({imgId: ObjectID(id), imgPath: pathId+'.jpg'});
					}

					delete req.files;
					res.redirect('back');
				});
			}
		});
	});
});

router.delete('/removeLocal/:path', function(res, req, next) {
	var path = req.req.params.path;

	clearLocal(path, res, function(id, res) {
		console.log('id removed from local: '+id);
		res.res.redirect('back');
	});
});

router.delete('/remove/:path', function(res, req, next) {
	var path = req.req.params.path;

	clearLocal(path, res, function(id, res) {
		if (id == null) return res.redirect('back');

		mongo.delete(id, function(response, res) {
			if (response) console.log(response);
			else console.log('deletion successful');
			res.res.redirect('back');
		});
	});
});

module.exports = router;
