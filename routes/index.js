var express = require('express');
var fs = require('fs');
var multipart = require('connect-multiparty');

var mongo = require('../mongo');
var ObjectID = require('mongodb').ObjectID;

var multipartMiddleware = multipart();
var router = express.Router();

var imgFolderPath = __dirname + "/../public/images/temp/";

// acceptable file types
var fileType = ['image/jpeg', 'image/png'];
var extensions = ['.jpg', '.png'];

var LOCAL_MAX = 20;

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// loops through datas sequentially
// pipes together the write file functions to ensure single threading
function multiLocal(iteration, datas, newLocal, callback) {
	var len = datas.length;

	// base condition
	if (iteration >= len) return callback();

	var pathId = makeid()+extensions[fileType.indexOf(datas[iteration].type)];
	var imgPath = imgFolderPath+pathId;

	// write the image data to local
	fs.writeFile(imgPath, datas[iteration].data, function (err) {
		if (err) console.log(err);
		
		var recordObject = {imgId: ObjectID(datas[iteration].id), imgPath: pathId};
		
		// update the imgData list of new files in public/images/temp
		mongo.record(recordObject); // persistent copy
		newLocal.push(recordObject); // volatile copy

		// recurse
		multiLocal(iteration+1, datas, newLocal, callback);
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
	// localImgs are in the formimg {imgId, imgPath}
	mongo.retrieve({}, function(localImgs) {
		var localImgId = [];
		var len = localImgs.length;
		for (var i = 0; i < len; i++) {
			localImgId.push(localImgs[i].imgId);
		}

		// simply get all images from mongo not found in local
		// image objects are in the format {id, type, data}
		// only shows 20 images (including the images already in public)
		mongo.get({"$nin": localImgId, $limit: LOCAL_MAX-len}, function(err, datas) {
			if (err) console.log(err);

			var iteration = 0;
			var newLocal = []; // passed by reference

			multiLocal(iteration, datas, newLocal, function() {
				localImgs = localImgs.concat(newLocal);
				for (var i = 0; i < localImgs.length; i++) {
					localImgs[i].imgId='/images/temp/'.concat(localImgs[i].imgPath);
				}

				// this is the object being rendered!
				var vm = {
					title: 'The Flash Gallery',
					imageArr: localImgs
				};

				res.render('index', vm);
			});
		});
	});
});

router.get('/details/:id', function(req, res, next) {
	console.log(req.params.id);
	var string = encodeURIComponent(req.params.id);
  	res.redirect('/imgDetail/?valid='+string);
});

router.post('/uploads', multipartMiddleware, function(req, res, next) {
	fs.readFile(req.files.displayImage.path, function (err, data) {
		if (err) console.log(err);
		if (data=='') return res.redirect('back');
		
		var ftypeIndex = fileType.indexOf(req.files.displayImage.type);
		
		if (ftypeIndex==-1) {
			console.log('attempted to upload non-image file, please verify');
			res.redirect('back');
		} else {
			// write to mongo first
			mongo.put(data, req.files.displayImage.type, function(err, id){
				if (err) console.log(err);
				else {
					var pathId = makeid()+extensions[ftypeIndex];
					var imgPath = imgFolderPath+pathId;
					// next create a local copy on the imgPath
					fs.writeFile(imgPath, data, function (err) {
						if (err) console.log(err);
	
						// finally once the local picture is made,
						// store the mongo id and path of stored image
						// to prevent retrieving duplicate images from mongo
						else {
							mongo.record({imgId: ObjectID(id), imgPath: pathId});
						}
	
						delete req.files;
						res.redirect('back');
					});
				}
			});
		}
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
