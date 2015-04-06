var mongoose = require('mongoose');
var url = 'mongodb://heroku_app35584595:t7itv7immno45qdjbkkv25cs1@ds061391.mongolab.com:61391/heroku_app35584595/kabu2';
var db = mongoose.createConnection(url, function(err, res) {
	if(err) {
		console.log('error connected:' + url + '-' + err);
	} else {
		console.log('Success connected:' + url);
	}
});

var YSchema = new mongoose.Schema({
	'日付': { type: Date, default: Date.now },
	'会社名': String,
	'証券コード': String,
	'決算期': String,
	'会計方式': String,
	'決算発表日': String,
	'決算月数': String,
	'売上高': String,
	'営業利益': String,
	'経常利益': String,
	'当期利益': String,
	'EPS（一株当たり利益）': String,
	'調整一株当たり利益': String,
	'BPS（一株当たり純資産）': String,
	'総資産': String,
	'自己資本': String,
	'資本金': String,
	'有利子負債': String,
	'自己資本比率': String,
	'ROA（総資産利益率）': String,
	'ROE（自己資本利益率）': String,
	'総資産経常利益率': String 
}, {collection: 'YFinfo'});

exports.Yahoo = db.model('Yahoo', YSchema);