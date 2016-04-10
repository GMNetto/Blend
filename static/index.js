/*window.addEventListener('load', function(){
    req = new XMLHttpRequest();//for login reqs
    
    
}, false);
function login(){
    var email = document.getElementById("inputEmail").value;
    var password = document.getElementById("inputPassword").value;
    var params = 'email='+email+"&password="+password;
    req.open('POST', '/login', true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(params);
     // add an event handler
    req.addEventListener('load', function(e){
        //login request if successful
        if (request.status == 200) {
             console.log("RECEIVED RESPONSE");       
                
        } else {
            // something went wrong, check the request status
            // hint: 403 means Forbidden, maybe you forgot your username?
        }
    }, false);
}*/

$(document).ready(function(){
    $('.btn-login').click(function(e){
         e.preventDefault();
         alert("hello"); 
         var email = document.getElementById("inputEmail").value;
         var password = document.getElementById("inputPassword").value;

         $.post("login",{		   
                   email : email,
                   password : password
                   },function(data){
            if(!data.error) {
                window.location.href = "/search";
            } else {
                alert(data.message);
            }
        });
    });
});
