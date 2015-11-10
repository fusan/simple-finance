var express = require('express');
var http = require('http');
var fs = require('fs');
var request = require("request");
var cheerio = require("cheerio");

var model = require('../Ymodel.js');
	Yahoo = model.Yahoo;

var yahoofinance = 'http://profile.yahoo.co.jp/consolidate/';

//個別データ取得
exports.scrapeOne = function (req) {
	var url = yahoofinance + req;
	//スクレイピング
	scrape(req,url);
}

//全データ取得
exports.scrapeAll = function () {
	//console.log('全件取得開始');
	var initial = 1300;
	var end = 10000;
	var promise = new Promise(function(resolve, reject){
			var urls = [];
			for(var i=initial;i<end;i++) {
				var url = {};
				url.url = yahoofinance + i; //URL
				url.ticker = i;				//証券コード
				urls.push(url)
			}
			resolve(urls);
		});

		promise.then(function(urls){
			for(var i=0,n=urls.length;i<n;i++) {
				scrape(urls[i].ticker,urls[i].url);
			}
		});

		promise.catch(function(error) {
			console.log(new ERROR(error));
		});
	}

//スクレピング　-> 完了通知のための引数　格納データの最大引数と現在の引数がマッチしたら完了通知モジュール
function scrape(currentticker, url) {
	console.log(url,currentticker);
	request({　uri: url },
		function(err, res, body) {

		//DB挿入
		var promise = new Promise(function(resolve,reject) {
			//console.log(Obj);
			//取得したページのbody部をパース
			if(body) {
				var $ = cheerio.load(body);
			} else {
				return;
			}

			//yahooファイナンスからのスクレイピング　別のサイトのスクレイピングをするときはyahooScrape()を別なものにすれば良い。
			Obj = yahooScrape($);

			if(Obj != false) {
				for (var i=0,n=Obj.length;i<n;i++) {
					var conditions = {$and: [
							{"決算期": Obj[i]['決算期']},
							{"証券コード": Obj[i]['証券コード']}
						]};
					var doc = {$set: {
						"会社名": Obj[i]['会社名'],
						"証券コード": Obj[i]['証券コード'],
						'決算期': Obj[i]['決算期'],
						'会計方式': Obj[i]['会計方式'],
						'決算発表日': Obj[i]['決算発表日'],
						'決算月数': Obj[i]['決算月数'],
						"売上高": Obj[i]['売上高'],
						'営業利益': Obj[i]['営業利益'],
						'経常利益': Obj[i]['経常利益'],
						'当期利益': Obj[i]['当期利益'],
						'EPS（一株当たり利益）': Obj[i]['EPS（一株当たり利益）'],
						'調整一株当たり利益': Obj[i]['調整一株当たり利益'],
						'BPS（一株当たり純資産）': Obj[i]['BPS（一株当たり純資産）'],
						'総資産': Obj[i]['総資産'],
						'自己資本': Obj[i]['自己資本'],
						'資本金': Obj[i]['資本金'],
						'有利子負債': Obj[i]['有利子負債'],
						'自己資本比率': Obj[i]['自己資本比率'],
						'ROA（総資産利益率）': Obj[i]['ROA（総資産利益率）'],
						'ROE（自己資本利益率）': Obj[i]['ROE（自己資本利益率）'],
						'総資産経常利益率': Obj[i]['総資産経常利益率']
						}};
					var options = {upsert:true};

					//データベース格納
					Yahoo.update(conditions, doc, options, function(err, data) {
						console.log(data);  //{ ok: 1, nModified: 0, n: 1 }
					});
				}
			}
			resolve('ok');
		});

		//jsonファイル出力
		promise.then(function(value){
			Yahoo.find({"証券コード": currentticker}, function(err, data) {
				console.log(data); 		//jsonファイル生成前のデータの確認
				JSONFileGenerator(data);
			});
		});

		promise.catch(function(err) {
			console.log(err);
		});
	});
}

//jsonfile生成
function JSONFileGenerator(data) {
	var promise = new Promise(function(resolve,reject) {
		var jsons = [];
		for (var i=0,n=data.length;i<n;i++) {
			jsons.push(data[i]);
		}

		if(jsons.length > 2) {
			console.log(jsons);
			resolve(jsons);
		}
	});

	promise.then(function(value) {
		//console.log(value[0]);
		fs.writeFile('./json/' + value[0]['証券コード'] + '.json', JSON.stringify(value), 'utf8', function(err) {
			fs.readFile('./json/' + value[0]['証券コード'] + '.json','utf8', function(err, data) {
				//console.log(data);
			});
		});
	});
}

//yahooファイナンス専用　DOM取得　＝＞　JSON出力
function yahooScrape($) {
	var company = $('.yjL').text();
	var ticker = company.slice(-5,-1);
	var settlementcheck = $('#right_col').find('table').eq(1).find('tr').eq(1).find('td').eq(1).text();
	//console.log(company);

	if(company == '企業情報ページが見つかりません' || settlementcheck == '---') {
		return false ;
	} else {
		var settlement = $('#right_col').find('table').eq(1).find('tr').text();
		//開業文字で配列に変換
		var re = /\n/g;
		settlement = settlement.split(re);
		//空文字の除去
		for(var i=0,n=settlement.length;i<n;i++) {
			i % 4 == 0 ? settlement.splice(i,1): settlement[i] = settlement[i] ;
		}
		settlement = settlement.filter(function(element){return element !== undefined});

		//YFにプロパティを追記
		var Obj =[['会社名','証券コード'],[company,ticker],[company,ticker],[company,ticker]];
		for(var i=0,n=settlement.length;i<n;i++) {
			if(i % 4 === 0) {
				Obj[0].push(settlement[i]);
			} else if(i % 4 === 1) {
				Obj[1].push(settlement[i]);
			} else if(i % 4 === 2) {
				Obj[2].push(settlement[i]);
			} else if(i % 4 === 3) {
				Obj[3].push(settlement[i]);
			}
		}
		var lastObj = [];
		lastObj.push(Obj[0],Obj[1],Obj[2],Obj[3]);
		lastObj = ArrayToJson(lastObj);
		//console.log(lastObj);
		return lastObj;
	}
}

function ArrayToJson(array) {
	var jsons = [];
	for(var i=1;i< array.length;i++) {//最初の列は不要なので初期値iは1
		var json = {};//ループのたびに新しいJSONを生成 参照渡しを回避
		for(var j=0;j<array[i].length;j++) {
			json[array[0][j]] = array[i][j];
			}
		jsons.push(json);
	}
	return jsons
}
