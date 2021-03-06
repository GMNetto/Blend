var https = require('https');
var http = require('http');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var async = require("async");
app.use(bodyParser.urlencoded({ extended: false }));
var mysql = require("mysql");
var bCrypt = require("bcrypt-nodejs");
app.use(require('morgan')('dev')); 
var session = require("express-session");
var MySQLStore = require('express-mysql-session')(session);
var cloudinary = require('cloudinary');
var xssFilters = require('xss-filters');
var csrf = require('csurf');


run_local = 0;

var db_config = undefined;
if(process.env.PRODUCTION != undefined || run_local == 1){

    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key:  process.env.API_KEY,
        api_secret:  process.env.API_SECRET
    });

    db_config = {
        host: process.env.CLEARDB_DATABASE_HOST,
        user: process.env.CLEARDB_DATABASE_USER,
        password: process.env.CLEARDB_DATABASE_PASSWORD,
        database: process.env.CLEARDB_DATABASE_SCHEMA
    }

    var options_session = {
        host: process.env.CLEARDB_DATABASE_HOST,
        port: 3306,
        user: process.env.CLEARDB_DATABASE_USER,
        password: process.env.CLEARDB_DATABASE_PASSWORD,
        database: process.env.CLEARDB_DATABASE_SCHEMA,
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


}else{

    cloudinary.config({
        cloud_name: 'blendproject',
        api_key: '578416333291361',
        api_secret: 'ViWiRs9ECUrJda5TEVLaUV72qSw'
    });

    db_config = {
        host: 'localhost',
        user: 'blend_user',
        password: 'blend_password',
        database: 'blend_db'
    }

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
}


var connection;
var sessionStore;
console.log(db_config);

function handleDisconnect() {
  connection = mysql.createConnection(db_config);
  connection.connect(function(err) {
    if(err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000);
    }else{
      sessionStore.connection = connection;
      console.log("CONNECTED")
    }
  });
  connection.on('error', function(err) {
    console.log("A BIG PROBLEM");
    console.log('db error', err, err.code);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      console.log('got different error: ' + err);
      throw err;
    }
  });
}

handleDisconnect();


sessionStore = new MySQLStore(options_session, connection);
app.use(session({
    name: 'server-session-cookie-id',
    secret: 'my express secret',
    saveUninitialized: false,
    resave: false,
    rolling: false,
    store: sessionStore,
}));

var csrfProtection = csrf({cookie: false});

var geocoderProvider = 'google';
var httpAdapter = 'https';
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
app.use('/static', express.static('static'));
app.use('/css', express.static('css'));
app.use('/css', express.static('css'));
app.use('/font-awesome', express.static('font-awesome'))
app.use('/js', express.static('js'));
app.use('/img/portfolio', express.static('img/portfolio'));
app.use('/fonts', express.static('fonts'));
app.use(express.static('bootstrap'));

//google maps distance api

//example: findDistance("Brown University","Brown University");
var distance = require('google-distance');
//multer for file uploads
var multer  = require('multer');
var upload = multer({ dest: './static/images/' });

app.get('/', function(request, response) {
    console.log(request.session.user);
    response.render("../index.html",{has_error:false,has_success:false,multiple:false});
});
app.get('/success', function(request, response){
      response.render("../index.html",{has_error:false,reg_success:true,multiple:false});
});
app.get('/successconditional', function(request, response){
      response.render("../index.html",{has_error:false,reg_success:false,multiple:true});
});
app.get('/signup', csrfProtection, function(request, response) {
    response.render("register.html",{success:false,nameerror:false,addresserror:false, csrftoken:request.csrfToken()});
});
app.get('/forgetpassword', function(request, response) {
    response.render("forgot_password.html");
});

app.get('/profile/:username', requireLogin, function(req, res, next){
    console.log("params " + req.params.username);
    getUser(req.params.username, function(err, user){
        console.log(user);
        if(user===undefined){
            console.log("hhhheeerrreee")
            res.render('page_not_found.html');
        }else{
            if(req.session.user == user.idUser) {
              res.redirect('/my_profile');
            }  else {
              if(err)
                  next();
              else
      	        render_profile(user, res);
            }
        }
    });
});

app.get('/my_profile', requireLogin, function(req, res){
    get_user_by_id(req.session.user, function(err, user){
        if(err)
            res.render("error.html");
        else{
            console.log("Page my profile")
            console.log(user)
            render_my_profile(user, req, res);
        }
    });
});

app.get('/search?*', requireLogin, function(req, res, next){
    res.render("search.html");
});

app.get('/search', requireLogin, function(request, response){
    response.render("search.html");
});

app.get('/feed', requireLogin, function(request, response){
    response.render("feed.html");
});

