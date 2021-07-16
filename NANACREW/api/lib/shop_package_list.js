var db = require('./db');
var qs = require('querystring');
var url = require('url');
var jsonBig = require('json-bigint');

var getGameName = function(type) {
	var name = '';
	if (type === 'monstergym') {
		name = 'monstergym';
	}
	return name;
};

// ServerState Json Format
var serverStateJsonConvert = function(response, stateCode, gameName, app_version) {
	var state = 'stateCode';
	var message = 'message';

	switch (stateCode) {
		case 200:
			state = true;
			stateCode = 200;
			message = '성공';
			break;
		case 204:
			state = true;
			stateCode = 200;
			message = '데이터가 없습니다';
			break;
		case 400:
			state = false;
			message = '잘못된 요청입니다';
			break;
		case 404:
			state = false;
			message = '찾을 수 없습니다';
			break;
		case 500:
			state = false;
			message = '서버에서 요청을 처리 중에 에러가 발생했습니다';
			break;
		default:
	}

	var jsonFormat = {
		'state': state,
		'stateCode': stateCode,
		'game_name': gameName,
		'app_version': app_version,
		'message': message,
		'time_stamp': (Date.now() / 1000).toFixed(0),
		'date_time': dateFormat(new Date())
	};

	var data = JSON.stringify(jsonFormat);
	response.writeHead(stateCode, {
		"Content-Type": "application/json;characterset=utf-8"
	});
	response.write(data);
	response.end();
}

//

var shopPackageListJsonConvert = function(response, stateCode, gameName, items) {
	var state = 'stateCode';
	var message = 'message';

	switch (stateCode) {
		case 200:
			state = true;
			stateCode = 200;
			message = '성공';
			break;
		case 204:
			state = true;
			stateCode = 200;
			message = '데이터가 없습니다';
			break;
		case 400:
			state = false;
			message = '잘못된 요청입니다';
			break;
		case 404:
			state = false;
			message = '찾을 수 없습니다';
			break;
		case 500:
			state = false;
			message = '서버에서 요청을 처리 중에 에러가 발생했습니다';
			break;
		default:
	}
	var object = `[`;
	var i = 0;
	var jsonArray = new Array();

	for (var key in items) {
		var jsonObject = new Object();
		jsonObject.title = items[i].title;
		jsonObject.cost = items[i].cost;
		jsonObject.cost_sale = items[i].cost_sale;
		jsonObject.sale = items[i].sale;
		jsonObject.event_type = items[i].event_type;
		jsonObject.condition_rebirth = items[i].condition_rebirth;
		jsonObject.condition_grade = items[i].condition_grade;
		jsonObject.event_day = items[i].event_day;
		jsonArray.push(jsonObject);
		i++;
		// if (i < items.length - 1)
		// 	object += `{'nickname' : ${items[i].nickname},'uid': ${items[i].uid},'clear_count':${items[i].clear_count},'best_damage':${items[i].best_damage},'ranking':${items[i].ranking}},`;
		// else
		// 	object += `{'nickname' : ${items[i].nickname},'uid': ${items[i].uid},'clear_count':${items[i].clear_count},'best_damage':${items[i].best_damage},'ranking':${items[i].ranking}}`;
		// i++;
	};
	object += `]`;

	var jsonFormat = {
		'state': state,
		'stateCode': stateCode,
		'game_name': gameName,
		'message': message,
		'package_list': jsonArray
	};
	var data = JSON.stringify(jsonFormat);
	// console.log(data);

	response.writeHead(stateCode, {
		"Content-Type": "application/json;characterset=utf-8"
	});
	response.write(data);
	response.end();
}
//
function dateFormat(date) {
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hour = date.getHours();
	let minute = date.getMinutes();
	let second = date.getSeconds();

	month = month >= 10 ? month : '0' + month;
	day = day >= 10 ? day : '0' + day;
	hour = hour >= 10 ? hour : '0' + hour;
	minute = minute >= 10 ? minute : '0' + minute;
	second = second >= 10 ? second : '0' + second;

	return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

// exports.getNormalPackageList = function(request, response) {
// 	var body = '';
// 	request.on('data', function(data) {
// 		body = body + data;
// 	});
// 	request.on('end', function() {
// 		var post = qs.parse(body);
// 		var gameName = getGameName(post.type);
// 		// var rebirth_count = post.rebirth_count;
// 		// var hasGrade = post.hasGrade;
// 		// var eventType = post.eventType;
//
// 		var selectQuery = `SELECT * FROM ${gameName}_shop_package WHERE open = 'Y' AND event_type = 1`;
//
// 		// All : 0 / normal : 1 / rebirth : 2/ gacha : 3 / newbie : 4
// 		// switch (eventType) {
// 		// 	case expression:
// 		//
// 		// 		break;
// 		// 	default:
// 		//
// 		// }
//
// 		db.query(selectQuery, function(err, lists) {
// 			if (err)
// 				throw err;
// 			shopPackageListJsonConvert(response, 200, gameName, lists);
//
// 		});
// 	});
// };

exports.getPackageList = function(request, response) {
	var body = '';
	request.on('data', function(data) {
		body = body + data;
	});
	request.on('end', function() {
		console.log(`[NANACREW] API call shop_package_list.js(getPackageList) / ${new Date()}`);
		var post = qs.parse(body);
		var gameName = getGameName(post.type);
		var event_type = post.event_type;
		var rebirth_count = post.rebirth_count;
		var hasGacha = post.hasGacha;


		var selectQuery = `SELECT * FROM ${gameName}_shop_package WHERE open = 'Y' `;

		// ALL : 0 / NORMAL : 1 / REBIRTH : 2/ GACHA : 3 / NEWBIE : 4
		switch (event_type) {
			case '0':
				selectQuery += `AND event_type >= 0`;
				break;

			case '1': // 환생 카운트에 따라 초심자 패키지도 노출
				selectQuery += `AND event_type = 1 OR (event_type = 4 AND condition_rebirth >= ${rebirth_count})`;
				break;

			case '2':
				selectQuery += `AND event_type = 2 AND condition_rebirth >= ${rebirth_count}`;
				break;

			case '3':
				selectQuery += `AND event_type = 3 AND condition_grade = ${hasGacha}`;
				break;

			case '4':
				selectQuery += `AND event_type = 4 AND condition_rebirth >= ${rebirth_count}`;
				break;

			default:
		}

		db.query(selectQuery, function(err, lists) {
			if (err)
				throw err;
			shopPackageListJsonConvert(response, 200, gameName, lists);

		});
	});
};