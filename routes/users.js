var express = require('express');
var router = express.Router();

var mongo = require('../mongo');
var ObjectID = require('mongodb').ObjectID;

/* GET users listing. */
router.get('/', function(req, res, next) {
    var vm = {
		title: 'The Flash Gallery'
	};

	res.render('users', vm);
});

module.exports = router;