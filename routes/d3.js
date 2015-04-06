var jsdom = require('jsdom');
var jquery = require('jquery');
var d3 = require('d3');
var fs = require('fs');

exports.jsdom = function(settlementItem,settlement,dataSet,company,req,res) {
	jsdom.env(
	  '<div id="data"></div>',
	  ["http://d3js.org/d3.v3.min.js"],
	  function (errors, window) {

	  	//文字列を整数に
			function StringToNumber(array) {
				//console.log(array);
				var newData = [];
				var regexp =  /百万円|%|,/gi;
				for(var i=0; i< array.length; i++) {
					//console.log(array[i].replace(regexp,''));
					newData.push(parseFloat(array[i].replace(regexp,'')));
					}
				return  newData;
				}
		//桁数を整える スクロールしないで見るための処理
			function cutCharactors(array) {
				//console.log(array);
				var newArray = [];
				var maxChar = Math.max.apply(null, array);//配列の最大値
				var characters = comma(maxChar.toString());//小数点が含まれる場合の桁数調整
				var adjustCharacters = characters - 3;//桁詰め数
				//console.log('調整桁数 : ' + adjustCharacters);
				for(var i=0,n=array.length;i<n;i++) {
					array[i] = array[i] * Math.pow(0.1,adjustCharacters);
					newArray.push(array[i]);
				}
				return  newArray;
			}
		//小数点以下の桁数を取得
			function comma(str) {
				var numCharacters;
				var regexp = '.';
				var num = str.length;//全桁数
				if(str.indexOf(regexp) == -1) {
					numCharacters = num;
				} else {
					var integer = str.split(regexp)[0].length;
					//var smallNum = str.split(regexp)[1].length;//小数点以下の桁数
					numCharacters = num - (num - integer);
				}
				return numCharacters;
			}

			BarChart(settlementItem,settlement,cutCharactors(StringToNumber(dataSet)),company);

	  	//D３ bar chart exist
			function BarChart(settlementItem,settlement,dataSet,company) {

				//var unit = dataObject[3];

				var yPosition =[];
				var barWidth = 40;
				var offsetx = 30;
				var offsety = 20;
				var titleLength = 100;
				var titleHeight = 100;//svgのpadding-top
				var chartHeight = 400;
				var Scale = 1;
				var dataHieght = Math.max.apply(null, dataSet);

				if(dataHieght > chartHeight) { Scale = chartHeight / dataHieght;}
				//console.log(dataSet);

				//グラフ生成
				var Bar = window.d3.select('#data')
							.append('svg')
							.attr({
								x:0,
								y:0,
								width:dataSet.length * 80,
								height:Math.max.apply(null, dataSet) * Scale + titleHeight,
								class: 'bar'
							})
					Bar.selectAll('rect')
						.data(dataSet)
						.enter()
						.append('rect')
						.attr({
							x:function(d, i) {
								//console.log(i * barWidth * 1.2);
								return i * barWidth * 1.2;
							},
							y: function(d, i) {
								
								return dataHieght - d;
							},
							width: barWidth,
							height: function(d, i) {
								//修正　長さの縮尺
								return d;
							},
							transform: 'translate(40,'+(titleHeight -10)+')',
							fill: 'red',
							'box-shadow': '0 0 1px black',
							class: 'rect'
						})

					Bar.selectAll('text')
						.data(dataSet)
						.enter()
						.append('text')
						.text(function(d,i) {
							return parseInt(d);
						})
						.attr({
							x:function(d,i) {
								return i * barWidth * 1.2;
							},
							y: function(d,i) {
								yPosition.push(d);
								return dataHieght + titleHeight - d + 10;
							},
							fill: 'white',
							transform: 'translate(' + barWidth * 1.1  + ', 0)'
						})

					Bar.selectAll('settlement')
						.data(settlement)
						.enter()
						.append('text')
						.attr({
							x:function(d,i) {
								return i * barWidth * 1.2 + 50;
							},
							y:function(d,i) {
								return dataHieght + titleHeight - yPosition[i] + 30;
							},
							textLength: titleLength,
							fill:'white',
							'font-size': '20',
							'writing-mode': "tb-rl",
							'glyph-orientation-vertical': 'auto',
							'glyph-orientation-vertical': '90',
							transform: 'translate(' + barWidth + ',0)',
							transform: 'rotate(90deg)'
						})
						.text(function(d,i) {
							return d;
						})
						
					Bar.append('text')
						.attr({
							x:0,
							y:60,
							height: '30px',
							width: dataSet.length * 80,
							fill: 'black',
							transform: 'translate(' + barWidth + ', 0)',
							transform: 'scale(.6)'
						})
						.text(settlementItem)
						
					//if(!$('#title').text() || $('#title').children().length == 1) {
					Bar.append('text')
						.attr({
							x:0,
							y:32,
							height: '30px',
							width: '140px',
							fill: 'gray',
							transform: 'scale(.6)'
						})
						.text(company)
					//}

					var Yscale = window.d3.scale.linear()
						.domain([ Math.max.apply(null, dataSet), 0])
						.range([ 0, Math.max.apply(null, dataSet) * Scale ])

					Bar.append('g')
						.attr({
								x: 0,
								y: dataHieght
						})
						.attr({'class': 'axis'})
						.attr({transform: 'translate(32,'+(titleHeight -10)+')'})
						.call(window.d3.svg.axis()
						.scale(Yscale)
						.orient('left')
						)
						.append('text')
						.attr({
							'font-size': 10,
							transform: 'translate(-30, -10)'
						})
						.text('百万円')//unit + 

					//erase(Bar,dataSet);
				}

		res.render('promise',{title: 'Yahoo Scraping!', graph: window.document.getElementById('data').innerHTML, input: ''});
	});
}
