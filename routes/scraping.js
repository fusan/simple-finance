var express = require('express');
var http = require('http');
var fs = require('fs');
var request = require("request");
var cheerio = require("cheerio");
var Promise = require('es6-promise').Promise;
var nimble = require('nimble');

var model = require('../Ymodel.js');
	Yahoo = model.Yahoo;

var yahoofinance = 'http://profile.yahoo.co.jp/consolidate/';

//個別データ取得
exports.scrapeOne = function (req) {
	var url = yahoofinance + req;
	//スクレイピング
	scrape(1,req,url);
}

//全データ取得
exports.scrapeAll = function (req) {
	var initial = 1000;
	var end = 10000;
	var promise = new Promise(function(resolve, reject){
			var urls = [];
			for(var i=initial;i<end;i++) {
				var url = {};
				url.url = yahoofinance + i; //url
				url.ticker = i; //証券コード
				urls.push(url)
			}
			resolve(urls);
		});

		promise.then(function(urls){
			for(var i=0,n=urls.length;i<n;i++) {
				scrape((end-1), urls[i].ticker,urls[i].url);
			}
		});

		promise.catch(function(error) {
			console.log(new ERROR(error));
		});
	}

//スクレピング　-> 完了通知のための引数　格納データの最大引数と現在の引数がマッチしたら完了通知モジュール
function scrape(dataLength, currentticker, url) {
	console.log(dataLength,currentticker);
	request({　uri: url },
		function(err, res, body) {
		//取得したページのbody部をパース
		var $ = cheerio.load(body);

		//yahooファイナンスからのスクレイピング
		Obj = yahooScrape($);
		

		//jsonファイル出力
		if(Obj != false) {
			console.log(Obj);
		
		//データベースと照合
		Yahoo.find({'証券コード': currentticker}, function(err, data) {
			var ObjSettlement = [];  //スクレピングオブジェクト
			var dbSettlement = [];   //データベース格納済み

			var Match = new Promise(function(resolve, reject){
				for(var i=0,n=Obj.length;i<n;i++) {
					 ObjSettlement.push(Obj[i]['決算期']);
					}
				
				for(var i=0,n=data.length;i<n;i++) {
					 dbSettlement.push(data[i]['決算期']);
					}

				//重複データを空文字列に変換
				for (var i = 0; i < dbSettlement.length; i++) {
					for (var j = 0; j < ObjSettlement.length; j++) {
						if(dbSettlement[i] == ObjSettlement[j]) {
							dbSettlement[i] = '';
							ObjSettlement[j] = '';
						}
					};
				};

				console.log('スクレイピングデータ: ' + ObjSettlement + ',格納ずみデータ: ' + dbSettlement);

				//更新データの抽出　-> 空文字列を弾く
				ObjSettlement = ObjSettlement.filter(function(d,i,self) {
					return d != '' ?  d : console.log('更新データなし');
				});
				resolve(ObjSettlement);
			});

			//データベース格納　-> jsonファイル生成
			Match.then(function(ObjSettlement) {
				if(dbSettlement.length == 0) {
					//データベース無しの場合
					for (var i = 0; i < Obj.length; i++) {
						var YDB = new Yahoo(Obj[i]);
						YDB.save(function(err) {
							if(err) throw err;
							Yahoo.find({'証券コード': currentticker}, function(err, data) {
								JSONFileGenerator(data);
							});
						});
					}
					if(dataLength == currentticker) {
						//完了通知　socket.ioを使うしかなにのかな 下記コメントを完了時に通知
					console.log('コメント「データ格納しました' + ObjSettlement+ '」');
					}
				} else {
					console.log(ObjSettlement[0]);
					//格納済みデータがある場合
					for (var i = 0; i < Obj.length; i++) {
						//更新データのみ格納
						if(Obj[i]['決算期'] == ObjSettlement[0]) {
							var YDB = new Yahoo(Obj[i]);
							YDB.save(function(err) {
							    if(err) throw err;
							    Yahoo.find({'証券コード': currentticker}, function(err, data) {
									JSONFileGenerator(data);
							   		});
								});
							}
						}
					if(dataLength == currentticker) {
						//完了通知　socket.ioを使うしかなにのかな 下記コメントを完了時に通知
						console.log('コメント「データ格納しました' + ObjSettlement[0] + '」');
					}
				}
			});

			Match.catch(function(err) {
					console.log(new ERROR(err));
				});	
			});	
			}
		}
	);
}

//jsonfile生成
function JSONFileGenerator(Obj) {
	//console.log(Obj);
	if(Obj != false) {
		console.log('checking');
		console.log(Obj[0]['証券コード']);
		fs.writeFile('./json/' + Obj[0]['証券コード'] + '.json', JSON.stringify(Obj), 'utf8', function(err) {
			fs.readFile('./json/' + Obj[0]['証券コード'] + '.json','utf8', function(err, data) {
				//if(!undefined) {console.log(JSON.parse(data));}　-> error: end of input
			});
		});
	}
}

//yahooファイナンス専用　DOM取得　＝＞　JSON出力
function yahooScrape($) {
	var company = $('.yjL').text();
	var ticker = company.slice(-5,-1);
	var settlementcheck = $('#right_col').find('table').eq(1).find('tr').eq(1).find('td').eq(1).text();

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