function getOngoingBorrows(userid, callback){
    connection.query('select * from Borrows as B, User as U, Item as I where B.idProduct=I.idItem and B.idUser = ? and I.owner=U.idUser and B.borrower_commented = 0;', [userid], function(err, result){
        if(err){
            callback(true, undefined);
        }else{
            if(isEmpty(result)){
                console.log("No ongoing borrow transactions");
            }
            callback(err, result);
        }
    })
};
function getOngoingLends(userid, callback){
    connection.query('select * from Borrows, User as U,Item as I where Borrows.idProduct = I.idItem and U.idUser=Borrows.idUser and Borrows.idProduct in (select idItem from Item where Item.owner=?);', [userid], function(err, result){
        if(err){
            callback(true, undefined);
        }else{
            if(isEmpty(result)){
                console.log("No ongoing lent item transactions");
            }
            callback(err, result);
        }
    }
)};
app.post('/searchquery', requireLogin, function(request, response){
    console.log("Received request for search");
    console.log(request.body);
    console.log(request.params);
    var itemName = request.body.itemName;
    //var priceFloor = request.body.priceFloor;
    var priceCeil = request.body.priceCeil;
    if(priceCeil.toString().length==0){
        priceCeil = Number.MAX_VALUE;
    }
    var period = request.body.period;
    if(period.length==0){
        period = "Hour";
    }
    var condition = request.body.condition;
    if(condition.length==0){
        condition = "Used:Acceptable";
    }
    var minrating = request.body.minRating;
    if(minrating.toString().length==0){
        minrating = 0;
    }
    console.log("Filtering for condition:"+convertCondition(condition) + " priceCeil:"+priceCeil+ " minrating:"+minrating + " itemname " + itemName);
    console.log("query made by:"+request.session.user);
    connection.query('SELECT * FROM (SELECT * from Item WHERE name LIKE "%"?"%" AND price<=? AND duration>=?) AS Items LEFT JOIN User ON Items.owner=User.idUser WHERE lender_rating>=? AND Items.condition>= ?', [itemName,priceCeil,calcDuration(period), minrating,convertCondition(condition)], function (err,rows) {
            if(err){
                console.log(err);
            }
            else{
                //console.log("FOUND SEARCH STUFF");
                //console.log("USER?");
                //console.log(request.session.user);
                var row;
                var tosend =[];
                var originallat = request.session.latitude;
                var originallon = request.session.longitude;
                //console.log("lat "+originallat)
                //console.log("rows " + rows)
                for(i = 0;i<rows.length;i++){
                    row = rows[i];
                    tosend.push({itemid:row.idItem,description:row.description,username: row.Username,name:row.name,price:row.price,link:"item/"+row.idItem, distance:undefined,lon:row.longitude,lat:row.latitude,image:row.image});
                }
                async.each(tosend, function(item, callback) {
                  // Perform operation on file here.
                  console.log('Processing item ' + item.name);
                  findDistance(originallat,originallon,item.lat,item.lon,function(result){
                        //console.log("done");
                        //should not happen, only happened when google went down for some reason
                        if(result===undefined || result == Number.POSITIVE_INFINITY){
                            item.distance = Number.MAX_VALUE+ " km";
                        }
                        else{
                            item.distance =result.replace(',','');
                        }
                        callback();
                    });

                }, function(err){
                    if( err ) {
                      console.log('A row failed to process');
                      response.json([]);
                    } else {
                      console.log('All rows processsed');
                        console.log(tosend);
                        response.json(tosend);

                    }
                });
            }
    });
});

app.get('/recentitems',function(request, response){
    connection.query('select * from Item left join User on Item.owner=User.idUser order by idItem DESC LIMIT 3', function (err,rows) {
        if(err){

        }
        else{
            var row;
            var tosend =[];
            var originallat = request.session.latitude;
            var originallon = request.session.longitude;
            for(i = 0;i<rows.length;i++){
                row = rows[i];
                tosend.push({itemid:row.idItem,description:row.description,username: row.Username,name:row.name,price:row.price,link:"item/"+row.idItem,distance:undefined,lon:row.longitude,lat:row.latitude,image:row.image});
            }
            async.each(tosend, function(item, callback) {
                  // Perform operation on file here.
                  console.log('Processing item ' + item.name);
                  findDistance(originallat,originallon,item.lat,item.lon,function(result){
                        //console.log("done");
                        //should not happen, only happened when google went down for some reason
                        if(result===undefined || result == Number.POSITIVE_INFINITY){
                            item.distance = Number.MAX_VALUE+ " km";
                        }
                        else{
                            item.distance =result.replace(',','');
                        }
                        callback();
                    });

                }, function(err){
                    if( err ) {
                      console.log('A row failed to process');
                      response.json([]);
                    } else {
                      console.log('All rows processsed');
                        console.log(tosend);
                        response.json(tosend);

                    }
                });
        }
    });
});

