/**
 * Created by Gustavo on 4/3/2016.
 */
var https = require('https');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
var mysql = require("mysql2");
var bCrypt = require("bcrypt-nodejs");
app.use(require('morgan')('dev'));
var session = require("express-session");
var MySQLStore = require('express-mysql-session')(session);

//create db connection to localhost (at this point)
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'blend_user',
    password: 'blend_password',
    database: 'blend_db'
});

var options_session = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'senha123',
    database: 'blend_db',
    checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
    expiration: 86400000,// The maximum age of a valid session; milliseconds.
    createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

connection.connect();
var sessionStore = new MySQLStore(options_session, connection);
app.use(session({
    name: 'server-session-cookie-id',
    secret: 'my express secret',
    saveUninitialized: false,
    resave: true,
    rolling: false,
    store: sessionStore,
}));

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

app.use(function(req, res, next){
    
    if(!req.session.user){
        console.log("redirect");
        res.redirect('/');
    }else{
        next();
        console.log("Really?");  
    }
}); 

app.get('/', function(request, response) {
    //request.session.user = 'b';
    response.render("index.html");
});
app.get('/signup', function(request, response) {
    //request.session.user = 'b';
    response.render("signup.html");
});

app.get('/search', requireLogin, function(request, response){
    console.log('search'); 
    response.send('search')
});

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
    //request.session.user = 'b';
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
		    var u = getUser(uname);
                    //request.session.regenerate(function(err){
                    request.session.user = 'a';
                }
             }
        }
        console.log('3################3');
        response.redirect('/search');
    });
});

function getUser(username){
    connection.query('Select * from User where username=?',[username], function(err, result){
        if(err){
            console.log("No user")
        }else{
            console.log(result);
            return {};        
        }
    });
}

console.log("Blend Server listening on port 8080");

app.on('close', function () {
  console.log("Closed");
  connection.end();
});

function requireLogin (req, res, next) {
  console.log(req.session);
  if (!req.session.user) {
    console.log("login now");
    res.redirect('/');
  } else {
    console.log("Passed");
    next();
  }
};

var server = https.createServer({
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.pem')
}, app).listen(8080);
