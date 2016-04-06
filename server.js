/**
 * Created by Gustavo on 4/3/2016.
 */
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
var mysql = require("mysql");
var bCrypt = require("bcrypt-nodejs");
//create db connection to localhost (at this point)
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mydb'
});

connection.connect();
//setup geocoder (for lat/lon)
var geocoderProvider = 'google';
var httpAdapter = 'http';
// optional
var extra = {
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);
//templating stuffs
var engines = require('consolidate');
app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname + '/templates'); // tell Express where to find templates
app.use(express.static('static'));
connection.query('select count(*) from User', function (err, rows, fields) {
    if(err) console.log('ERROR');
    else console.log(rows);
});
app.get('/', function(request, response) {
    response.render("index.html");
})
app.get('/signup', function(request, response) {
    response.render("signup.html");
})
app.post('/newuser', function(request, response){
    //adding new user
    var email = request.body.email; 
    //extract params and hash pw
    var pw = bCrypt.hashSync(request.body.pw, bCrypt.genSaltSync(10));//request.body.pw;
    var ln = request.body.ln; 
    var fn = request.body.fn; 
    var address = request.body.address;
    var username = request.body.username;
    var phone = request.body.phone;
    console.log(email + " "+ln+" "+pw+" "+fn+" "+address);
    /**
    //http://stackoverflow.com/questions/19442829/how-can-we-access-variable-from-callback-function-in-node-js
    var lon;
    var lat;
    var callback = function(ln,lt){
        lon = ln;
        lat = lt;
    }
    **/
    geocoder.geocode(address, function(error, res) {
        //if err probably not an actual address
        if(error){
            
        }
        else{
            /** Columns in order
            idUser is supposed to autoincrement
            idUser, Username, password, email, phone,lender_rating, borrower_rating, profile_url, first_name,last_name,address, latitude, longitude
            **/
            connection.query('INSERT INTO User VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', [null, username, pw, email,phone,0.0,0.0,'',fn,ln,address,res[0]['latitude'],res[0]['longitude']], function (err) {
            if(err){
                console.log('Adding new user failed');
                console.log(err);
            } 
            });
        }
    });
    
});
app.post('/login', function(request, response){
    var uname = request.body.email;
    var pw = request.body.password;
    console.log("Received login request");
    connection.query('SELECT * from User WHERE Username = ? OR email = ?', [uname,uname], function (err,rows) {
        if(err){
            console.log('Adding new user failed');
            console.log(err);
        }
        else{
            console.log(rows);
            if(rows[0].Username===uname||rows[0].email===uname){
                console.log("FOUND:"+rows[0]);
                if(bCrypt.compareSync(pw,rows[0].password)){
                    //response.send();
                    console.log("FOUND ROW");
                }
            }
        }
    });
    
});
console.log("Blend Server listening on port 8080");

app.on('close', function () {
  console.log("Closed");
  connection.end();
});
app.listen(8080);
