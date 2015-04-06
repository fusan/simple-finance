var mongoose = require('mongoose');
var url = 'mongodb://heroku_app35584595:t7itv7immno45qdjbkkv25cs1@ds061391.mongolab.com:61391/heroku_app35584595/kabu';
var db = mongoose.createConnection(url, function(err, res) {
	if(err) {
		console.log('error connected:' + url + '-' + err);
	} else {
		console.log('Success connected:' + url);
	}
});

var UserSchema = new mongoose.Schema({
	'日付': { type: Date, default: Date.now },
	'証券コード': String,
	'会社名': String,
	'決算期': String,
	'流動資産': String,
	'固定資産': String,
	'流動負債': String,
	'固定負債': String,
	'純資産': String,
	'売上高': String,
	'営業利益': String,
	'経常利益': String,
	'当期純利益': String
}, {collection: 'info'});

exports.User = db.model('User', UserSchema);