app.get('/lend', requireLogin, function(request, response) {
    console.log(request.session.user);
    response.render("lend.html",{success:false});
});
app.get('/transactions', function(request, response) {
     get_user_by_id(request.session.user, function(err, user){
        if(err)
            response.render("error.html");
        else {
          get_items_from_user(request.session.user, function(err, result) {
            if(err) {
              response.render("error.html");
            } else {

                var row;
                var items = [];
                console.log("length of result");
                console.log(result.length);
                for (var i = 0; i < result.length; i++) {
                  console.log("wihtin for loop");
                  row = result[i];
                  items.push({item_name:row.name, item_picture:row.image, idItem:row.idItem});
                }

                // Should I send JSON.parse(tosend) or response.json?
                render_transactions(user, response, items);

              }
          });
        }

    });
    //response.render("transactions.html");




});
function render_transactions(user, res, items){
    console.log("render: "+user.idUser);
    getOngoingBorrows(user.idUser, function(err_borrow, list_items_borrow){
        getOngoingLends(user.idUser, function(err_lend, list_items_lend){
            if(err_borrow || err_lend){
                console.log("An error just happened");
                res.render("error.html");
                res.end();
            }
            else{
            var l_B = list_items_borrow, l_L = list_items_lend;
            //l_B["borrow"] = [{"name": 'Hello'}, {'name': 'Bye'}];
            console.log(l_B);
            console.log("lending stuff");
            console.log(l_L);
            var hasL;
            if(l_L===undefined){
                hasL=false;

            }
            else{
                hasL=(l_L.length>0);

            }
            var hasB;
            if(l_B===undefined){
                hasB=false;
            }
            else{
                hasB =(l_B.length>0);
            }
            console.log("hasB:"+hasB);
            console.log("hasL:"+hasL);
            res.render("transactions.html",{has_borrows:(l_B.length>0), borrows:l_B, haslend:hasL, lend:l_L, items: items });
            //res.send({ has_borrows:true,haslend:true});
            //res.render("transactions.html");
            //console.log("end");
            }
        });
    });
};
app.post('/newuser', csrfProtection, function(request, response){
    //adding new user
    var email = xssFilters.inHTMLData(request.body.email);
    //extract params and hash pw
    var salt = bCrypt.genSaltSync(10);
    var pw = bCrypt.hashSync(request.body.pw, salt);//request.body.pw;
    var ln = xssFilters.inHTMLData(request.body.ln);
    var fn = xssFilters.inHTMLData(request.body.fn);
    var address = xssFilters.inHTMLData(request.body.address);
    var username = xssFilters.inHTMLData(request.body.username);
    var phone = xssFilters.inHTMLData(request.body.phone);
    var profileurl = "/profile/"+username;
    console.log(email);
    console.log(pw);
    console.log(fn);
    console.log(ln);
    console.log(address);
    console.log(phone);
    console.log(username);
    console.log(profileurl);
    //pretty sure this is going to be assigned to a different variable, pw is just a standin for now so the sql query doesn't bug out
    connection.query('SELECT * from User WHERE Username = ? OR email = ?', [username,email], function (err,rows) {
        console.log(rows);
         if (rows.length>0||err) {
             console.log("user exists already");
             //return response.render("register.html",{success:false,nameerror:true,addresserror:false});
             response.sendStatus(500);
         }
        else{
            geocoder.geocode(address, function(error, res) {
                //if err probably not an actual address
                //tries to catch one or the other
                if(error||res[0]===undefined){
                    console.log("Did not find address");
                    response.sendStatus(404);
                }
                else{
                    console.log("Found address");
                    //insert into db
                    connection.query('INSERT INTO User VALUES(?,?,?,?,?,?,0.0,0,0.0,0,?,?,?,?,?,?)', [null, username, pw, salt, email,phone,profileurl,fn,ln,address,res[0]['latitude'],res[0]['longitude']], function (err) {
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log("Created new user");
                            //success
                            if(res.length>1){
                                console.log("multiple addresses found:"+res.length);
                                response.sendStatus(201);
                            }
                            else{
                                response.sendStatus(200);
                            }
                        }
                    });
                }
            });
        }
    });
});
app.post('/usernameverif', function(req, res){
     console.log("Verifying username");
     console.log(req.body);
     connection.query('SELECT * from User WHERE Username = ? OR email = ?', [req.body.username,req.body.email], function (err,rows) {
            var response = [];
            if (rows.length>0) {
              response.push({result:true, err:'Username or email already exists'});
            }
            else {
              response.push({result:false});
            }
            console.log("response "+response)
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
             response.sendStatus(409);
         }
         else{
             //insert into db. Note: does prevent duplicate offers, since each is unique
             //transaction ownerid, accepted (boolean), itemId, finished (boolean),date
             //first check if there is an ongoing transaction concerning that item however
             connection.query('select * from Borrows where accepted = 1 and finished = 0 and idProduct = ?', [request.params.itemId], function (err,rows) {
                 checkAlreadyRequested(request.params.itemId, borrowuser, function(check){
                    if(rows.length>0 || check){
                        //currently an ongoing transactions, block the borrowing
                        console.log("detected ongoing transaction. Blocking");
                        response.sendStatus(500);
                    }else{
                        connection.query('INSERT INTO Borrows VALUES(?,?,?,0,0,CURDATE(),0,0)', [null, request.session.user,request.params.itemId], function (err) {
                            if(err){
                                console.log(err);
                                response.sendStatus(404);
                            }else{
                                console.log("Borrowed!!!!!");
                                response.sendStatus(200);
                            }
                        });
                    }
                 });
             });
         }
      });
});
// lender transaction logic, takes in one param and transaction id from the url
app.post('/lender/:transactionId', requireLogin, function(request, response){
    console.log("got lender accept for transaction:"+request.params.transactionId);
    var responseType = request.body.type;
    if(responseType>0){
        //accepted, remove other requests for that item that aren't accepted yet
        connection.query('SELECT * FROM Borrows WHERE idBorrows= ? AND accepted = 0', [request.params.transactionId], function (err,rows) {
            if(err){

            }
            else{
                if(rows.length>0){
                    console.log(rows[0]);
                    connection.query('DELETE FROM Borrows WHERE idBorrows != ? AND idProduct = ? AND accepted = 0', [request.params.transactionId,rows[0].idProduct], function (err) {
                                if(err){
                                    console.log(err);
                                }
                    });
                    connection.query('UPDATE Borrows SET accepted=1,inital_date=CURDATE() WHERE idBorrows= ? ', [request.params.transactionId], function (err) {
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log("Borrower accepted");
                        }

                    });
            }
            }
        });

    }
    else{
        //declined, remove that particular transaction
        connection.query('DELETE FROM Borrows WHERE idBorrows= ? ', [request.params.transactionId], function (err) {
                    if(err){
                        console.log(err);
                    }
            });
    }
});
app.post('/borrowercancel/:transactionId', requireLogin, function(request, response){
    //declined, remove transaction if not finished
        connection.query('DELETE FROM Borrows WHERE idBorrows= ? AND accepted!=1', [request.params.transactionId], function (err) {
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Borrower canceled transaction");
                }
            });
});
// borrower transaction logic
app.post('/borrower/:transactionId', requireLogin, function(request, response){
    console.log("received borrower response for transaction:"+request.params.transactionId);
    var responseType = request.body.type;
    if(responseType>0){
        //accepted, update ongoing transaction in Borrows
        connection.query('UPDATE Borrows SET accepted=1 WHERE idBorrows= ? ', [request.params.transactionId], function (err) {
                    if(err){
                        console.log(err);
                    }
                else{
                    console.log("Borrower accepted");
                }

            });

    }
    else{
        //declined, remove transaction
        connection.query('DELETE FROM Borrows WHERE idBorrows= ? ', [request.params.transactionId], function (err) {
                    if(err){
                        console.log(err);
                    }
                else{
                    console.log("Borrower declined");
                }
            });
    }
});
//for lender finish confirmation
app.post('/finish/:transactionId', requireLogin, function(request, response){
    var responseType = request.body.type;
    if(responseType>0){
        //accepted, update transaction
         connection.query('UPDATE Borrows SET finished=1 WHERE idBorrows= ? ', [request.params.transactionId], function (err) {
                    if(err){
                        console.log(err);
                    }
            });
    }
    else{
        //declined, nothing really happens at this point
    }
});
app.get('/mytransactions', requireLogin, function(request, response){
    console.log("received request for mytransactions from: "+request.session.user);
    //get user's current transactions for current requested/borrowed items, package into json
     connection.query('SELECT * from Borrows LEFT JOIN Item ON Borrows.idProduct=Item.idItem WHERE idUser = ? AND finished= 0 ', [request.session.user], function (err,rows) {
        if(err){
            console.log(err);
        }
         else{
            var row;
            var tosend =[];
            for(i = 0;i<rows.length;i++){
                row = rows[i];
                console.log(row);
                tosend.push({accepted:row.accepted,finished:row.finished,name:row.name,duration:row.duration,image:row.image});

            }
             response.json(tosend);
         }
    });
});
app.get('/itemtransactions', requireLogin, function(request, response){
    //get user's current transactions involving owned items, package into json
    console.log("received request for itemtransactions from: "+request.session.user);
     connection.query('SELECT * from Borrows LEFT JOIN Item ON Borrows.idProduct=Item.idItem WHERE owner= ? AND finished= 0 ', [request.session.user], function (err,rows) {
        if(err){
            console.log(err);
        }
         else{
            var row;
            var tosend =[];
            for(i = 0;i<rows.length;i++){
                row = rows[i];
                console.log(row);
                tosend.push({accepted:row.accepted,finished:row.finished,name:row.name,duration:row.duration,image:row.image});

            }
             response.json(tosend);
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
    var user = xssFilters.inHTMLData(request.session.user);
    var name = xssFilters.inHTMLData(request.body.itemName);
    var price = xssFilters.inHTMLData(request.body.price);
    var period = xssFilters.inHTMLData(request.body.period);
    var periodHours = calcDuration(period);
    var condition = convertCondition(request.body.condition);
    var description = xssFilters.inHTMLData(request.body.description);
    cloudinary.uploader.upload("static/images/"+image, function(result){
        console.log("static/images/"+image);
        console.log("Uploading image");
        console.log(result);
    //});
    //var image =
    //deposit thing in db along with filename
    /**
     connection.query('UPDATE Item WHERE Username = ? OR email = ?', [uname,uname], function (err,rows) {

    });
    **/
    connection.query('SELECT * from User WHERE idUser = ?', [user], function (err,rows) {
        if(err){

        }
        if(rows.length==0){
            //should not happen, but just adding in a condition in the unlikely event this happens
        }
        else{
            console.log(rows[0]);
            var userid = rows[0].idUser;
            connection.query('INSERT INTO Item VALUES(?,?,?,?,?,?,?,?)', [null,name, condition, userid,price,description,periodHours,result.secure_url], function (err) {
                    if(err){
                        console.log('Adding new item failed');
                        console.log(err);
                    } else {
                      response.render('lend.html',{success:true});
                    }
            });
        }
      });
    });
});


function aux(req, res, next){
    console.log("CSRF TOKEN");
    console.log(req.session.user);
    console.log(req.body._csrf);
    console.log(req.body.phone);
};

function update_user_db(query, list_prepared_statements, request, response, res){
    connection.query(query, list_prepared_statements, function (err) {

        if(err){
            response.sendStatus(500);
        }else{
            request.session.latitude = res[0]['latitude'];
            request.session.longitude = res[0]['longitude'];
            //response.sendStatus(200);
            response.redirect('/my_profile');
        }
    });
}

app.post('/update_user', requireLogin, upload.single("img"), function(request, response){
    console.log("Received user to update");
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
    //adding new user
    var email = request.body.email;
    var salt = bCrypt.genSaltSync(10)
    var pw = bCrypt.hashSync(request.body.pw, salt);//request.body.pw;
    var ln = request.body.ln;
    var fn = request.body.fn;
    var address = request.body.address;
    var username = request.body.username;
    var phone = request.body.phone;

    geocoder.geocode(address, function(error, res) {
        if(error){
            console.log("Did not find address");
            response.sendStatus(404);
        }
        else{
            cloudinary.uploader.upload("static/images/"+image, function(result){
                console.log("static/images/"+image);
                console.log("Uploading image");
                console.log(result);
                console.log(request.body.password_agree);

                if(request.body.password_agree === "true"){
                    console.log("UPDATING!!!!!!!!!!!");
                    query = 'UPDATE User SET Username=?, password=?, salt=?, email=?, phone=?, profile_url=?, first_name=?, last_name=?, address=?, latitude=?, longitude=? where idUser=?';
                    list = [username, pw, salt, email,phone,result.secure_url,fn,ln,address,res[0]['latitude'],res[0]['longitude'], request.session.user];
                    update_user_db(query, list, request, response, res);
                }else{
                    query = 'UPDATE User SET Username=?,email=?, phone=?, profile_url=?, first_name=?, last_name=?, address=?, latitude=?, longitude=? where idUser=?';
                    list = [username, email,phone,result.secure_url,fn,ln,address,res[0]['latitude'],res[0]['longitude'], request.session.user];
                    update_user_db(query, list, request, response, res);
                }

           });
        }
    });

    //response.redirect('/my_profile');

});

app.post('/newfeedback', requireLogin, function(request, response){
    console.log(request.body);
    var newrating = parseFloat(request.body.rating);
    var feedbackuser = xssFilters.inHTMLData(request.body.feedbackUser);
    var feedbacktype = xssFilters.inHTMLData(request.body.transactionType);
    var feedbackuserid = xssFilters.inHTMLData(request.body.feedbackuserId);
    //make sure that logged in user can actually comment on transaction
     connection.query('Select * from (Select * from Borrows where idBorrows=?) as B left join Item on B.idProduct=Item.idItem where idUser = ? or owner= ?', [request.body.transactionId, request.session.user,request.session.user], function (err,rows) {
         if(rows.length>0){
            connection.query('SELECT * from User WHERE idUser = ?', [feedbackuserid], function (err,rows) {
                if(rows.length>0){
                    //console.log("updating row:");
                    //console.log(rows[0]);
                    var row = rows[0];
                    //calc new cumulative moving average = (new rating + old total*current average)/(old total+1)
                    var newaverage;
                    if(feedbacktype=="borrower"){
                        connection.query('SELECT * from Borrows WHERE idBorrows = ? AND finished=0 AND lender_commented=0', [request.body.transactionId], function (err,rows) {
                            if(rows.length>0){
                                var curborrows = row.total_borrow_ratings;//n
                                newaverage = ((newrating +(curborrows*row.borrower_rating))/parseFloat(curborrows+1)).toFixed(1);
                                console.log("borrow newaverage:"+newaverage);
                                //http://stackoverflow.com/questions/2762851/increment-a-database-field-by-1
                                connection.query('UPDATE User SET borrower_rating = ?, total_borrow_ratings = total_borrow_ratings + 1 WHERE idUser = ?', [newaverage,feedbackuserid], function (err) {
                                    if(err){
                                        //feedback update failed
                                        console.log("updating borrower rating failed");
                                    }
                                    else{
                                        //if comment on borrower, set finished.
                                        connection.query('UPDATE Borrows SET finished=1,lender_commented=1 WHERE idBorrows= ? ', [request.body.transactionId], function (err) {
                                            if(err){
                                                console.log(err);
                                            }
                                            else{
                                                //done
                                                get_user_by_id(request.session.user, function(err, user){
                                                    if(err)
                                                        response.render("error.html");
                                                    else {
                                                      get_items_from_user(request.session.user, function(err, result) {
                                                        if(err) {
                                                          response.render("error.html");
                                                        } else {

                                                            var row;
                                                            var items = [];
                                                            console.log("length of result");
                                                            console.log(result.length);
                                                            for (var i = 0; i < result.length; i++) {
                                                              console.log("wihtin for loop");
                                                              row = result[i];
                                                              items.push({item_name:row.name, item_picture:row.image, idItem:row.idItem});
                                                            }

                                                            // Should I send JSON.parse(tosend) or response.json?
                                                            render_transactions(user, response, items);

                                                          }
                                                      });
                                                    }

                                                });
                                                /**
                                                updateFeed(idBorrows, function(){
                                                    get_user_by_id(request.session.user, function(err, user){
                                                        if(err)
                                                            response.render("error.html");
                                                        else
                                                            render_transactions(user, response);
                                                    });
                                                });
                                                **/
                                            }
                                        });
                                        }
                                 });

                            }
                            else{
                                //no nonfinished transaction to comment on
                                console.log("Transaction already has been commented on by lender ")
                            }
                       });
                    }
                    else{
                        connection.query('SELECT * from Borrows WHERE idBorrows = ? AND borrower_commented=0', [request.body.transactionId], function (err,rows) {
                            if(rows.length>0){
                                //lender update logic

                                var curlender = row.total_lend_ratings;

                                newaverage = ((newrating +(curlender*row.lender_rating))/parseFloat(curlender+1.0)).toFixed(1);
                                console.log("lender newaverage:"+newaverage);
                                connection.query('UPDATE User SET lender_rating = ?, total_lend_ratings = total_lend_ratings + 1 WHERE idUser = ?', [newaverage,feedbackuserid], function (err) {
                                    if(err){
                                        //feedback update failed
                                        console.log("updating lender rating failed");
                                    }
                                    else{
                                        connection.query('UPDATE Borrows SET borrower_commented=1 WHERE idBorrows= ? ', [request.body.transactionId], function (err) {
                                        if(err){
                                            console.log(err);
                                        }
                                        else{
                                             get_user_by_id(request.session.user, function(err, user){
                                                if(err)
                                                    response.render("error.html");
                                                else {
                                                  get_items_from_user(request.session.user, function(err, result) {
                                                    if(err) {
                                                      response.render("error.html");
                                                    } else {

                                                        var row;
                                                        var items = [];
                                                        console.log("length of result");
                                                        console.log(result.length);
                                                        for (var i = 0; i < result.length; i++) {
                                                          console.log("wihtin for loop");
                                                          row = result[i];
                                                          items.push({item_name:row.name, item_picture:row.image, idItem:row.idItem});
                                                        }

                                                        // Should I send JSON.parse(tosend) or response.json?
                                                        render_transactions(user, response, items);

                                                      }
                                                  });
                                                }

                                            });
                                        }
                                        });
                                    }
                                 });

                            }
                            else{
                                console.log("Borrower has already commmented on transaction")
                            }
                        });
                    }
                }
                else{
                    console.log("Couldn't find user");
                }
        });
        }
         else{
             console.log("user did not participate in transaction");
         }
 });
});
app.get('/feedback/:transactionId', requireLogin, function(request, response){
    //some query to check if this is valid feedback for a COMPLETED transaction. Since it's still kind of fluid right now, there won't be a check here
    connection.query('SELECT * from Borrows LEFT JOIN Item ON Borrows.idProduct=Item.idItem WHERE idBorrows= ?', [request.params.transactionId], function (err,rows) {
        //won't do anything if this condition is true
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
                    var feedbackuserrating;
                    //shows rating on feedback page
                    if(usertype=="borrower"){
                        feedbackuserrating = rows[0].borrower_rating;
                    }
                    else{
                        feedbackuserrating = rows[0].lender_rating;
                    }
                    var userrow = rows[0];
                    console.log(request.params.transactionId+" "+" "+ request.session.user+ " "+ request.session.user+" "+request.session.username);
                    connection.query('Select * from (Select * from Borrows where idBorrows=?) as B left join Item on B.idProduct=Item.idItem where idUser = ? or owner= ?', [request.params.transactionId, request.session.user,request.session.user], function (err,rows) {
                        if(rows.length>0){
                            console.log(rows[0]);
                            console.log(feedbackuserrating);
                            console.log()
                            response.render("feedback.html",{curuser:request.session.username,transactionid:request.params.transactionId,type:usertype,itemName:row.name,feedbackuser:userrow.Username,feedbackuserid:usertorate,image:row.image,rating:feedbackuserrating,duration:row.duration,date:row.inital_date});
                        }
                        else{
                            console.log("user is not involved in this transaction");
                        }
                     });
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

function checkAlreadyRequested(itemId, userId, callback){
    connection.query('select * from Borrows where idUser=? and idProduct=? and accepted=0',[userId, itemId], function(err, result){
        if(err || !isEmpty(result)){
            return callback(true);
        }else{
            return callback(false);
        }
    });
};

function getUser(username, callback){
    connection.query('Select * from User where username=?',[username], function(err, result){
        if(err || isEmpty(result)){
            console.log("No user");
            return callback(true, undefined);
        }else{
            user = result
            console.log(user.Uername);
            return callback(err, user[0]);
        }
    });
};

function get_user_by_id(id_user, callback){
    connection.query('Select * from User where idUser=?',[id_user], function(err, result){
        if(err || isEmpty(result)){
            return callback(true, undefined);
        }else{
            user = result
            return callback(err, user[0]);
        }
    });
};

function getItem(item_id, callback){
    console.log(item_id);
    connection.query('select Item.name, Item.condition, price, description, duration, image, Username from Item, User where Item.idItem = ? and Item.owner = User.idUser',[item_id], function(err, result){
        if(err || isEmpty(result)){
	        console.log("No item")
            return callback(true, undefined);
	    }else{
	        item = result;
	        return callback(err, item[0]);
	    }
    });
};

function getRecentBorrow(username, limit, callback){
    connection.query('select * from Item left join User on owner=User.idUser where Item.idItem in (select idProduct from Borrows as B, User as U where B.idUser=U.idUser and U.username=? order by B.inital_date) limit ?', [username, limit], function(err, result){
        if(err/* || isEmpty(result)*/){
            console.log("No item");
            callback(true, undefined);
        }else{
            callback(err, result);
        }
    })
};

function getRecentLend(username, limit, callback){
    connection.query('select * from Item left join User on owner=User.idUser where Item.idItem in (select idProduct from Borrows as B, User as U, Item as I where B.idProduct=I.idItem and I.owner=U.idUser and U.username=? order by B.inital_date) limit ?', [username, limit], function(err, result){
        if(err/* || isEmpty(result)*/){
            console.log("No item");
            callback(true, undefined);
        }else{
            callback(err, result);
        }
    }
)};


function get_items_from_user(idUser, callback){
    console.log('user '+ idUser)
    connection.query('select * from Item as I where I.owner = ?', [idUser], function(err, result){
        if(err/* || isEmpty(result)*/){
            console.log("No item");
            callback(true, undefined);
        }else{
            console.log("within get_items_from_user method");
            console.log(result);
            callback(err, result);
        }
    }
)};


function render_profile(user, res){
    console.log("render: "+user.Username);
    getRecentBorrow(user.Username, 3, function(err_borrow, list_items_borrow){
        getRecentLend(user.Username, 3, function(err_lend, list_items_lend){
            if(err_borrow || err_lend){
                res.render("error.html");
                res.end();
            }
            var l_B = list_items_borrow, l_L = list_items_lend;
            //l_B["borrow"] = [{"name": 'Hello'}, {'name': 'Bye'}];
            var list_items_borrow_has_items = (list_items_borrow.length > 0)
            var list_items_lend_has_items = (list_items_lend.length > 0)
            console.log("rendering profile");
            user["lender_ratings"] = user.lender_rating
            user["borrower_ratings"] = user.borrower_rating
            res.render("profile.html", {user: user, has_borrow: list_items_borrow_has_items, borrow: list_items_borrow, has_lend: list_items_lend_has_items, lend: list_items_lend});
        });
    });
};

function render_my_profile(user, req, res){
    getRecentBorrow(user.Username, 3, function(err_borrow, list_items_borrow){
        getRecentLend(user.Username, 3, function(err_lend, list_items_lend){
            get_items_from_user(user.idUser, function(err_items, list_items){
                if(err_borrow || err_lend || err_items)
                    res.render("error.html");
                else
                    var list_items_borrow_has_items = (list_items_borrow.length > 0)
                    var list_items_lend_has_items = (list_items_lend.length > 0)
                    console.log(list_items_borrow);
                    console.log("rendering my profile");
                    console.log(user.address);
                    user.address = String(user.address)
                    user.password = "11111111111111";
                    user["lender_ratings"] = user.lender_rating
                    user["borrower_ratings"] = user.borrower_rating
                    res.render("my_profile.html", {user: user, has_borrow: list_items_borrow_has_items, borrow: list_items_borrow, has_lend: list_items_lend_has_items, lend: list_items_lend, items: list_items, csrftoken:""});
            });
        });
    });
};

app.post('/login', function(request, response){
    //console.log(request.body);
    var uname = request.body.lg_username;
    var pw = request.body.lg_password;
    console.log("Received login request");
    connection.query('SELECT * from User WHERE Username = ? OR email = ?', [uname,uname], function (err,rows) {
        if(err){
            console.log('User lookup failed');
            console.log(err);
            response.render('../index.html',{has_error:true,reg_success:false});
        }
        else{
            console.log(rows);
            if(rows.length>0){
                if(rows[0].Username===uname||rows[0].email===uname){
                    console.log("FOUND:"+rows[0]);
                    if(bCrypt.compareSync(pw,rows[0].password)){
                    //if(pw == rows[0].password){
                        console.log("FOUND ROW");
                        //request.session.user = "a";
                        var u = getUser(uname, function(err, u){
                            console.log("returned id " + u.idUser);
                            request.session.user = u.idUser;
                            request.session.username = u.Username;
                            request.session.latitude = u.latitude;
                            request.session.longitude = u.longitude;

                            response.redirect('/search')
                         });
                    }
                    else{
                        //incorrect password
                        response.render('../index.html',{has_error:true,reg_success:false});
                    }
                 }
                else{
                    //login error
                    //no matching username
                    response.render('../index.html',{has_error:true,reg_success:false});
                }
            }
            else{
                //login error
                //empty
                response.render('../index.html',{has_error:true,reg_success:false});
            }
        }
    });
});

app.get("/items", function(req, res){
    get_items_from_user(req.session.user, function(err, items){
        if(err){
            res.status(404);
            res.render("error.html", {url: req.url});
        }else{
            res.render("items.html", {items: items});
        }
    });
});

app.get('/item/:itemId', requireLogin, function(request, response, next){
    getItem(request.params.itemId, function(err, item){
        if(err){
            next();
        }else{
            var price = item.price, duration = item.duration, condition = convertConditionBack(item.condition), description = item.description;
	        response.render("item.html",{itemId: request.params.itemId, price: price, duration: convertDuration(duration), condition: condition, description: description, image: item.image, owner:item.Username});
        }
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
            res.push({name:row.name,condition:row.condition,owner:row.owner,price:row.price, description:row.description,duration:row.duration,image:row.image });
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
            response.sendFile(row.image);
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
            console.log("Error distance");
            callback(Number.POSITIVE_INFINITY);
        }
        else{
            console.log("Found distance?")
            //console.log(data);
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

app.post("/removeItem", requireLogin, function(request, response) {
  console.log("apples");
  console.log(request.body);

  connection.query("DELETE FROM Borrows WHERE idProduct = ? and ((finished = 1 AND accepted = 1) OR (finished = 0 AND accepted = 0))", [request.body.idItem], function (err, result) {
              if(err){
                  console.log(err);
              } else {
                console.log("THE RESULTING RESULTS");
                console.log(result);

                connection.query("SELECT idProduct from Borrows where idProduct = ? AND finished = 0", [request.body.idItem], function (err3, results) {
                  console.log("in second query");
                  console.log(results);
                  if(result.affectedRows == 0 && results.length != 0) {
                    console.log("Reached SHOULD BE RETURNING NOW");

                    response.json({status: false});
                  } else {

                    console.log(request.session.user);
                    console.log(request.body.idItem);
                    console.log("Successfully removed from db!");

                    connection.query("DELETE FROM Item where idItem = ? ", [request.body.idItem], function (err2) {
                                if(err){
                                    console.log(err);
                                } else {
                                  console.log(request.session.user);
                                  console.log(request.body.idItem);
                                  console.log("Successfully removed from db!");
                                  response.json({status: true});
                                }
                    });


                	}
                })





              }
    });



});

function isEmpty(object){
    return Object.keys(object).length === 0;
};

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

app.use(function(req, res, next){
    res.status(404);
    if(req.accepts("html")){
        res.render('error.html', {url: req.url});
        return;
    }
});

app.set('port', (process.env.PORT || 5000));

var serverhttp = http.createServer(app).listen(app.get('port'));

var server = https.createServer({
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.pem')
}, app).listen(8080);


var io = require('socket.io').listen(serverhttp);
var ios = require('socket.io').listen(server);

function get_ten_transactions(callback){
     connection.query("select Username, name, profile_url, image from Borrows, Item, User where idItem = idProduct and Borrows.idUser=User.idUser order by Borrows.inital_date desc limit 10",function(err1,transactions) {
        connection.query("select Username, profile_url from Borrows, Item, User where idItem = idProduct and Item.owner=User.idUser order by Borrows.inital_date desc limit 10",function(err2,lenders) {
            if(err1){
                console.log('err1'+err1);
            }else if(err2){
                console.log('err2'+err2);
            }
            else{
                console.log(transactions.length);
                callback(transactions, lenders);
            }
        });
     });
};

io.sockets.on('connection', function(socket){
    socket.on('join', function(callback){
        console.log("emiting%%%%%%%%%%%%%%%%%%%5");
        get_ten_transactions(function(transactions, lenders){
            console.log("Calling last 10 items ");
            callback(transactions, lenders);
        });
    });
});


ios.sockets.on('connection', function(socket){
    socket.on('join', function(callback){
        console.log("emiting%%%%%%%%%%%%%%%%%%%5");
        get_ten_transactions(function(transactions, lenders){
            console.log("Calling last 10 items ");
            callback(transactions, lenders);
        });
    });
});

function updateFeed(idBorrows, callback){
        connection.query("select Username, name, profile_url, image from Borrows, Item, User where idBorrows = ? and Borrows.idUser=User.idUser order by Borrows.inital_date desc limit 10", [idBorrows], function(err1,transactions) {
        connection.query("select Username, profile_url from Borrows, Item, User where idBorrows = ? and Item.owner=User.idUser order by Borrows.inital_date desc limit 10", [idBorrows],function(err2,lenders) {
            if(err1){
                console.log('err1'+err1);
            }else if(err2){
                console.log('err2'+err2);
            }else{
                io.sockets.emit("new_transaction", transactions[0], lenders[0]);
            }
     });
    });
};
