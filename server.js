/**
 * Created by Gustavo on 4/3/2016.
 */
var https = require('https');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
//asynchronous handling stuff
var async = require("async");
//number parsing for distance library
//var numeral = require('numeral');
app.use(bodyParser.urlencoded({ extended: false }));
var mysql = require("mysql2");
var bCrypt = require("bcrypt-nodejs");
app.use(require('morgan')('dev'));
var session = require("express-session");
var MySQLStore = require('express-mysql-session')(session);
//var emailExistence = require('email-existence'); defunct

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
    user: 'blend_user',
    password: 'blend_password',
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

//google maps distance api

//example: findDistance("Brown University","Brown University");
var distance = require('google-distance');
//multer for file uploads
var multer  = require('multer');
var upload = multer({ dest: './static/images/' });

app.get('/', function(request, response) {
    console.log(request.session.user);
    response.render("index.html");
});
app.get('/signup', function(request, response) {
    response.render("signup.html");
});

app.get('/profile/:username', requireLogin, function(req, res){
    console.log("params " + req.params.username);
    getUser(req.params.username, function(user){
        console.log(user);
	    render_profile(user, res);
    });
});

app.get('/my_profile', requireLogin, function(req, res){
    get_user_by_id(req.session.user, function(user){
        render_my_profile(user, res);        
    });
});

app.get('/search', requireLogin, function(request, response){
    response.render("search.html");
});

