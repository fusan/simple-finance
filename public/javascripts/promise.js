$(function(){
	//グラフエリアの移動
		$('#data').on(
				'mousedown','.graph', function(e) {
					this.initX = parseInt($(this).css('margin-left'));
					this.startX = e.pageX;
					this.initY = parseInt($(this).css('margin-top'));
					this.startY = e.pageY;
					$(this).on('mousemove', function(e) {
						this.moveX = this.startX -e.pageX;
						this.currentX = this.initX - this.moveX;
						this.moveY = this.startY -e.pageY;
						this.currentY = this.initY - this.moveY;
						$(this).css({'margin-left': this.currentX, 'margin-top': this.currentY});
					});
				})
				.on('mouseup','.graph', function(e) {
					$(this).off('mousemove');
					$(this).css({'margin-left': this.currentX, 'margin-top': this.currentY});
				})
				.on('mouseenter', '.graph', function(e) {
					$(this).css({cursor: 'move'});
					//console.log('enter' + e.pageX);
					$(this).on('mousedown', function(){
						$(this).css({cursor: 'move'});
					});
				});
	//データフォーム
	$('#scrapeOne').on('click', function() {
		if($('#dataInput').css('margin-top') == '0px') {
			$('#dataInput').animate({
				'margin-top': '10px',
				height: '30px'
			},600,'easeOutQuart');
		} else {
			$('#dataInput').animate({
				'margin-top': 0,
				height: 0
			});
		}
	});
	

	//更新処理　-> 毎日更新　-> 更新があればプッシュ通知する。　証券番号を表示
	var initialTime = new Date(2015,1,3,1).getHours();	//基準日時　2015/1/3/2:00
	var now = new Date().getHours();					//現在時刻 -> テストする際はinitialTimeの７日後を指定する。
	console.log(now - initialTime,now, initialTime);

	if ((now - initialTime) == 0)　{//テストの際は　条件式にtrueに
		//通知
		console.log('更新作業');
		$('#input').parent().append('<span id="update">更新開始</span>')
		push();
		function push() {
			$('#update').css({
				position: 'fixed',
				top: 10,
				left: $('#explain').offset().left,
				width: 100,
				height: 30,
				color: 'red',
				'font-size': 12,
				opacity: 0.3
			}).animate({
				opacity: 1 
			},1600, 'swing')
			.animate({
				opacity: 0
			},1600, 'swing');
		}
			
		//データベース更新作業
		var getYahoo = $.ajax({
				url: '/YFtoDBtoAll',
				type: 'GET'
			});
		getYahoo.done(function(data) {
			console.log(this.xhr);
			console.log(data);
		});
	}
	
	
	//解説書 -> ヒント集
	$('#explain').on('click', function() {//上から降りてくるアニメーション　を加える。
		if($('#explainContent').length == 0) {
			$(this).parent().append('<div id="explainContent">解説です。</div>');
			$('#explainContent').css({
				position: 'fixed',
				top: 0,
				left: $('#explain').offset().left + $('#explain').width(),
				padding: 4,
				width: 400,
				height: 200,
				'box-shadow': '0 0 1px gray',
				background: 'white'
			}).animate({
				top: $('#explain').offset().top + $('#explain').height()
			},200,'swing');
			console.log('解説表示');
		} else {
			$('#explainContent').fadeOut(500);
			setTimeout(function() {
				$('#explainContent').remove();
			},550);
		}
	});

	//グラフ選択
	var compare = [];
	$('.rect').on('mouseenter', function() {

		var index = $('.rect').index(this);
		var num = parseInt($(this).attr('height'));
			compare.push(index, num);
			tooltip(this,compare);

			console.log(index, num);
		});

		//再入力のチップ
		var $selectData = $('#selectData');
			$('#caution').css({
				position: 'absolute',
				top: $selectData.offset().top,
				left:$selectData.offset().left + $selectData.width(),
				width:$selectData.width()
			});
		});

		//tooltip
		var tooltipData = [{JQ: '#alldata', text:'全データをデータベースに' },
							{JQ: '#selectData', text:'４桁のコード' },
							{JQ: '#visualize', text:'データベースチェック用です'},
							{JQ: '#analytics', text: 'ROEを解析します。'}
							];

		for(var i=0,n=tooltipData.length;i<n;i++) {
			tooltip(tooltipData[i].JQ,tooltipData[i].text);
		}

		function tooltip(JQ,text) {
			$(JQ).on({
			'mouseenter': function(e) {
				
				$(this).parent().append('<span id="tooltip">'+ text +'</span>');
				$('#tooltip').css({
					opacity: 0,
					position:'relative',
					top: '.5rem',
					left: 0,
					width:'auto',
					height: '1rem',
					color: 'black',
					'font-size': '.5rem',
					
				}).
				animate({
					opacity: 1,
					position:'relative',
					top: 0,
					left: 0,
					border: '1px solid black'
				},500);
			},
			'mouseleave': function(e) {
				$('#tooltip').fadeOut(1000).remove();
			}
			});
		}

		//D3
		document.getElementById('select').addEventListener('change',create,false);
		document.getElementById('input').addEventListener('change',create,false);
		document.getElementById('analytics').addEventListener('click',RoeCreate,false);

		/* 分析 (ROE */
		function RoeCreate() {
			console.log('rannking');
			var ROEarray =[];//ROEデータ
			var detailChart = $.ajax({
				url: '/analytics',
				type: 'GET'
			});

			//数値に変換
			detailChart.done(function(data) {
				for(var i=0,n=data.length;i<n;i++) {
					for (key in data[i]) {
						var regexp =  /百万円|%|,/gi;
						data[i][key] = parseInt(data[i][key].replace(regexp,''));
						//console.log(key + ':' + data[0][key]);
					}
				}
			});

			//財務データ整形　＊本当はデータベースとjsonファイルに突っ込む時にやる作業かな？
			detailChart.done(function(data) {
				for(var i=0,n=data.length;i<n;i++) {
					ROE = {};//積極的に　上手に経営しているので　結果に繋がってるいう　そうゆう指標ってことかぬ
					ROE['売上高利益率'] = data[i]['当期利益'] / data[i]['売上高']//売上高利益率　上手くやってるぬ
					ROE['総資産回転率'] = data[i]['売上高'] / data[i]['総資産']//総資産回転率　結果に繋がってるね
					ROE['財務レバレッジ'] = data[i]['総資産']　/ data[i]['自己資本']//財務レバレッジ　積極的ね　
					ROE['決算期'] = data[i]['決算期'];
					ROE['自己資本比率'] =  data[i]['自己資本比率'];
					ROE['自己資本'] =  data[i]['自己資本'];
					ROE['総資産'] =  data[i]['総資産'];
					ROE['当期利益'] =  data[i]['当期利益'];
					ROE['売上高'] =  data[i]['売上高'];
					ROE['証券コード'] = data[i]['証券コード'];
					ROEarray.push(ROE);
				}
			});

			//d３生成
			detailChart.done(function(data) {
				
				ROEarray = ROEarray.sort(function(a,b) {
					var asettlment = a['決算期'];
					var bsettlment = b['決算期'];
					if( asettlment < bsettlment ) return -1;
					if( asettlment > bsettlment ) return 1;
					return 0;   
				});

				console.log(ROEarray);



				var padding = 40;
				var barWidth = 100;
				var scale = .135;
				var fontSize = 9;
				var svgHeight = 350;

				var ROE = d3.select('#roe')
						.append('svg')
						.attr({
							x:0,
							y:0,
							width: '100%',
							height: svgHeight,
							class: 'graph'
						})

				erase(ROE,ROEarray);

			//売上高利益率
				var netIncomeText = ROE.selectAll('netIncomeText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:function(d,i) {
							return  svgHeight/2  - d['当期利益'] * Math.pow(scale, 3) + fontSize;
						},
						width: 100,
						height:100,
						fill: 'none',
						'font-size': fontSize
					})
					.text(function(d,i) {
						console.log(d);
						return '当期利益　' + d['当期利益'];
					})

				ROE.selectAll('netIncome')
					.data(ROEarray)
					.enter()
					.append('rect')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:function(d,i) {
							return  svgHeight/2  - d['当期利益'] * Math.pow(scale, 3);
						},
						width: barWidth,
						height: function(d,i) {
							return d['当期利益'] * Math.pow(scale, 3) ;
						},
						fill: 'rgba(0,0,0,.16)'
					})
					.on({
						'mouseenter': function() {
							netIncomeText
							.transition(1000)
							.attr({
								fill: 'black',
								transform: 'translate(0, -' + fontSize + ')'
							})
						},
						'mouseleave': function() {
							netIncomeText
							.transition()
							.attr({
								fill: 'none',
								transform: 'translate(0,0)'
							})
						}
					})

					
				//売上高
				ROE.selectAll('sales')
					.data(ROEarray)
					.enter()
					.append('rect')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:function(d,i) {
							return  svgHeight/2;
						},
						width: barWidth,
						height: function(d,i) {
							return d['売上高'] * Math.pow(scale, 4) ;
						},
						fill: 'rgba(0,0,0,.32)'
					})

				ROE.selectAll('salesText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:function(d,i) {
							return  svgHeight/2 + d['売上高'] * Math.pow(scale, 4) + fontSize;
						},
						width: barWidth,
						height: function(d,i) {
							return d['売上高'] * Math.pow(scale, 4) ;
						},
						fill: 'black',
						'font-size': fontSize
					})
					.text(function(d,i) {
						return '売上高　' + d['売上高'];
					})

			//総資産回転率
				var sales2Text = ROE.selectAll('sales2Text')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 1 + (padding + barWidth) * i * ROEarray.length + 20;
						},
						y:function(d,i) {
							return  svgHeight/2  - d['売上高'] * Math.pow(scale, 4) -2;
						},
						width: 100,
						height:100,
						fill: 'black',
						'font-size': fontSize
					})
					.text(function(d,i) {
						return '売上高　' + d['売上高'];
					})
				ROE.selectAll('sales2')
					.data(ROEarray)
					.enter()
					.append('rect')
					.attr({
						x:function(d,i) {
							return barWidth * 1 + (padding + barWidth) * i * ROEarray.length + 20;
						},
						y:function(d,i) {
							return  svgHeight/2  - d['売上高'] * Math.pow(scale, 4);
						},
						width: barWidth,
						height: function(d,i) {
							return d['売上高'] * Math.pow(scale, 4) ;
						},
						fill: 'rgba(0,0,0,.16)'
					})
					.on({
						'mouseenter': function() {
							sales2Text
							.transition(1000)
							.attr({
								fill: 'black',
								transform: 'translate(0, -' + fontSize + ')'
							})
						},
						'mouseleave': function() {
							sales2Text
							.transition()
							.attr({
								fill: 'none',
								transform: 'translate(0,0)'
							})
						}
					})

				ROE.selectAll('asset')
					.data(ROEarray)
					.enter()
					.append('rect')
					.attr({
						x:function(d,i) {
							return barWidth * 1 + (padding + barWidth) * i * ROEarray.length + 20;
						},
						y:function(d,i) {
							return  svgHeight/2;
						},
						width: barWidth,
						height: function(d,i) {
							return d['総資産'] * Math.pow(scale, 4) ;
						},
						fill: 'rgba(0,0,0,.32)'
					})

				ROE.selectAll('assetText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 1 + (padding + barWidth) * i * ROEarray.length + 20;
						},
						y:function(d,i) {
							return  svgHeight/2 + d['総資産'] * Math.pow(scale, 4) + fontSize;
						},
						fill: 'black',
						'font-size': fontSize
					})
					.text(function(d,i) {
						return '総資産　' + d['総資産'];
					})
			//財務レバレッジ比率
				ROE.selectAll('assset')
					.data(ROEarray)
					.enter()
					.append('rect')
					.attr({
						x:function(d,i) {
							return barWidth * 2 + (padding + barWidth) * i * ROEarray.length + 40;
						},
						y:function(d,i) {
							return  svgHeight/2  - d['総資産'] * Math.pow(scale, 4);
						},
						width: barWidth,
						height: function(d,i) {
							return d['総資産'] * Math.pow(scale, 4) ;
						},
						fill: 'rgba(0,0,20,.16)'
					})
				ROE.selectAll('asset2Text')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 2 + (padding + barWidth) * i * ROEarray.length + 40;
						},
						y:function(d,i) {
							return  svgHeight/2  - d['総資産'] * Math.pow(scale, 4);
						},
						width: 100,
						height:100,
						fill: 'black',
						'font-size': fontSize
					})
					.text(function(d,i) {
						return '総資産　' + d['総資産'];
					})

				ROE.selectAll('equity')
					.data(ROEarray)
					.enter()
					.append('rect')
					.attr({
						x:function(d,i) {
							return barWidth * 2 + (padding + barWidth) * i * ROEarray.length + 40;
						},
						y:function(d,i) {
							return  svgHeight/2;
						},
						width: barWidth,
						height: function(d,i) {
							return d['自己資本'] * Math.pow(scale, 4) ;
						},
						fill: 'rgba(0,0,20,.32)'
					})
				ROE.selectAll('equityText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 2 + (padding + barWidth) * i * ROEarray.length + 40;
						},
						y:function(d,i) {
							return  svgHeight/2 + d['自己資本'] * Math.pow(scale, 4) + fontSize;
						},
						fill: 'black',
						'font-size': fontSize
					})
					.text(function(d,i) {
						return '自己資本　' + d['自己資本'];
					})

				//指標
				ROE.selectAll('totalAssetTurnoverText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 1 + (padding + barWidth) * i * ROEarray.length + 20;
						},
						y:function(d,i) {
							return  svgHeight/2 - 2;
						},
						fill: 'rgba(100,100,100,1)',
						'font-size': fontSize * 1.5
					})
					.text(function(d,i) {
						return '総資産回転率';
					})
				ROE.selectAll('totalAssetTurnoverText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 1 + (padding + barWidth) * i * ROEarray.length + 20;
						},
						y:function(d,i) {
							return  svgHeight/2 + fontSize * 1.6;
						},
						fill: 'white',
						'font-size': fontSize * 1.5
					})
					.text(function(d,i) {
						return (d['総資産回転率'] * 100).toFixed(2) + '%';
					})

				ROE.selectAll('financialLeverageText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 2 + (padding + barWidth) * i * ROEarray.length + 40;
						},
						y:function(d,i) {
							return  svgHeight/2 - 2;
						},
						fill: 'rgba(100,100,100,1)',
						'font-size': fontSize * 1.5
					})
					.text(function(d,i) {
						return '財務レバレッジ';
					})
				ROE.selectAll('financialLeverageText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return barWidth * 2 + (padding + barWidth) * i * ROEarray.length + 40;
						},
						y:function(d,i) {
							return  svgHeight/2 + fontSize *1.6;
						},
						fill: 'white',
						'font-size': fontSize * 1.5
					})
					.text(function(d,i) {
						return (d['財務レバレッジ'] * 100).toFixed(2) + '%';
					})

				ROE.selectAll('netIncomeRtioText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:function(d,i) {
							return  svgHeight/2 - 2;
						},
						fill: 'rgba(100,100,100,1)',
						'font-size': fontSize * 1.5,
						class: 'netIncome'
					})
					.text(function(d,i) {
						console.log(d);
						return '売上高利益率';
					})
				ROE.selectAll('netIncomeRtioText')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:function(d,i) {
							return  svgHeight/2 + fontSize * 1.6;
						},
						fill: 'white',
						'font-size': fontSize * 1.5,
						class: 'netIncome'
					})
					.text(function(d,i) {
						console.log(d);
						return (d['売上高利益率'] * 100).toFixed(2) + '%';
					})

				ROE.selectAll('roe')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:40,
						fill: 'black',
						'font-size': fontSize * 1.5
					})
					.text(function(d,i) {
						return 'ROE ' + (d['当期利益']/d['自己資本'] * 100).toFixed(2) + '%';
					})
				ROE.selectAll('settlement')
					.data(ROEarray)
					.enter()
					.append('text')
					.attr({
						x:function(d,i) {
							return (padding + barWidth) * i * ROEarray.length;
						},
						y:20,
						fill: 'black',
						'font-size': fontSize * 1.5
					})
					.text(function(d,i) {
						return d['決算期'];
					})

				console.log('完了');
			});

			detailChart.fail(function(data) {
					console.log('err');
				});

			//合格した配列をランキング
				//直近のROEの高い順、直近３カ月の成長が高い、＊平均値を算出してブレが大きくない会社を抽出

			//配列内入れるのminとmaxのdiffを取得し用意したオブジェクトに格納sる 
			//var ROE = {}; ROE.range = min - max; ROE.value = [];
		}

		/* ダイレクト描画　*/
		function create() {
				var ticker = document.getElementById('input').value;
				var manageIndex = document.getElementById('select').value;
				var fileUrl = '/' + ticker;

				var chart = $.ajax({
					url: fileUrl,
					type: 'GET',
					dataType: 'json'
				});

				chart.done(function(data) {
					console.log(data);
					var keyArray = [];
						for(var key in data[0]) {
							if(/%/.test(data[0][key])) {
								keyArray.push(key);
							}
						}

					var dataSet = mainDataController(data,manageIndex);
					console.log(dataSet, manageIndex, keyArray);
					keyArray.indexOf(manageIndex) == -1 ? BarChart(dataSet) : circle(dataSet);
				});

				chart.fail(function(data) {
					alert('会社データはありません');
					console.log('err');
				});
			}

	/* 描画前のデータ成形 */
		function mainDataController(array,title) {
				//console.log(array[0]);
				var dataObject = [];
				var company = array[0]['会社名'];
				var dataSet = [];//D３用データ配
				var settlement = [];//決算期
				var Title = title;//ROE、売上高など
				var unit;//単位

					//console.log(array);
				for (var i = 0; i < array.length; i++) {
					dataSet.push(array[i][Title]);
					settlement.push(array[i]['決算期']);
				};
				
				settlement = settlementCharChange(settlement);//月　→　／
					//console.log(dataSet);
				dataSet = StringToNumber(dataSet);
					//console.log(dataSet);
				unit = unitCalc(dataSet);
				dataSet = cutCharactors(dataSet);
					//console.log(dataSet);
				dataObject.push(dataSet.sort(),settlement.sort(),Title,unit,company);//データ、決算期タイトル、指標（ROE..)、グラフの単位
					//console.log(dataObject);
				return dataObject;
			}
		function settlementCharChange(array) {
				var newArray = [];
				var str = '年';
				var str2 = '月期';
				for(var i=0,n=array.length;i<n;i++) {
					array[i] = array[i].replace(str,'/');
					array[i] = array[i].replace(str2,'');
					newArray.push(array[i]);
				}
				return newArray;
			}
		//配列をオブジェクトに格納する 参照渡し　二重for文
		/* [ [ '売上高','営業利益' ],[ '443,985百万円','31,794百万円'],[ '419,390百万円','24,564百万円'],[ '392,468百万円','22,009百万円'] ] => [ {'売上高': '443,985百万円','営業利益': '31,794百万円'},{ '売上高': '419,390百万円','営業利益': '24,564百万円'},{ '売上高': '392,468百万円','営業利益': '22,009百万円'} ] */
		function ArrayToJson(array) {
				var jsons = [];
				for(var i=1;i< array.length;i++) {//最初の列は不要なので初期値iは1
					var json = {};//ループのたびに新しいJSONを生成 参照渡しを回避
					for(var j=0;j<array[i].length;j++) {
						json[array[0][j]] = array[i][j];
					}
					jsons.push(json);
				}
				return jsons;
			}

		//文字列を整数に
		function StringToNumber(array) {
				//console.log(array);
				var newData = [];
				var regexp =  /百万円|%|,/gi;
				for(var i=0; i< array.length; i++) {
					//console.log(array[i].replace(regexp,''));
					newData.push(parseFloat(array[i].replace(regexp,'')));
					}
				console.log(newData);
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
		//単位の算出
		function unitCalc(array) {
				var charNum;
				var unit;
				var maxChar = Math.max.apply(null, array);//配列の最大値
				var characters = comma(maxChar.toString());
				console.log(characters);
				characters > 3 ? unit = unitToFigure((Math.pow(10,characters - 3))) : unit = unitToFigure(0);
				return unit;
			}

		function unitToFigure(unit) {
			var figure;
			if(unit >= 100000) {
				figure = '千億円';
			} else if(unit >= 1000 && unit < 100000) {
				figure = '十億円';
			} else if(unit < 1000) {
				figure = '百万円';
			}
			return figure;
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

	/* 描画 */

		function BarChart(dataObject) {
				console.log(dataObject);
				var dataSet = dataObject[0];
				var settlement = dataObject[1];
				var title = dataObject[2];
				var unit = dataObject[3];
				var company = dataObject[4];
				var yPosition =[];

				var barWidth = 40;
				var offsetx = 30;
				var offsety = 20;
				var titleLength = 100;
				var titleHeight = 100;//svgのpadding-top
				var dataHieght = Math.max.apply(null, dataSet);

				console.log(dataSet,settlement);

				//グラフ生成
				var Bar = d3.select('#data')
							.append('svg')
							.attr({
								x:0,
								y:0,
								width:dataSet.length * 80,
								height:dataHieght + titleHeight + offsety * 2,
								class: 'graph'
							})
							/*.on({
								"mousedown":function(){
									console.log(d3.select(this)[0]);
									d3.select(this).attr("opacity",0.7);},
						    	"mouseup":function(){d3.select(this).attr("opacity",1.0);}
						    })*/
					
					Bar.selectAll('rect')
						.data(dataSet)
						.enter()
						.append('rect')
						.attr({
							x:function(d, i) {
								return i * barWidth * 1.2;
							},
							y: dataHieght,
							width: barWidth,
							height: 0, 
							transform: 'translate(40,' + titleHeight + ')',
							class: 'rect'
						})
						.transition()
						.ease('cubic')
						.attr({
							y: function(d, i) {
								return d < 0 ? dataHieght : dataHieght - d;	
							},
							height: function(d, i) {
								return d < 0 ? -d : d;
							},
							fill: function(d, i) {
								return d < 0 ? 'blue' : 'red';	
							},
							class:'hoge'
						})
					Bar.selectAll('text')
						.data(dataSet)
						.enter()
						.append('text')
						.text(function(d,i) {
							 return d < 0 ? parseInt(-d) : parseInt(d);
						})
						.attr({
							x:function(d,i) {
								return i * barWidth * 1.2;
							},
							y: function(d,i) {
								yPosition.push(d);
								return d < 0 ? dataHieght+ titleHeight + offsety : dataHieght + titleHeight - d + offsety;
							},
							fill: function(d,i) {
								return 'white';
							},
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
							fill: 'none',
						})
						.transition(1000)
						.delay(1000)
						.attr({
							x:0,
							y:60,
							height: '30px',
							width: dataSet.length * 80,
							fill: 'black',
							transform: 'translate(' + barWidth *1.2 + ', 0)'
						})
						.transition(1000)
						.attr({
							transform: 'translate(' + barWidth + ', 0)',
							transform: 'scale(.6)'
						})
						.text(title)
						
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

					var Yscale = d3.scale.linear()
						.domain([ dataHieght, 0])
						.range([ 0, dataHieght ])

					Bar.append('g')
						.attr({
								x: 0,
								y: dataHieght
						})
						.attr({'class': 'axis'})
						.attr({transform: 'translate(32,'+ titleHeight + ')'})
						.call(d3.svg.axis()
							.scale(Yscale)
							.orient('left')
							.ticks(4)
						)
						.append('text')
						.attr({
							'font-size': 10,
							transform: 'translate(-30, -10)'
						})
						.text(unit)
						.attr({
							x:0,
							y:function(d,i) {
								//すべての数値がマイナスの時だけ配置を変える
								for(var i=0,n=dataSet.length;i<n;i++) {
									if(dataSet[i] > 0) {return 0;}
								}
								return dataHieght;
							}
						})
					
					erase(Bar,dataSet);
				}
//グラフ削除
function erase(svg,array) {
	document.getElementById('erase').addEventListener('click',function() {
			svg.append('text')
			.attr({
				x:array.length * 60,
				y:24,
				height: '30px',
				width: '30px',
				fill: 'gray',
				transform: 'scale(1)',
				class: 'close'
			})
			.text('✖️')
			$('.close').on('click', function() {
				//console.log('close');
				$(this).parent().remove();
				$('.close').remove();
				});
		},false);
}

function cPositon(i,array) {//i: 描画順, array: 描画要素のすべてを取得
	//console.log(i,array);
	var r,padding = 10;
	r = array[i];
	//console.log(r);
	if(i == 1) { r +=array[i-1] * 2 + padding;}
	if(i == 2) { r +=array[i-1] * 2 + array[i-2] * 2 +padding * 2;}
	if(i == 3) { r +=array[i-1] * 2 + array[i-2] * 2 + array[i-3] * 2 + padding * 3}  
	return r;
}

//D３circle exist
function circle(array) {
	console.log(array);
	var title = array[2];
	var company = array[4];
	var dataSet = [];
	var settlement = [];//決算期
	var maxElement;//配列の最大値 最大円の半径
	var Scale = .5;//描画倍率
	var fontSize = 10;
	var textPositionX = [];
	var textPositionY = [];
	maxElement = Math.max.apply(null, array[0]);
	//console.log(maxElement);
	//最大値を100pxに抑える　比率計算する。
	if(maxElement > 100) {
		Scale = 100 / maxElement;
		maxElement = 100;
	}
	for (var i = 0; i < array[0].length; i++) {
		dataSet.push(array[0][i] * Scale);
	};
	for (var i = 0; i < array[1].length; i++) {
		settlement.push(array[1][i]);
	};
	//console.log(dataSet,settlement);
	var circle = d3.select('#data')
				.append('svg')
				.attr({
					x:0,
					y:0,
					width:dataSet.length * maxElement * 2,
					height:maxElement * 2 * 1.1,
					class:'graph'
				})
		circle.selectAll('circle')
			.data(dataSet)
			.enter()
			.append('circle')
			.attr({
				cx: function(d,i) {
					return cPositon(i,dataSet);
				}, 
				cy: function(d,i) {
					return maxElement + (maxElement -d);
				},
				r: 0
			})
			.transition()
			.ease('cubic')
			.attr({
				cx: function(d,i) {
					return cPositon(i,dataSet);
				}, 
				cy: function(d,i) {
					return maxElement + (maxElement -d);
				},
				r: function(d, i) {
					return d ;
				},
				fill: 'rgba(0,0,0,.32)'
			})
		circle.selectAll('text')
			.data(dataSet)
			.enter()
			.append('text')
			.text(function(d,i) {
				return (d *.1).toFixed(2) + '%';
			})
			.attr({
				x: function(d,i) {
					//textPositionY.push(maxElement + i * maxElement * 2 - d *.3);
					return cPositon(i,dataSet);
				}, 
				y: function(d,i) {
					textPositionY.push(maxElement + (maxElement -d));
					return (maxElement + (maxElement -d)).toFixed();
				},
				'font-size': fontSize,
				fill: 'white'
			})
		circle.selectAll('settlement')
			.data(settlement)
			.enter()
			.append('text')
			.attr({
				x: function(d, i) {
					return cPositon(i,dataSet);
				},
				y: function(d,i) {
					return textPositionY[i] - fontSize;
				},
				fill:'white',
				stroke: 'gray',
				'font-weight': 'bold',
				'font-size': 9,
				'stroke-width': .2
			})
			.text(function(d, i) {
				return d;
			})
		circle.append('text')
			.transition(1000)
			.delay(1000)
			.attr({
				x:0,
				y:0,
				height: 30,
				width: 140,
				fill: 'gray',
				'font-size': fontSize,
				transform: 'translate(0,' + fontSize * 2 + ')'
			})
			.text(title)
		circle.append('text')
			.transition(1000)
			.delay(800)
			.attr({
				x:0,
				y:0,
				height: 30,
				width: 140,
				fill: 'gray',
				'font-size': fontSize,
				transform: 'translate(0,' + fontSize + ')'
			})
			.text(company)
			erase(circle,dataSet);
		}
