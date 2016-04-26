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
