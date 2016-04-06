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
    /**
    console.log("Sent form");
    var email = document.getElementById("inputEmail").value;
    var pw = document.getElementById("inputPassword").value;
    var fn = document.getElementById("firstName").value;
    var ln = document.getElementById("lastName").value;
    var address = document.getElementById("address").value;
    var username = document.getElementById("username").value;
    var phone = document.getElementById("phone").value;
    //e.preventDefault();
    
    **/
    var validated = true;
    //retrieve values
    var email = document.getElementById("inputEmail").value;
    if(email.length===0||email.indexOf("@")<0){
        document.getElementById("2").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("2").className="form-group";
    }
    var pw = document.getElementById("inputPassword").value;
    if(pw.length<6||pw.length>20){
        //there is no addClass without jQuery:http://stackoverflow.com/questions/507138/how-do-i-add-a-class-to-a-given-element
        document.getElementById("3").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("3").className="form-group";
    }
    var fn = document.getElementById("firstName").value;
    if(fn.length===0||!testName(fn)){
        document.getElementById("4").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("4").className="form-group";
    }
    var ln = document.getElementById("lastName").value;
    if(ln.length===0||!testName(ln)){
        document.getElementById("5").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("5").className="form-group";
    }
    var address = document.getElementById("address").value;
    if(address.length===0){
        document.getElementById("6").className+=" has-error";
        validated=false;
    }
    else{
        document.getElementById("6").className="form-group";
    }
    var username = document.getElementById("username").value;
    //username check, will have to come up with a username regex
    if(username.length===0||!testUserName(username)){
        document.getElementById("1").className+=" has-error";;
        validated=false;
    }
    else{
        document.getElementById("1").className="form-group";
    }
    var phone = document.getElementById("phone").value;
    if(!testPhone(phone)){
        document.getElementById("7").className+=" has-error";;
        validated=false;
    }
    else{
        document.getElementById("7").className="form-group";
    }
    if(validated){
        //display success somehow?
        document.getElementById("success").style.display="block";
        //http://stackoverflow.com/questions/8064691/how-do-i-pass-along-variables-with-xmlhttprequest
        var req = new XMLHttpRequest(); 
        //probably should encrypt password or something. This doesn't seem very safe
        var params = 'username='+username+'&email='+email+"&pw="+pw+"&fn="+fn+"&ln="+ln+"&address="+address+"&phone="+phone;
        req.open('POST', '/newuser', true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send(params);
        return false;
    }
    else{
        return false;
    }
    return false;
}