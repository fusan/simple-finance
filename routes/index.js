var express = require('express');
var router = express.Router();
var fs =require('fs');
var d3 = require('d3');
var model = require('../model.js');
User = model.User;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'ざっくり財務', graph: ''});//グラフデータをビジュアライズ　graph に　d3　データを挿入
});

/* database insert */
router.post('/insert', function(req, res, next) {
  var newUser = new User(req.body);
  newUser.save(function(err) {
    if(err) throw err;
    //console.log('database insert ok');
  });
  next();
});

//json push
router.post('/insert', function(req, res) {
		//console.log(req.body['証券コード']);

    User.find({'証券コード': req.body.ticker}, function(err, data) {
    //console.log(JSON.stringify(data));
    fs.writeFile('data.json', JSON.stringify(data), function(err) {
        if(!err) {console.log('file exist');}
    });
    res.render('index', { title: '<div id="titleAni">ざっくり財務</div>', graph: 'd3-deta'});
  });
});

/* graph */
router.post('/graph', function(req, res) {
  //mongoose search deploy
  User.find({'証券コード': req.body.ticker}, function(err, data) {
    //array push
    var detaSet = [];
    for(var i=0, n= data.length; i< n; i++ ) {
      detaSet.push(data[i]['流動資産']);
    }

    //d3 exist
     res.render('index', { title: 'ざっくり財務', graph: '流動資産 ' + detaSet});//グラフデータをビジュアライズ　graph に　d3　データを挿入
  });
});

module.exports = router;
