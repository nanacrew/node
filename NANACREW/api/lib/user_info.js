var db = require('./db');
var qs = require('querystring');
var url = require('url');

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
			message = '서버 에러';
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
// UserInfo Json Format
var userInfoJsonConvert = function(response, stateCode, gameName, nickname, uid, access_token) {
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
			message = '서버 에러';
			break;
		default:
	}

	var jsonFormat = {
		'state': state,
		'stateCode': stateCode,
		'game_name': gameName,
		'message': message,
		'nickname': nickname,
		'uid': uid,
		'access_token': access_token,
		'server_time': (Date.now() / 1000).toFixed(0)
	};

	var data = JSON.stringify(jsonFormat);
	response.writeHead(stateCode, {
		"Content-Type": "application/json;characterset=utf-8"
	});
	response.write(data);
	response.end();
}

// 게임별 서버 상태
exports.getServerState = function(request, response) {

	var body = '';
	request.on('data', function(data) {
		body = body + data;
	});
	request.on('end', function() {
		var post = qs.parse(body);
		var gameName = getGameName(post.type);
		var query = `SELECT * FROM server_states WHERE game_name = ?`;
		db.query(query, [gameName], function(err, states) {
			console.log(`[NANACREW] API call user_info.js(getServerState) / ${new Date()}`);

			if (err)
				throw err;
			serverStateJsonConvert(response, states[0].game_state, gameName, states[0].app_version);
		});
	});
};

exports.getServerTime = function(request, response) {
	console.log(`[NANACREW] API call user_info.js(getServerTime) / ${new Date()}`);

	var time = (Date.now() / 1000).toFixed(0);

	serverStateJsonConvert(response, 200, '', '');

};

// 유저 접속 정보 GET
// exports.getUserInfo = function(request, response) {
// 	var queryString = url.parse(request.url, true).query;
// 	var gameName = getGameName(queryString.type);
// 	var uid = queryString.uid;
//
// 	var query = `SELECT * FROM ${gameName}_user WHERE uid=?`;
//
// 	db.query(query, [uid], function(err, users) {
// 		if (err)
// 			throw err;
// 		if (users.length > 0) {
// 			var userInfo = {
// 				'uid': users[0].uid,
// 				'sign_datetime': users[0].sign_datetime,
// 				'recent_datetime': users[0].recent_datetime
// 			};
// 			userInfoJsonConvert(response, 200, gameName, users[0].nickname);
// 		} else {
// 			userInfoJsonConvert(response, 204, gameName, '');
// 		}
// 	});
// };

// 유저 접속 정보 INSERT&UPDATE
exports.setUserInfo = function(request, response, type) {
	var body = '';
	request.on('data', function(data) {
		body = body + data;
	});
	request.on('end', function() {
		console.log(`[NANACREW] API call user_info.js(setUserInfo) / ${new Date()}`);

		var post = qs.parse(body);
		var gameName = getGameName(post.type);
		var nickname = post.nickname;
		var uid = post.uid;
		var os = post.os;
		var login_type = post.login_type;
		var push_token = post.push_token;
		var app_version = post.app_version;

		var selectQuery = `
		SELECT *
		FROM ${gameName}_user
		WHERE uid = ?`;
		db.query(selectQuery, [uid], function(err, users) {
			console.log(`[NANACREW] API call user_info.js(setUserInfo) / ${new Date()}`);

			var query = '';
			if (err)
				throw err;

			if (users.length == 0) {
				var query = `
				INSERT INTO ${gameName}_user
				(nickname, uid, os, push_token, app_version, sign_datetime, recent_datetime)
				VALUES
				(?,?,?,?,?, NOW(), NOW())`;

				db.query(query, [nickname, uid, os, push_token, app_version], function(err, users) {
					if (err)
						throw err;
					console.log(err);

					userInfoJsonConvert(response, 200, gameName, '');

				});
			} else {
				var query = `
				UPDATE
					${gameName}_user
				SET
					nickname = ?,
					os = ?,
					push_token = ?,
					app_version = ?,
					login_type = ?,
					recent_datetime = NOW()
				WHERE uid = ?`;
				db.query(query, [nickname, os, push_token, app_version, login_type, uid], function(err, users) {
					if (err)
						throw err;
					console.log(err);
					var getQuery = `SELECT * FROM ${gameName}_user WHERE uid=?`;

					db.query(getQuery, [uid], function(err, users) {
						if (err)
							throw err;
						if (users.length > 0) {

							userInfoJsonConvert(response, 200, gameName, users[0].nickname, users[0].uid, users[0].access_token);
						} else {
							userInfoJsonConvert(response, 204, gameName, '', '', '');
						}
					});
				});
			}
		});
	});
};

exports.updateNickname = function(request, response, type) {
	var body = '';
	request.on('data', function(data) {
		body = body + data;
	});
	request.on('end', function() {
		console.log(`[NANACREW] API call user_info.js(updateNickname) / ${new Date()}`);

		var post = qs.parse(body);
		var gameName = getGameName(post.type);
		var nickname = post.nickname;
		var uid = post.uid;
		var selectQuery = `
		SELECT *
		FROM ${gameName}_user
		WHERE uid = ?`;

		db.query(selectQuery, [uid], function(err, users) {
			var query = '';
			if (err)
				throw err;
			var query = `
				UPDATE
					${gameName}_user
				SET
					nickname = ?
				WHERE uid = ?`;
			db.query(query, [nickname, uid], function(err, users) {
				if (err)
					throw err;
				console.log(err);
				var getQuery = `SELECT * FROM ${gameName}_user WHERE uid=?`;

				db.query(getQuery, [uid], function(err, users) {
					if (err)
						throw err;
					if (users.length > 0) {

						userInfoJsonConvert(response, 200, gameName, users[0].nickname, users[0].uid, users[0].access_token);
					} else {
						userInfoJsonConvert(response, 204, gameName, '', '', '');
					}
				});
			});
		});
	});
};