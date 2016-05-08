var regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
function testPhone(number){
    return regex.test(number); // returns true if string matches regex, false otherwise
}
var nameregex =  /^[A-Za-z\s.'-]+$/;//alpha characters, hyphens, spaces only, http://tutsme-webdesign.info/bootstrap-validation-states-dynamically/
function testName(name){
    return nameregex.test(name);
}
var usernameregex = /^[0-9A-Za-z\s.'-]+$/;//should match alpha, digit, hyphens
function testUserName(username){
    return usernameregex.test(username);
}
function submitForm(){
    document.getElementById("badusername").style.display="none";
    document.getElementById("badaddress").style.display="none";
    console.log("clicked");
    var validated = true;
    var email = document.getElementById("inputEmail").value;
    if(email.indexOf("@")<0){
        document.getElementById("2").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("2").className="form-group";
    }
    var pw = document.getElementById("inputPassword").value;
    if(pw.length>20){
        document.getElementById("3").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("3").className="form-group";
    }
    var fn = document.getElementById("firstName").value;
    if(!testName(fn)){
        document.getElementById("4").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("4").className="form-group";
    }
    var ln = document.getElementById("lastName").value;
    if(!testName(ln)){
        document.getElementById("5").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("5").className="form-group";
    }
    var address = document.getElementById("address").value;
    var username = document.getElementById("username").value;
    //username check, will have to come up with a username regex
    if(!testUserName(username)||username.indexOf(" ")>=0){
        document.getElementById("1").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("1").className="form-group";
    }
    var phone = document.getElementById("phone").value;
    if(!testPhone(phone)){
        document.getElementById("7").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("7").className="form-group";
    }
    if(validated){
      console.log("SUCCESS");
        //var usereq = new XMLHttpRequest();
        var req = new XMLHttpRequest();
        //probably should encrypt password or something. This doesn't seem very safe
        var params = 'username='+username+'&email='+email+"&pw="+pw+"&fn="+fn+"&ln="+ln+"&address="+address+"&phone="+phone+"&_csrf="+document.getElementById("csrf").value+"&password_agree="+document.getElementById("password_agree").checked;
        req.open('POST', '/update_user', true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.addEventListener("load", function(e) {
            console.log(req.status);
            if(req.status===404){
                //doesn't seem to trigger, even if gibberish
                document.getElementById("badaddress").style.display ="block";
                return false;
            }
            if(req.status===500){
                document.getElementById("badupdate").style.display="block";
                return false;
            }
            if(req.status===200){
                window.location="/my_profile";
            }
        },false);
        req.send(params);
        return false;
   }else{
        //return false;
   }
   //return false;
}

function treat_load(e){
    alert("get");
    if (usereq.status == 200) {
        var content = usereq.responseText;
        if(content.length>0){
            // list appending code
            // should be array of message objects
            var data = JSON.parse(content);
       
            if(data[0].result == true) {
                //alert(data[0].err);
                document.getElementById("1").className+=" has-error";;
            }
            else{
                alert("Registration Successful");
                var req = new XMLHttpRequest();
                //probably should encrypt password or something. This doesn't seem very safe
                var params = 'username='+username+'&email='+email+"&pw="+pw+"&fn="+fn+"&ln="+ln+"&address="+address+"&phone="+phone;
                req.open('POST', '/newuser', true);
                req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                req.send(params);
            }
        }

    } else {
        // something went wrong, check the request status
        // hint: 403 means Forbidden, maybe you forgot your username?
    }
}





var searchrequest;
var counter = 0;
var borrowrequest;
window.addEventListener('load', function(){
    //change username in form field on load based on session. For time being, hardcoded
    searchrequest = new XMLHttpRequest();
    borrowrequest = new XMLHttpRequest();
}, false);


function borrowThing(itemId){
    alert("Request to borrow sent");
    console.log("Attempting to borrow item of id:"+itemId);
    borrowrequest.open('POST', '/borrow/'+itemId, true);
    borrowrequest.addEventListener('load', function(e){
         if (borrowrequest.status == 200) {
                // do something with the loaded content
                var content = borrowrequest.responseText;
                //console.log(initrequest.responseText);
                //console.log(initrequest);
                // check if there is prior messages to load at all
                if(content.length>0){
                    // list appending code
                    // should be array of message objects
                    var data = JSON.parse(content);


                }
            } else {
               //for some reason request didn't succeed. Do nothing
            }
    }, false);

    // start the request, optionally with a request body for POST requests
    borrowrequest.send(null);
}
