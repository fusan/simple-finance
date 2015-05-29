var express = require('express');
var router = express.Router();
var http = require('http');
var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var Promise = require('es6-promise').Promise;

//module
var visualize = require('./d3');
var scraping = require('./scraping.js');

//database
var model = require('../model.js');
	User = model.User;
var model = require('../Ymodel.js');
	Yahoo = model.Yahoo;

// GET root
router.get('/', function(req, res) {
	res.render('promise',{title: 'Yahoo Scraping!', graph: '',input: ''});
	});

router.get('/:id(\\d+)', function(req, res){
	console.log(req.params.id);
	//差分のみ追記　fs.appendFile　かな？
	fs.readFile('./json/' + req.params.id + '.json', 'utf8', function(err, data) {
		res.send(data);
	});
});

router.get('/analytics', function(req, res) {
	Yahoo.find({}, function(err ,data) {
		//決算期順にソートして、ROEが成長しているかをチェック
		//ROE+
		var ROEArrays = [];
		for(var i=0,n=data.length; i<n; i++) {
			var ROEArray = {};
				ROEArray['自己資本比率'] =  data[i]['自己資本比率'];
				ROEArray['自己資本'] =  data[i]['自己資本'];
				ROEArray['総資産'] =  data[i]['総資産'];
				ROEArray['当期利益'] =  data[i]['当期利益'];
				ROEArray['売上高'] =  data[i]['売上高'];
				ROEArray['決算期'] =  data[i]['決算期'];
				ROEArray['証券コード'] = data[i]['証券コード'];
			ROEArrays.push(ROEArray);
			}	
		console.log(data.length);
		res.send(ROEArrays);
	});
});

/* 選択データ取得 */
router.get('/YFtoDB', function(req,res) {
	var cookie = req.cookies.update;
	if(cookie == '個別') {
		console.log(cookie);
	} else {
		scraping.scrapeOne(req.query.ticker);
		res.cookie('update', '個別', {maxAge: 1000 * 60 * 60 * 24});
	}
	res.render('promise', {title: 'Yahoo Scraping!', graph: '',input: ''});
});

/* 全データ取得 */
router.get('/YFtoDBtoAll', function(req,res) {
	var cookie = req.cookies.update;

	if(cookie == '個別') {
		console.log(cookie);
		res.send('not scraping!');
	} else {
		scraping.scrapeAll();// 重複データはscrapeing.jsで処理
		res.cookie('update', '個別', {maxAge: 1000 * 60 * 60 * 24});
		res.send('start scraping!');
	}
});

/* D３描画 */
router.post('/visualize', function(req, res) {
	//console.log(req.body.ticker);

	//DB呼び出し
	Yahoo.find({'証券コード': req.body.ticker}, function(err, data) {
		//console.log(data.length);

		//d３モジュールに渡す数値の成形
		if(data != '') {
			var company = data[0]['会社名'];
			var settlement = [];	//決算期
			var dataSet = [];		//数値
			var settlementItem = req.body.keyName;		//売上高、利益、ROE....

			for(var i=0,n=data.length;i<n;i++) {
				dataSet.push(data[i][settlementItem]);
				settlement.push(data[i]['決算期']);
			}
		}
		
    	var EmptyCaution = '<div id="caution">押してください</div>';

    	/* visualize */
    	if(data == '') {
	    		res.render('promise', {title: 'Yahoo Scraping!', graph: EmptyCaution, input: req.body.ticker});
	    	} else {
	    		visualize.jsdom(settlementItem,settlement,dataSet,company,req,res);
	    	}
  		});
	});

module.exports = router;