app.post('/searchquery', requireLogin, function(request, response){
    console.log("Received request for search");
    console.log(request.body);
    console.log(request.params);
    var itemName = request.body.itemName;
    //var priceFloor = request.body.priceFloor;
    var priceCeil = request.body.priceCeil;
    var period = request.body.period;
    var condition = request.body.condition;
    var minrating = request.body.minRating;
    var distancefilter = "3 km";
    console.log("Filtering for condition:"+condition);
    console.log("query made by:"+request.session.user);
    //sample that works:SELECT * FROM (SELECT * from Item WHERE name = ? AND price<=? AND duration>=?) AS Items LEFT JOIN User ON Items.owner=User.idUser WHERE lender_rating>=?;
    connection.query('SELECT * FROM (SELECT * from Item WHERE name = ? AND price<=? AND duration>=?) AS Items LEFT JOIN User ON Items.owner=User.idUser WHERE lender_rating>=? AND Items.condition>= ?', [itemName,priceCeil,calcDuration(period), minrating,convertCondition(condition)], function (err,rows) {
            if(err){
                console.log(err);
            }
            else{
                console.log("FOUND SEARCH STUFF");
                console.log("USER?");
                console.log(request.session.user);
                var row;
                var tosend =[];
                var originallat = request.session.latitude;
                var originallon = request.session.longitude;

                for(i = 0;i<rows.length;i++){
                    row = rows[i];
                    //TODO distance filter

                    //console.log(request.session.latitude+" "+request.session.longitude+" "+row.longitude+" "+row.latitude);
                    //var dist =findDistance(originallat,originallon,row.latitude,row.longitude,function(result){
                      //  console.log(result);
                    //});

                    //console.log(compareDistances(distancefilter,dist));

                   tosend.push({username: row.Username,name:row.name,price:row.price,link:"https://localhost:8080/item/"+row.idItem, distance:undefined,lon:row.longitude,lat:row.latitude,image:"https://localhost:8080/static/images/"+row.image});  //tosend.push({name:row.name,price:row.price,link:"https://localhost:8080/item/"+row.idItem,distance:findDistance(originallat,originallon,row.latitude,row.longitude)});


                }
                async.each(tosend, function(item, callback) {
                  // Perform operation on file here.
                  console.log('Processing item ' + item);
                findDistance(originallat,originallon,item.lat,item.lon,function(result){
                        console.log("done");
                        //eliminate commas for distance filter
                        item.distance =result.replace(',','');
                        callback();
                    });
                    /**
                  if( item.name ==="foobar" ) {
                    console.log('This file name is too long');
                    callback('Not foobar');
                  } else {
                    // Do work to process file here
                    console.log('item processed');
                    callback();
                  }
                  **/
                }, function(err){
                    // if any of the file processing produced an error, err would equal that error
                    if( err ) {
                      // One of the iterations produced an error.
                      // All processing will now stop.
                      console.log('A row failed to process');
                    } else {
                      console.log('All rows processsed');
                        response.json(tosend);

                    }
                });
                // encode all messages object as JSON and send it back to client
               // console.log("Sent:"+rows.length);

               // packageSearchQuery(rows,originallat,originallon,function(result){
                   //console.log("done:"+result);
                    //response.json(tosend);
                //});

            }
    });
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
    var profileurl = "https://localhost:8080/profile/"+username;
    //pretty sure this is going to be assigned to a different variable, pw is just a standin for now so the sql query doesn't bug out
    var salt =pw;
    geocoder.geocode(address, function(error, res) {
        //if err probably not an actual address
        if(error){

        }
        else{
            connection.query('INSERT INTO User VALUES(?,?,?,?,?,?,0.0,0,0.0,0,?,?,?,?,?,?)', [null, username, pw, salt, email,phone,profileurl,fn,ln,address,res[0]['latitude'],res[0]['longitude']], function (err) {
            if(err){
                console.log(err);
            }
            });
        }
    });

});
app.post('/usernameverif', function(req, res){
     //console.log("Verifying username");
     //console.log(req.body);
     connection.query('SELECT * from User WHERE Username = ? OR email = ?', [req.body.username,req.body.email], function (err,rows) {
            var response = [];
            if (rows.length>0) {
              response.push({result:true, err:'Username or email already exists'});
            }
            else {
              response.push({result:false});
            }

            res.json(response);

    });
});
app.post('/borrow/:itemId', requireLogin, function(request, response){
    console.log("GOT REQUEST TO BORROW A THING");
    console.log(request.params);
    var borrowuser = request.session.user;
    console.log(borrowuser);
     connection.query('SELECT * from Item WHERE owner = ? AND idItem= ?', [request.session.user,request.params.itemId], function (err,rows) {
         console.log(rows.length);
         //some logic to check for if item owner matches session user
         if(rows.length>=1){
             //if there are rows, borrower is same as lender
         }
         else{
             //insert into db. Note: does prevent duplicate offers, since each is unique
             connection.query('INSERT INTO Borrows VALUES(?,?,?,0,0,0,0,0,CURDATE())', [null, request.session.user,request.params.itemId], function (err) {
                    if(err){
                        console.log(err);
                    } 
            });
         }
      });
});
app.post('/itemupload', requireLogin, upload.single('img'),function(request, response){
    console.log("Received item upload");
    console.log("Uploading item from:"+request.session.user);
    //console.log(request);
    console.log(request.file);
    var image;
    if(request.file!==undefined){
        image= request.file.filename;
    }
    else{
        //some default image
        image="No_image_available.png";
    }
    console.log(request.body);
    var user = request.session.user;
    var name = request.body.itemName;
    var price = request.body.price;
    var period = request.body.period;
    var periodHours = calcDuration(period);
    var condition = convertCondition(request.body.condition);
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
app.post('/newfeedback', requireLogin, function(request, response){
    var newrating = parseFloat(request.body.rating);
    var feedbackuser = request.body.user;
    var feedbacktype = request.body.type;
    var feedbackuserid = request.body.userid;
    console.log("Adding new feedback for "+feedbackuserid+ " "+feedbackuser);
    connection.query('SELECT * from User WHERE idUser = ?', [feedbackuserid], function (err,rows) {
        if(rows.length>0){
            console.log("updating row:");
            console.log(rows[0]);
            var row = rows[0];
            //calc new cumulative moving average = (new rating + old total*current average)/(old total+1)
            var newaverage;
            if(feedbacktype=="borrower"){
                var curborrows = row.total_borrow_ratings;//n
                newaverage = ((newrating +(curborrows*row.borrower_rating))/parseFloat(curborrows+1)).toFixed(1);
                console.log("borrow newaverage:"+newaverage);
                //http://stackoverflow.com/questions/2762851/increment-a-database-field-by-1
                connection.query('UPDATE User SET borrower_rating = ?, total_borrow_ratings = total_borrow_ratings + 1 WHERE idUser = ?', [newaverage,feedbackuserid], function (err) {
                    if(err){
                        //feedback update failed
                        console.log("updating borrower rating failed");
                    }
                 });
            }
            else{
                //lender update logic
                var curlender = row.total_lend_ratings;
                
                newaverage = ((newrating +(curlender*row.lender_rating))/parseFloat(curlender+1.0)).toFixed(1);
                console.log("lender newaverage:"+newaverage);
                connection.query('UPDATE User SET lender_rating = ?, total_lend_ratings = total_lend_ratings + 1 WHERE idUser = ?', [newaverage,feedbackuserid], function (err) {
                    if(err){
                        //feedback update failed
                        console.log("updating lender rating failed");
                    }
                 });
            }
        }
        else{
            console.log("Couldn't find user");
        }
    });
});
app.get('/feedback/:transactionId', requireLogin, function(request, response){
    //some query to check if this is valid feedback for a COMPLETED transaction. Since it's still kind of fluid right now, there won't be a check here
    connection.query('SELECT * from Borrows LEFT JOIN Item ON Borrows.idProduct=Item.idItem WHERE idBorrows= ?', [request.params.transactionId], function (err,rows) {
        if(rows.length==0){
            //no such transaction   
        }
        else{
            var row = rows[0];
            var borrower = row.idUser;
            var usertorate;
            var usertype;
            //going to need another query to get username though
            if(borrower==request.session.user){
                //feedback is for owner of the item
                usertorate = row.owner;
                usertype = "lender";
            }
            else{
                //feedback is for borrower
                usertorate = row.idUser;
                usertype = "borrower";
            }
            connection.query('SELECT * from User WHERE idUser= ?', [usertorate], function (err,rows) {
                //params are {{feedbackuser}},{{itemName}},{{image}}, probably should send feedbackuser id to store in meta tag or something
                if(rows.length>0){
                    response.render("feedback.html",{type:usertype,itemName:row.name,feedbackuser:rows[0].Username,feedbackuserid:usertorate,image:row.image});
                }
                else{
                    //user doesn't exist. This shouldn't happen
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
function convertCondition(condition){
    if(condition=="New"){
        return 4;
    }
    if(condition=="Used:Like New"){
        return 3;
    }
    if(condition=="Used:Very Good"){
        return 2;
    }
    if(condition=="Used:Good"){
        return 1;
    }
    else{
        //Used:Acceptable
        return 0;
    }
};
function getUser(username, callback){
    connection.query('Select * from User where username=?',[username], function(err, result){
        if(err){
            console.log("No user");
        }else{
            user = result
            return callback(user[0]);
        }
    });
};

function get_user_by_id(id_user, callback){
    connection.query('Select * from User where idUser=?',[id_user], function(err, result){
        if(err){
            console.log("No user");
        }else{ 
            user = result
            return callback(user[0]);
        }
    });
};

function getItem(item_id, callback){
    console.log(item_id);
    connection.query('select Item.name, Item.condition, price, description, duration, image, Username from Item, User where Item.idItem = ? and Item.owner = User.idUser',[item_id], function(err, result){
        if(err){
	        console.log("No item")
	    }else{
	        item = result;
	        return callback(item[0]);
	    }
    });
};

function getRecentBorrow(username, limit, callback){
    connection.query('select * from Item where Item.idItem in (select idProduct from Borrows as B, User as U where B.idUser=U.idUser and U.username=? order by B.inital_date) limit ?', [username, limit], function(err, result){
        if(err){
            console.log("No item");        
        }else{
            callback(result);        
        }    
    })
};

function getRecentLend(username, limit, callback){
    connection.query('select * from Item where Item.idItem in (select idProduct from Borrows as B, User as U, Item as I where B.idProduct=I.idItem and I.owner=U.idUser and U.username=? order by B.inital_date) limit ?', [username, limit], function(err, result){
        if(err){
            console.log("No item");        
        }else{
            callback(result);        
        }    
    }
)};


function get_items_from_user(idUser, callback){
    console.log('user '+ idUser)
    connection.query('select * from Item as I, User as U where I.owner = ?', [idUser], function(err, result){
        if(err){
            console.log("No item");        
        }else{
            callback(result);        
        }    
    }
)};


function render_profile(user, res){
    console.log("render: "+user.Username);
    getRecentBorrow(user.Username, 3, function(list_items_borrow){
        getRecentLend(user.Username, 3, function(list_items_lend){
            var l_B = list_items_borrow, l_L = list_items_lend;
            //l_B["borrow"] = [{"name": 'Hello'}, {'name': 'Bye'}]; 
            console.log(l_B);
            console.log(l_L);
            res.render("profile.html",{username: user.Username, rating_borrower: user.borrower_rating, rating_lender: user.lender_rating, address: user.address, phone: user.phone, email: user.email, image: user.profile_url, borrow: l_B, lend: l_L});
            console.log("end");
        });    
    });
};

function render_my_profile(user, res){
    getRecentBorrow(user.Username, 3, function(list_items_borrow){
        getRecentLend(user.Username, 3, function(list_items_lend){
            get_items_from_user(user.idUser, function(list_items){
                res.render("my_profile.html", {user: user, borrow: list_items_borrow, lend: list_items_lend, items: list_items});
            });
        });
    });
};

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
                        request.session.latitude = u.latitude;
                        request.session.longitude = u.longitude;
                        response.redirect('/search')
                     });
                }
             }
        }
    });
});

app.get("/items", function(req, res){
    get_items_from_user(req.session.user, function(items){
        res.render("items.html", {items: items});                    
    });
});

app.get('/item/:itemId', requireLogin, function(request, response){
    console.log(request.params);
    console.log("Multiple params?");
    getItem(request.params.itemId, function(item){
        console.log("Item:"+item.Username);
        var price = item.price, duration = item.duration, condition = convertConditionBack(item.condition), description = item.description;
	response.render("item.html",{itemId: request.params.itemId, price: price, duration: convertDuration(duration), condition: condition, description: description, image: item.image, owner:item.Username});
    });
});
function convertDuration(period){

    if(period==1){
        return "Hour";
    }
    if(period==24){
        return "Day";
    }
    if(period==148){
        return "Week";
    }
    else
    {return "Month";} //month, which is about 30 days
}
function convertConditionBack(condition){
    if(condition==4){
        return "New";
    }
    if(condition==3){
        return "Used:Like New";
    }
    if(condition==2){
        return "Used:Very Good";
    }
    if(condition==1){
        return "Used:Good";
    }
    else{
        //0
        return "Used:Acceptable";
    }
}
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
            res.push({name:row.name,condition:row.condition,owner:row.owner,price:row.price, description:row.description,duration:row.duration,image:"https://localhost:8080/static/images/"+row.image });
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
function findDistance(originlat,originlon, destinationlat,destinationlon,callback){

    console.log("finding distance between:"+originlat+ " "+originlon+" "+destinationlat+ " "+destinationlon);
    distance.get(
      {
        origin: originlat+','+originlon,
        destination: destinationlat+','+destinationlon
      },
      function(err, data) {
        if (err) {
            console.log("err:"+err);
            callback(Number.POSITIVE_INFINITY);
        }
        else{
            console.log("Found distance?")
            console.log(data);
            console.log(data.distance);
            callback(data.distance);
        }

    });
}
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
function calcDuration(period){

    if(period==="Hour"){
        return 1;
    }
    if(period==="Day"){
        return 24;
    }
    if(period==="Week"){
        return 148;
    }
    else
    {return 720;} //month, which is about 30 days
}
var server = https.createServer({
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.pem')
}, app).listen(8080);
