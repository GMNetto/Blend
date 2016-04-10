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
    user: 'blend_user',
    password: 'blend_pw',
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
//static file server stuff
app.use('/static',express.static('static'));
//multer for file uploads
var multer  = require('multer');
var upload = multer({ dest: './static/images/' });
// dunno if this works:http://stackoverflow.com/questions/21128451/express-cant-upload-file-req-files-is-undefined

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
app.get('/lend', function(request, response) {
    response.render("lend.html");
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
app.post('/newitem', function(request, response){
    var user = request.body.username;
    var name = request.body.name;
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
    var image = request.body.image;
    console.log("Received item from:"+user);
    console.log("Files?"+request.files);
    connection.query('SELECT * from User WHERE Username = ?', [user], function (err,rows) {
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
app.post('/itemupload',upload.single('img'),function(request, response){
    console.log("Received item upload");
    //console.log(request);
    console.log(request.file);
    var image = request.file.filename;
    console.log(request.body);
    var user = request.body.username;
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
    connection.query('SELECT * from User WHERE Username = ?', [user], function (err,rows) {
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
app.get('/:itemId', function(request, response){
    console.log(request.params);
    console.log("Multiple params?");
    response.render("item.html",{itemId: request.params.itemId});
});
app.get('/item/:itemId/retrieve',function(request,response){
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
            // encode row object as JSON and send it back
            // use message as param
            //response.set('Content-Type', 'application/json');
            response.json(res);
            //console.log(__dirname+'/static/images');
            //response.sendFile(__dirname+'/static/images/'+row.image);
        }
    });
});
//unused route right now
app.get('/item/:itemId/retrieveImage',function(request,response){
    connection.query("SELECT * from Item WHERE idItem = ?", [request.params.itemId],function(err,rows) {
        if(err){
            console.log("No such item found");
        }
        else{
            var row=rows[0];
            //console.log(__dirname+'/static/images');
            response.sendFile(__dirname+'/static/images/'+row.image);
            /**
            var BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder;
            var bb = new BlobBuilder();

            //var file = File(__dirname+'/static/images/'+row.image);
            var reader = new FileReader();
            var blob = bb.getBlob(__dirname+'/static/images/'+row.image);
            /**
            console.log(blob);
            reader.onload = function (e) {
                console.log("Printing result");
                console.log(reader.result);
            }

            reader.readAsDataURL(file);
            **/
        }
    });
});
console.log("Blend Server listening on port 8080");

app.on('close', function () {
  console.log("Closed");
  connection.end();
});
app.listen(8080);
