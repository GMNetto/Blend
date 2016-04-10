var itemId;
window.addEventListener('load', function(){
    console.log("loading item details");
    itemId = meta('itemId');  
    console.log(itemId);
    loadItem();
    
}, false);
function meta(name) {
    var tag = document.querySelector('meta[name=' + name + ']');
    if (tag != null){
        return tag.content;
    }
    return '';
}


function loadItem(){
     var initrequest = new XMLHttpRequest();
    // specify the HTTP method, URL, and asynchronous flag
    console.log("Attempting to load item of id:"+itemId);
    initrequest.open('GET', '/item/' + itemId + '/retrieve', true);
    initrequest.addEventListener('load', function(e){
         if (initrequest.status == 200) {
                // do something with the loaded content
                var content = initrequest.responseText;
                //console.log(initrequest.responseText);
                //console.log(initrequest);
                // check if there is prior messages to load at all
                if(content.length>0){
                    // list appending code
                    // should be array of message objects
                    var data = JSON.parse(content);  
                    //http://www.w3schools.com/jsref/met_document_createtextnode.asp
                    var disc = document.getElementById("itemDescription");
                    var d =document.createTextNode(data[0].description);
                    disc.appendChild(d);
                    var h1 = document.querySelector('h1');
                    var n = document.createTextNode(data[0].name);
                    h1.appendChild(n);
                    var cond = document.getElementById("condition");
                    var c = document.createTextNode(data[0].condition);
                    cond.appendChild(c);
                    var price = document.getElementById("price");
                    var p = document.createTextNode("$"+data[0].price);
                    price.appendChild(p);
                    var owner = document.getElementById("owner");
                    var o = document.createTextNode(data[0].owner);
                    owner.appendChild(o);
                    var dur = document.getElementById("duration");
                    var durval = document.createTextNode(data[0].duration);
                    dur.appendChild(durval);
                    //http://expressjs.com/en/starter/static-files.html
                    var img = document.getElementById("itemImg");
                    img.src = data[0].image;
                    
                }
            } else {
               //for some reason request didn't succeed. Do nothing
            }
    }, false);

    // start the request, optionally with a request body for POST requests
    initrequest.send(null);
    
}
