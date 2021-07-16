var mysql = require('mysql');
var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'chlehsdud64',
  database: 'nanacrew'
});
db.connect();

module.exports = db;
