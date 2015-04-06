var express = require('express');
var router = express.Router();
var jsdom = require('jsdom');
var fs = require('fs');
var Promise = require('es6-promise').Promise;
var jquery = require('jquery');
var model = require('../model.js')
User = model.User;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();

/* GET users listing. */
router.get('/', function(req, res) {
	res.render('index2',{title: 'ざっくり財務２', graph: ''});
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
    res.render('index2', { title: '<div id="titleAni">ざっくり財務</div>', graph: req.body.ticker});
  });
});

/* Graph2 post listing */
router.post('/graph2', function(req, res) {
//console.log(req.body);
var dataSet = [];
var dataSetYear = [];
var item = req.body.item;

User.find({'証券コード': req.body.ticker}, function(err, data) {
	//console.log(data);
	for(var i=0,n=data.length; i<n; i++ ) {
		var stockData = data[i][item];
		(stockData.length > 3) ? stockData = stockData * Math.pow(.1, stockData.length - 3) :  stockData = stockData;
		stockData = parseInt(stockData);
		dataSet.push(stockData);
	}
	//console.log(dataSet);
	for(var i=0,n=data.length; i<n; i++ ) {
		dataSetYear.push(data[i]['決算期']);
	}

	fs.writeFile('data.json', JSON.stringify(dataSet), function(err) {
        if(!err) {console.log('file exist');}
        fs.readFile('data.json', 'utf8', function(err, data) {
        	//console.log(data);
        });
    });
});

jsdom.env(
	  '<div id="svg"><div id="svgInner"></div></div>',
	  ["http://code.jquery.com/jquery.js","http://d3js.org/d3.v3.min.js"],
	  function (errors, window) {

	  	var svg = window.d3.select("#svg")
			.append('svg')
			.attr({
				x: 0,
				y: 0,
				width: 100 + '%',
				height: dataSet.length * 30 + 90
			})

		svg.selectAll('rect')
			.data(dataSet)
			.enter()
			.append('rect')
			.attr({
				x: 0,
				y:function(d, i) { 
					return i*30;
				},
				height: 20,
				width: function(d ,i) {
					return d;
				},
				fill: "rgba(0,0,0,.16)"
			})
			.attr({transform: 'translate(20,0)'})

		svg.selectAll('text')
			.data(dataSet)
			.enter()
			.append('text')
			.attr({
				'font-size': '.8em',
				x: function(d, i) {
					return d;
				},
				y: function(d, i) {
					return i * 30;
				},
				fill: 'gray'
			})
			.attr({transform: 'translate(24,16)'})
			.text(function(d, i) {
				return d;
			})

		svg.selectAll('text2')
			.data(dataSetYear)
			.enter()
			.append('text')
			.attr({
				'font-size': '.56em',
				x: 4,
				y: function(d, i) {
					return i * 30;
				},
				fill: 'black'
			})
			.attr({transform: 'translate(20,16)'})
			.text(function(d, i) {
				return d;
			})

		var Xscale = window.d3.scale.linear()
			.domain([0, Math.max.apply(null, dataSet)])
			.range([0, Math.max.apply(null, dataSet)])

		svg.append('g')
			.attr({
					x: 0,
					y: 0
			})
			.attr({'class': 'axis'})
			.attr({transform: 'translate(20,100)'})
			.call(window.d3.svg.axis()
			.scale(Xscale)
			.orient('top')
			)

		window.d3.select("#svgInner")
			.append('svg')
			.attr({
				width: 100 + '%',
				height: '30px'
			})
			.append('text')
			.attr({
				x: 0,
				y:20
			})
			.text(item)

		//console.log(window.$('#svg').html());
	  	res.render('index2',{title: 'ざっくり財務２', graph: window.document.getElementById('svg').innerHTML});
	  }
	);
});

var promise = new Promise(function(resolve, reject){
	resolve(20);
});
//var promise = Promise.resolve(20); こちらでもok!

promise.then(function(value){
	//console.log(value);
	return value + 1;
}).catch(function(error) {
	console.log(new ERROR(error));
}).then(function(value) {
	//console.log(value);
});

module.exports = router;