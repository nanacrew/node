var http = require('http');
var url = require('url');

var userInfo = require('./lib/user_info');
var dungeonInfo = require('./lib/dungeon_info');
var shopPackageList = require('./lib/shop_package_list');

var app = http.createServer(function(request, response) {
	var pathName = url.parse(request.url, true).pathname;
	if (pathName === '/web.js') {
		response.end(`Welcome to NANACREW`);
	} else if (pathName === '/api/getServerState') {
		userInfo.getServerState(request, response);
	} else if (pathName === '/api/getServerTime') {
		userInfo.getServerTime(request, response);
	}
	//  else if (pathName === '/api/getUserInfo') {
	// 	userInfo.getUserInfo(request, response);
	// }
	else if (pathName === '/api/updateNickname') {
		userInfo.updateNickname(request, response);
	} else if (pathName === '/api/setUserInfo') {
		userInfo.setUserInfo(request, response);
	} else if (pathName === '/api/setDungeonScore') {
		dungeonInfo.setDungeonScore(request, response);
	} else if (pathName === '/api/getRank') {
		dungeonInfo.getRank(request, response);
	} else if (pathName === '/api/getMyRank') {
		dungeonInfo.getMyRank(request, response);
	} else if (pathName === '/api/getShopPackageList') {
		shopPackageList.getPackageList(request, response);
	} else {
		response.writeHead(404);
		response.end(`NotFound`);
	}

});

// 데일리 던전 랭킹 데이터 초기화
// setInterval(initRank, 24 * 60 * 60 * 1000);
setInterval(function() {
	var toDate = new Date();
	var tomorrow = new Date();
	tomorrow.setHours(24, 0, 0, 0);
	var diffMS = Math.floor(tomorrow.getTime() / 1000 - toDate.getTime() / 1000);
	// console.log('MS : ' + diffMS);

	if (diffMS <= 0) {
		dungeonInfo.initRank('monstergym_helldungeon');
		dungeonInfo.initRank('monstergym_helldungeon_temp');
	}
}, 1000);




app.listen(8001);