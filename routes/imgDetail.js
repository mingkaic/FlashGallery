var express = require('express');
var fs = require('fs');

var mongo = require('../mongo');
var ObjectID = require('mongodb').ObjectID;

var router = express.Router();

router.get('/', function(req, res, next) {
	var path = req.query.valid;
	
	console.log('path received on detail as '+path);
	
    var vm = {
		title: 'The Flash Gallery',
		imgPath: path
	};

	res.render('imgDetail', vm);
});

module.exports = router;