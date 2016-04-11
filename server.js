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
var httpAdapter = 'https';
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
//static file server stuff
app.use('/static',express.static('static'));
app.use(express.static('bootstrap'));
//multer for file uploads
var multer  = require('multer');
var upload = multer({ dest: './static/images/' });
// dunno if this works:http://stackoverflow.com/questions/21128451/express-cant-upload-file-req-files-is-undefined
connection.query('select count(*) from User', function (err, rows, fields) {
    if(err) console.log('ERROR');
    else console.log(rows);
});

app.get('/', function(request, response) {
    console.log(request.session.user);
    response.render("index.html");
});
app.get('/signup', function(request, response) {
    response.render("signup.html");
});

app.get('/search', requireLogin, function(request, response){
    response.send('search')
});

app.get('/lend', requireLogin, function(request, response) {
    console.log(request.session.user);
    response.render("lend.html");
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
    geocoder.geocode(address, function(error, res) {
        //if err probably not an actual address
        if(error){
            
        }
        else{
            connection.query('INSERT INTO User VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', [null, username, pw, email,phone,0.0,0.0,'',fn,ln,address,res[0]['latitude'],res[0]['longitude']], function (err) {
            if(err){
                console.log(err);
            } 
            });
        }
    });
    
});

app.post('/itemupload', requireLogin, upload.single('img'),function(request, response){
    console.log("Received item upload");
    //console.log(request);
    console.log(request.file);
    var image = request.file.filename;
    console.log(request.body);
    var user = request.session.user;
    var name = request.body.itemName;
    var price = request.body.price;
    var period = request.body.period;
    var periodHours = 720;//month, which is about 30 days
    if(period==="Hour"){
        periodHours = 1;
    }
    if(period==="Day"){
        periodHours = 24;
    }
    if(period==="Week"){
        periodHours = 148;
    }
    var condition = request.body.condition;
    var description = request.body.description;
    //var image = 
    //deposit thing in db along with filename
    /**
     connection.query('UPDATE Item WHERE Username = ? OR email = ?', [uname,uname], function (err,rows) {
        
    });
    **/
    connection.query('SELECT * from User WHERE idUser = ?', [user], function (err,rows) {
        if(err){
            
        }
        else{
            console.log(rows[0]);
            var userid = rows[0].idUser;
            connection.query('INSERT INTO Item VALUES(?,?,?,?,?,?,?,?)', [null,name, condition, userid,price,description,periodHours,image], function (err) {
                    if(err){
                        console.log('Adding new item failed');
                        console.log(err);
                    } 
            });
        }
    });
});

app.get('/logout', function(req, res){
    console.log("logout");
    //res.send('logout');
    if(req.session.user) {
      req.session.destroy(function(){
	console.log("destroy");
      });
    } else {
        console.log("no session");
    }
    res.redirect('/');
});

function getUser(username, callback){
    connection.query('Select * from User where username=?',[username], function(err, result){
        if(err){
            console.log("No user");
        }else{
            console.log(username);
            console.log("##########################")
            console.log(result);
            user = result
            console.log("############################")
            console.log(result.length);
            return callback(user[0]);
        }
    });
}


app.post('/login', function(request, response){
    console.log(request.session.user);
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
                    console.log("FOUND ROW");
                    //request.session.user = "a";
		    var u = getUser(uname, function(u){
                        console.log("returned id " + u.idUser);
			request.session.user = u.idUser;
                        response.redirect('/search')                      
                     });
                }
             }
        }
    });
});
app.get('/:itemId', requireLogin, function(request, response){
    console.log(request.params);
    console.log("Multiple params?");
    response.render("item.html",{itemId: request.params.itemId});
});
app.get('/item/:itemId/retrieve', requireLogin,function(request,response){
     var messages = [];
    // query code
    console.log("Received request to get item:"+request.params.itemId);
    connection.query("SELECT * from Item WHERE idItem = ?", [request.params.itemId],function(err,rows) {
        if(err){
            console.log("No such item found");
        }
        else{
            var row=rows[0];
            console.log("Found item");
            console.log(rows);
            var res=[];
            res.push({name:row.name,condition:row.condition,owner:row.owner,price:row.price, description:row.description,duration:row.duration,image:"http://localhost:8080/static/images/"+row.image });
            response.json(res);
        }
    });
});
//unused route right now
app.get('/item/:itemId/retrieveImage', requireLogin, function(request,response){
    connection.query("SELECT * from Item WHERE idItem = ?", [request.params.itemId],function(err,rows) {
        if(err){
            console.log("No such item found");
        }
        else{
            var row=rows[0];
            response.sendFile(__dirname+'/static/images/'+row.image);
        }
    });
});
console.log("Blend Server listening on port 8080");

app.on('close', function () {
  console.log("Closed");
  connection.end();
});

function requireLogin (req, res, next) {
  //console.log(req.session);
  if (!req.session.user) {
    console.log("login now");
    res.redirect('/');
  } else {
    console.log("Passed");
    next();
  }
};

function User(idUser, username, password, email, phone, lender_rating, borrow_rating, profile_url, first_name, last_name, address, latitude, longitude){
    this.idUser = idUser,
    this.username = username,
    this.password = password, 
    this.email = email,
    this.phone = phone,
    this.lender_rating = lender_rating,
    this.borrow_rating = borrow_rating,
    this.profile_url = profile_url,
    this.first_name = first_name,
    this.last_name = last_name,
    this.address = address,
    this.latitude = latiture,
    this.longitude = longitude
}

var server = https.createServer({
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.pem')
}, app).listen(8080);
