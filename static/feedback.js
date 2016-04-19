var feedbackrequest;
var feedback
window.addEventListener('load', function(){
    feedbackrequest = new XMLHttpRequest();
    
}, false);
function sendFeedback(){
    // specify the HTTP method, URL, and asynchronous flag
    feedbackrequest.open('POST', '/newfeedback', true);
    feedbackrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    //needed params are:request.body.rating,request.body.user, request.body.type,request.body.userid;
    var params = 'type='+meta('usertype')+"&rating="+document.getElementById("rating").value+"&user="+meta("feedbackuser")+"&userid="+meta("feedbackUserId");
    //http://stackoverflow.com/questions/14417226/node-js-express-ajax-sessions
    feedbackrequest.withCredentials = true;
    // start the request, optionally with a request body for POST requests
    feedbackrequest.send(params);
    return false;
}
function meta(name) {
    var tag = document.querySelector('meta[name=' + name + ']');
    console.log(tag);
    if (tag != null){
        return tag.content;
    }
    return '';
}
