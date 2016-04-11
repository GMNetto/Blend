window.addEventListener('load', function(){
    //change username in form field on load based on session. For time being, hardcoded
    console.log(document.getElementById("usernameField"));
    
}, false);
//now not needed
function submitItem(){
    console.log("Sent form");
    var name = document.getElementById("itemName").value;
    var price = document.getElementById("priceEntry").value;
    var period = document.getElementById("periodSelector").value;
    var condition = document.getElementById("conditionSelector").value;
    var description = document.getElementById("itemDescription").value;
    var image = document.getElementById("imgFile").value;
    var username = "foobar";//will retrieve via sessions later
    console.log(name +" "+price+ " "+period+" "+condition+" "+description+" "+image);
    //http://stackoverflow.com/questions/8064691/how-do-i-pass-along-variables-with-xmlhttprequest
    var req = new XMLHttpRequest(); 
    //probably should encrypt password or something. This doesn't seem very safe
    var params = 'username='+username+'&name='+name+'&email='+price+"&price="+price+"&period="+period+"&condition="+condition+"&description="+description+"&image="+image;
    req.open('POST', '/newitem', true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(params);
    //var imagerequest = new XMLHttpRequest(); 
    /**
    imagerequest.open('POST','/imageupload',true);
    imagerequest.setRequestHeader('Content-Type', 'multipart/form-data');
    var fd = new FormData();
    fd.append("imgfile",image);
    imagerequest.send(fd);
    **/
    return false;
}
$(document).ready(function(){
    $('#logout').click(function(e){
        window.location.href = "/logout";
    });
});    
