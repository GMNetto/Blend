var searchrequest;
window.addEventListener('load', function(){
    //change username in form field on load based on session. For time being, hardcoded
    searchrequest = new XMLHttpRequest();
    
}, false);
//now not needed
function submitItem(){
    // specify the HTTP method, URL, and asynchronous flag
    searchrequest.open('POST', '/searchquery', true);
    searchrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var params = 'itemName='+document.getElementById('itemName').value+"&minRating="+document.getElementById('minRating').value+"&priceCeil="+document.getElementById('priceC').value+"&period="+document.getElementById('periodSelector').value+"&condition="+document.getElementById('conditionSelector').value;
    //http://stackoverflow.com/questions/14417226/node-js-express-ajax-sessions
    searchrequest.withCredentials = true;
    searchrequest.addEventListener('load', function(e){
         if (searchrequest.status == 200) {
                // do something with the loaded content
                var content = searchrequest.responseText;
                // check if there is prior messages to load at all
                console.log(content);
                if(content.length>0){
                    // list appending code
                    // should be array of message objects
                    var data = JSON.parse(content);  
                    console.log(data);
                    // grab ul
                    var ul = document.getElementById('searchResults');
                    // create a new li element for the message, and append it
                    ul.innerHTML="";
                    var curid;
                    var distancefilter = document.getElementById("dist").value+ " "+document.getElementById("unitSelector").value;
                    console.log("Filtering using distance:"+distancefilter);
                    for(i = 0;i<data.length;i++){
                        //add only new messages to list
                        var li = document.createElement('li');
                        //construct list element
                        if(compareDistances(distancefilter,data[i].distance)>=0){
                            li.innerHTML = "<div id =\x22searchresult\x22>"+'<strong><a href=\x22'+data[i].link+'\x22>' + data[i].name + " price:"+ data[i].price+'</strong> Distance:' + data[i].distance+"</div>";
                            //add to list html on frontend
                            ul.appendChild(li,ul.childNodes[0]);
                        }

                    }
                }
            } else {
               //for some reason request didn't succeed. Do nothing
            }
    }, false);

    // start the request, optionally with a request body for POST requests
    searchrequest.send(params);
    return false;
}
function compareDistances(dist1,dist2){
    var original = dist1;
    var final1;
    if(original.indexOf("km")>0){
        //convert to m
        original = original.replace(" km","");
        final1 = parseFloat(original);
        final1 = final1*1000.0;
    }
    else{
        original = original.replace(" m","");
        final1 = parseFloat(original);
    }
    console.log("final1:"+final1);
    var tocompare = dist2;
    var second;
    if(tocompare.indexOf("km")>0){
        //convert to m
        tocompare = tocompare.replace(" km","");
        second = parseFloat(tocompare);
        second = second*1000.0;
    }
    else{
        tocompare = tocompare.replace(" m","");
        second = parseFloat(tocompare);
    }
    console.log("second:"+second);
    if(final1>second){
        return 1;
    }
    if(second>final1){
        return -1;
    }
    else{
        return 0;
    }
}