var express = require('express');
var fs = require('fs');

var mongo = require('../mongo');
var ObjectID = require('mongodb').ObjectID;

var router = express.Router();

router.get('/:id', function(req, res, next) {
    var vm = {
		title: 'The Flash Gallery'
	};

	res.render('imgDetail', vm);
});

module.exports = router;