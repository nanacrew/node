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

var dungeonRankJsonConvert = function(response, stateCode, gameName, items) {
	var state = 'stateCode';
	var message = 'message';
	console.log(`[NANACREW] API call dungeonRankJsonConvert!! ${new Date()}`);

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
		jsonObject.nickname = items[i].nickname;
		jsonObject.uid = items[i].uid;
		jsonObject.clear_count = items[i].clear_count;
		jsonObject.best_damage = jsonBig.parse(items[i].best_damage);
		jsonObject.total_damage = jsonBig.parse(items[i].total_damage);
		jsonObject.ranking = items[i].ranking;
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
		'rank_list': jsonArray
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
exports.setDungeonScore = function(request, response) {
	var body = '';
	request.on('data', function(data) {
		body = body + data;
	});
	request.on('end', function() {
		console.log(`[NANACREW] API call setDungeonScore.js(initRank) / ${new Date()}`);

		var post = qs.parse(body);
		var gameName = getGameName(post.type);
		var nickname = post.nickname;
		var uid = post.uid;
		var clearCount = parseInt(post.clear_count);
		var bestDamage = parseInt(post.best_damage);

		var selectQuery = `
		SELECT *
		FROM ${gameName}_helldungeon
		WHERE uid = ?`;
		db.query(selectQuery, [uid], function(err, users) {
			var query = '';
			if (err)
				throw err;

			if (users.length == 0) {
				var query = `
				INSERT INTO ${gameName}_helldungeon
				(nickname, uid, clear_count, best_damage, total_damage, score, recent_datetime)
				VALUES
				(?,?,?,?,?, NOW())`;

				var mulValue = parseFloat(0.0000000003);
				var score;
				if (clearCount <= 0) {
					mulValue = parseFloat(0.0000000001);
					score = (mulValue * bestDamage);
				} else {
					score = (mulValue * bestDamage) * clearCount;
				}

				db.query(query, [nickname, uid, clearCount, bestDamage, bestDamage, parseFloat(score)], function(err, users) {
					if (err)
						throw err;
					// console.log(err);

					serverStateJsonConvert(response, 200, gameName, '');
				});
			} else {
				var query = `
				UPDATE
					${gameName}_helldungeon
				SET
					nickname = ?,
					uid = ?,
					clear_count = ?,
					best_damage = ?,
					total_damage = ?,
          score = ?,
					recent_datetime = NOW()
				WHERE uid = ?`;

				clearCount += parseInt(users[0].clear_count);
				var total_damage = parseInt(users[0].total_damage) + parseInt(bestDamage);

				var mulValue = parseFloat(0.0000000003);
				var score;
				if (clearCount <= 0) {
					mulValue = parseFloat(0.0000000001);
					score = (mulValue * total_damage);
				} else {
					score = (mulValue * total_damage) * clearCount;
				}

				if (bestDamage < users[0].best_damage)
					bestDamage = parseInt(users[0].best_damage);

				db.query(query, [nickname, uid, clearCount, bestDamage, total_damage, parseFloat(score), uid], function(err, users) {
					if (err) {
						throw err;
						serverStateJsonConvert(response, 500, gameName, '');
					}


					serverStateJsonConvert(response, 200, gameName, '');
					// console.log(err);
				});
			}
		});
	});
};

exports.getRank = function(request, response) {
	var body = '';
	request.on('data', function(data) {
		body = body + data;
	});
	request.on('end', function() {
		console.log(`[NANACREW] API call getRank.js(initRank) / ${new Date()}`);

		var post = qs.parse(body);
		var gameName = getGameName(post.type);
		var uid = post.uid;
		var startIdx = post.start_page;
		var pageCount = post.page_count;

		var truncateQuery = `TRUNCATE ${gameName}_helldungeon_temp`;
		db.query(truncateQuery, function(err, users) {
			if (err)
				throw err;
			var updateQuery = `
				INSERT INTO monstergym_helldungeon_temp(nickname, uid, clear_count, best_damage,total_damage, score, recent_datetime, ranking)
				SELECT
 						t.nickname, t.uid, t.clear_count, t.best_damage, t.total_damage,t.score,t.recent_datetime,
 						(SELECT COUNT(*) FROM ${gameName}_helldungeon WHERE score > t.score)+1 AS ranking
				FROM
						${gameName}_helldungeon t
				ORDER BY ranking ASC`;
			db.query(updateQuery, function(err, users) {
				if (err)
					throw err;
				var query = `
					SELECT * FROM ${gameName}_helldungeon_temp ORDER BY ranking ASC LIMIT ?,?`;
				db.query(query, [parseInt(startIdx), parseInt(pageCount)], function(err, users) {
					var query = '';
					if (err)
						throw err;
					dungeonRankJsonConvert(response, 200, gameName, users);
				});
			});
		});
	});
};

exports.getMyRank = function(request, response) {
	var body = '';
	request.on('data', function(data) {
		body = body + data;
	});
	request.on('end', function() {
		console.log(`[NANACREW] API call getMyRank.js(initRank) / ${new Date()}`);

		var post = qs.parse(body);
		var gameName = getGameName(post.type);
		var uid = post.uid;
		var truncateQuery = `TRUNCATE ${gameName}_helldungeon_temp`;
		db.query(truncateQuery, function(err, users) {
			if (err)
				throw err;
			var updateQuery = `
				INSERT INTO monstergym_helldungeon_temp(nickname, uid, clear_count, best_damage,total_damage, score, recent_datetime, ranking)
				SELECT
						t.nickname, t.uid, t.clear_count, t.best_damage, t.total_damage, t.score,t.recent_datetime,
						(SELECT COUNT(*) FROM ${gameName}_helldungeon WHERE score > t.score)+1 AS ranking
				FROM
						${gameName}_helldungeon t
				ORDER BY ranking ASC`;
			db.query(updateQuery, function(err, users) {
				if (err)
					throw err;
				var query = `
    SELECT * FROM ${gameName}_helldungeon_temp WHERE uid = ?`;
				db.query(query, [uid], function(err, users) {
					var query = '';
					if (err)
						throw err;

					dungeonRankJsonConvert(response, 200, gameName, users);

				});
			});
		});
	});
};

exports.initRank = function(type) {
	console.log(`[NANACREW] API call dungeon_info.js(initRank) / ${new Date()}`);
	var dungeonClearQuery = `TRUNCATE ${type}`;
	db.query(dungeonClearQuery, function(err, users) {
		if (err)
			throw err;
		console.log(type + ' clear');


	});
};