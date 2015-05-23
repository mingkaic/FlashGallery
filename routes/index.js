var express = require('express');
var fs = require('fs');
var multipart = require('connect-multiparty');

var multipartMiddleware = multipart();
var router = express.Router();

var imgFolderPath = __dirname + "/../public/images/";

var makeid = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

/* GET home page. */
router.get('/', function(req, res, next) {
	fs.readdir(imgFolderPath, function(err, files) {
		var imgUrl = [];
		var length = files.length;
		for (var i = 0; i < length; i++) {
			imgUrl.push("/images/"+files[i]);
		}
		var vm = {
			title: 'The Flash Gallery',
			imageUrl: imgUrl
		};

		res.render('index', vm);
	});
});

router.post('/uploads', multipartMiddleware, function(req, res, next) {
	fs.readFile(req.files.displayImage.path, function (err, data) {
		var imgPath = imgFolderPath+makeid()+".jpg";
		fs.writeFile(imgPath, data, function (err) {
			if (err) console.log(err);
			delete req.files;
			res.redirect("back");
		});
	});
});

module.exports = router;
