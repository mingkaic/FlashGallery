var express = require('express');
var fs = require('fs');
var multipart = require('connect-multiparty');

var mongo = require('../mongo');
var ObjectID = require('mongodb').ObjectID;

var multipartMiddleware = multipart();
var router = express.Router();

var imageFolderPath = "/images/temp/";
var imgFolderPath = __dirname + "/../public"+imageFolderPath;

// acceptable file types
var fileType = ['image/jpeg', 'image/png'];
var extensions = ['.jpg', '.png'];

var LOCAL_MAX = 20;

function recordToArray(dataObjArr) {
	var localIds = [];
	var localImgs = [];
	
	for (var i = 0; i < dataObjArr.length; i++) {
		localIds.push(dataObjArr[i].imgId);
		localImgs.push(imageFolderPath+dataObjArr[i].imgId+dataObjArr[i].extension);
	}
	
	return {id: localIds, path: localImgs};
}

// loops through datas sequentially
// pipes together the write file functions to ensure single threading
// PROBLEM: THIS FILE IS WRITING SEQUENTIALLY, WHEN WRITING SHOULD IDEALLY BE PERFORMED IN MULTITHREAD
// PROPOSED SOLUTION: CHANGE MONGO.JS GET FUNCTION TO PERFORM MULTIPLE CALLBACKS, EACH CALLBACK HAS IT'S OWN WRITE
// SYNCHRONIZATION WILL BE DONE ON THIS FILE
// USE BUFFER THREAD TO DECOUPLE
function multiLocal(iteration, datas, newLocal, callback) {
	var len = datas.length;

	// base condition
	if (iteration >= len) return callback(null);

	var extension = extensions[fileType.indexOf(datas[iteration].type)];
	var imgPath = imgFolderPath+datas[iteration].id+extension;

	// write the image data to local
	fs.writeFile(imgPath, datas[iteration].data, function (err) {
		callback(err);
		
		var recordObject = {imgId: new ObjectID(datas[iteration].id), extension: extension};
		
		// update the imgData list of new files in public/images/temp
		mongo.record(recordObject); // persistent copy
		newLocal.push(imageFolderPath+recordObject.imgId+recordObject.extension); // volatile copy

		// recurse
		multiLocal(iteration+1, datas, newLocal, callback);
	});
}

function clearLocal(path, res, callback) {
	var id = path.split('.')[0];
	mongo.remove({'imgId': new ObjectID(id)}, function(err) {
		if (err) callback(err);
		else {
			fs.unlink(imgFolderPath+path, function(err) {
				callback(err, id);
			});
		}
	});
}

/* GET home page. */
router.get('/', function(req, res, next) {
	// localImgs are in the formimg {imgId, extension}
	mongo.retrieve({}, function(localObj) {
		var localImgId = recordToArray(localObj).id;
		var localImgs = recordToArray(localObj).path;

		console.log(localImgId);

		// simply get all images from mongo not found in local
		// image objects are in the format {id, type, data}
		// only shows 20 images (including the images already in public)
		var options = {"limit": LOCAL_MAX-localObj.length};
		mongo.get({"$nin": localImgId}, options, function(err, datas) {
			if (err) console.log(err);

			var iteration = 0;
			var newLocal = []; // passed by reference

			multiLocal(iteration, datas, newLocal, function(err) {
				if (err) console.log(err);

				localImgs = localImgs.concat(newLocal);

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
					var extension = extensions[ftypeIndex];
					var imgPath = imgFolderPath+id+extension;
					// next create a local copy on the imgPath
					fs.writeFile(imgPath, data, function (err) {
						if (err) console.log(err);
						else {
							// finally once the local picture is made, 
							// store the mongo id and path of stored image 
							// to prevent retrieving duplicate images from mongo
							mongo.record({imgId: new ObjectID(id), extension: extension});
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
	clearLocal(path, res, function(err, id) {
		if (err) console.log(err);
		console.log('id removed from local: '+id);
		res.res.redirect('back');
	});
});

router.delete('/remove/:path', function(res, req, next) {
	var path = req.req.params.path;

	clearLocal(path, res, function(err, id) {
		if (err) console.log(err);
		if (id == null || typeof id==='undefined') return res.redirect('back');

		mongo.delete(id, function(response) {
			console.log(response);
			res.res.redirect('back');
		});
	});
});

module.exports = router;