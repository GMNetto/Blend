var searchrequest;
var counter = 0;
var borrowrequest;
var recentrequest;
window.addEventListener('load', function(){
    //change username in form field on load based on session. For time being, hardcoded
    searchrequest = new XMLHttpRequest();
    borrowrequest = new XMLHttpRequest();
    recentrequest = new XMLHttpRequest();

}, false);
function hideFilters(){
    $('#portfolioModal').modal('hide');
}
function loadRecents(){
    recentrequest.open('GET', '/recentitems', true);
    recentrequest.addEventListener('load', function(e){
         if (recentrequest.status == 200) {
             // do something with the loaded content
                var content = recentrequest.responseText;
                // check if there is prior messages to load at all
                console.log(content);
                if(content.length>0){
                    // list appending code
                    // should be array of message objects
                    var data = JSON.parse(content);

                    var ul = document.getElementById('mod_results');
                    var ul2 = document.getElementById('popup_portfolio');
                    // create a new li element for the message, and append it
                    ul.innerHTML="";
                    var curid;
                    for(i = 0;i<data.length;i++){
                        //add only new messages to list
                        var li = document.createElement('li');
                        var li2 = document.createElement('li');
                        //construct list element

                        li.innerHTML = "<div class='col-sm-4 portfolio-item'><a href='#portfolioModal" + counter + "' class='portfolio-link' data-toggle='modal'><div class='caption'><div class='caption-content'><i class='fa fa-search-plus fa-3x'></i></div></div><img height = \'300 em\' width = \'300 em\' src='" + data[i].image + "' class='img-responsive' alt=''></a></div>"
                        li2.innerHTML = '<div class="portfolio-modal modal fade" id="portfolioModal' + counter + '" tabindex="-1" role="dialog" aria-hidden="true" style = "background-color:white"><div class="modal-content"><div class="close-modal" data-dismiss="modal"><div class="lr"><div class="rl"></div></div></div><div class="container"><div class="row"><div class="col-lg-8 col-lg-offset-2"><div style="bottom:300px!important;" class="modal-body"><h2 class = "logo" style = "color:black">' + data[i].name +  '</h2><hr><img src="' + data[i].image + '" class="img-responsive img-centered"> <ul> <li> <div class="logo" style="color: grey!important;"> Username: <a href="profile/' + data[i].username + '">' + data[i].username + '</a></div> <br> <li><div class="logo" style="color: grey!important;"> Price: $' + data[i].price + '</div> <br></li><li><div class="logo" style="color: grey!important;"> Description: ' + data[i].description + '</div> <br></li><li><div class="logo" style="color: grey!important;"> Distance from you: ' + data[i].distance + '</div> <br></li><li><input type="button" class="btn btn-success" value="Request to Borrow!" onclick="borrowThing(' +data[i].itemid +','+counter+ ');return false;"></li></ul></div></div></div></div></div></div>'
                        ul.appendChild(li,ul.childNodes[0]);
                        ul2.appendChild(li2, ul.childNodes[0]);
                        counter++;


                    }

                }
             else{
                 //returned empty result.

             }
         }
    }, false);
    recentrequest.send(null);
    return false;
}
//now needed
function submitItem(){
    // specify the HTTP method, URL, and asynchronous flag
    document.getElementById("recentmessage").innerHTML = "";
    var query = document.getElementById('itemName').value;
    document.getElementById("searcherror").style.display = "none";
    if(query.length===0){
        console.log("empty");
        document.getElementById("searcherror").style.display = "block";
        return false;
    }
    searchrequest.open('POST', '/searchquery', true);
    searchrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var params = 'itemName='+document.getElementById('itemName').value+"&minRating="+document.getElementById('reg_rating').value+"&priceCeil="+document.getElementById('reg_price').value+"&period="+document.getElementById('periodSelector').value+"&condition="+document.getElementById('conditionSelector').value;
    //http://stackoverflow.com/questions/14417226/node-js-express-ajax-sessions
    searchrequest.withCredentials = true;
    searchrequest.addEventListener('load', function(e){
         if (searchrequest.status == 200) {
                // do something with the loaded content
                var content = searchrequest.responseText;
                // check if there is prior messages to load at all
                console.log(content);
                document.getElementById("emptyresult").style.display = "none";
                if(content.length>0){
                    // list appending code
                    // should be array of message objects
                    var data = JSON.parse(content);
                    console.log("content?");
                    console.log(data);
                    if(data.length===0){
                        document.getElementById("emptyresult").style.display = "block";
                    }
                    // grab ul
                    var ul = document.getElementById('mod_results');
                    var ul2 = document.getElementById('popup_portfolio');
                    // create a new li element for the message, and append it
                    ul.innerHTML="";
                    var curid;
                    var distance = document.getElementById("reg_distance").value;
                    var distancefilter = distance+ " "+document.getElementById("unitSelector").value;
                    console.log("Filtering using distance:"+distancefilter);
                    console.log(distancefilter);
                    for(i = 0;i<data.length;i++){
                        //add only new messages to list
                        var li = document.createElement('li');
                        var li2 = document.createElement('li');
                        //construct list element
                        if(compareDistances(distancefilter,data[i].distance)>=0){
                            li.innerHTML = "<div class='col-sm-4 portfolio-item'><a href='#portfolioModal" + counter + "' class='portfolio-link' data-toggle='modal'><div class='caption'><div class='caption-content'><i class='fa fa-search-plus fa-3x'></i></div></div><img height = \'300 em\' width = \'300 em\' src='" + data[i].image + "' class='img-responsive' alt=''></a></div>"
                            li2.innerHTML = '<div class="portfolio-modal modal fade" id="portfolioModal' + counter + '" tabindex="-1" role="dialog" aria-hidden="true" style = "background-color:white"><div class="modal-content"><div class="close-modal" data-dismiss="modal"><div class="lr"><div class="rl"></div></div></div><div class="container"><div class="row"><div class="col-lg-8 col-lg-offset-2"><div style="bottom:300px!important;" class="modal-body"><h2 class = "logo" style = "color:black">' + data[i].name +  '</h2><hr><img src="' + data[i].image + '" class="img-responsive img-centered"> <ul> <li> <div class="logo" style="color: grey!important;"> Username: <a href="profile/' + data[i].username + '">' + data[i].username + '</a></div> <br> <li><div class="logo" style="color: grey!important;"> Price: $' + data[i].price + '</div> <br></li><li><div class="logo" style="color: grey!important;"> Description: ' + data[i].description + '</div> <br></li><li><div class="logo" style="color: grey!important;"> Distance from you: ' + data[i].distance + '</div> <br></li><li><input type="button" class="btn btn-success" value="Request to Borrow!" onclick="borrowThing(' +data[i].itemid +','+counter+ ');return false;"></li></ul></div></div></div></div></div></div>'
                            // li.innerHTML = "<div id =\x22searchresult\x22>"+'<img height = \'150 em\' width = \'150 em\'src='+data[i].image+'>'+'<strong><a href=\x22'+data[i].link+'\x22>' + data[i].name + " price:"+ data[i].price+'</strong> Distance:' + data[i].distance+' username:'+data[i].username+"</div>";
                            //add to list html on frontend
                            ul.appendChild(li,ul.childNodes[0]);
                            ul2.appendChild(li2, ul.childNodes[0]);
                            counter++;
                        }

                    }

                }
             else{
                 //returned empty result.

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

function borrowThing(itemId,modalId){
    // used to be used for testing alert("Request to borrow sent");
    console.log("Attempting to borrow item of id:"+itemId+ "modal #"+modalId);
    document.getElementById("success").style.display = "none";
    document.getElementById("redundant").style.display = "none";
    document.getElementById("alreadyBorrowed").style.display = "none";
    document.getElementById("error").style.display = "none";
    //http://getbootstrap.com/javascript/
    borrowrequest.open('POST', '/borrow/'+itemId, true);
    borrowrequest.addEventListener('load', function(e){
        $('#portfolioModal'+modalId).modal('hide');
        var status = borrowrequest.status;
         if (status=== 200) {
            //borrowrequest suceeded
             document.getElementById("success").style.display = "block";
        }
        if(status===409){
            //owner tried to borrow own thing
            document.getElementById("redundant").style.display = "block";
       }
        if(status===500){
            //item has been borrowed already
            document.getElementById("alreadyBorrowed").style.display = "block";
        }
        if(status===404){
            //error on insert
            document.getElementById("error").style.display = "block";
        }

    }, false);

    // start the request, optionally with a request body for POST requests
    borrowrequest.send(null);
}
