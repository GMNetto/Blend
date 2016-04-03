/**
 * Created by Gustavo on 4/3/2016.
 */

var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

connection.connect();

connection.query('select count(*) from user', function (err, rows, fields) {
    if(err) console.log('ERROR');
    else console.log(rows);
});

