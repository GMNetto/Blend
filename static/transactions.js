var ireq;
var req;
var acceptreqb;
var acceptreql;
var finishreq;
window.addEventListener('load', function(){
    req = new XMLHttpRequest();
    ireq = new XMLHttpRequest();
    acceptreqb = new XMLHttpRequest();
    acceptreql = new XMLHttpRequest();
    finishreq = new XMLHttpRequest();
    //for testing purposes, though the users will probably be loaded at this point
    //loadUserTransactions();
    //loadItemTransactions();
    //acceptBorrower(1);
    //finishLender(1);
}, false);
//now not needed
function loadUserTransactions(){
    //http://stackoverflow.com/questions/8064691/how-do-i-pass-along-variables-with-xmlhttprequest 
    //sends back 
    req.open('GET', '/mytransactions', true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.withCredentials = true;
    req.addEventListener('load', function(e){
         if (req.status == 200) {
             var content = req.responseText;
             if(content.length>0){
                    // process each row of json data
                    var data = JSON.parse(content); 
                    for(i = 0;i<data.length;i++){
                        console.log(data[i]);
                    }
             }
         }
     }, false);
    req.send(null);
    return false;
}
function loadItemTransactions(){
    
    //sends back 
    ireq.open('GET', '/itemtransactions', true);
    ireq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    ireq.withCredentials = true;
    ireq.addEventListener('load', function(e){
         if (ireq.status == 200) {
             var content = ireq.responseText;
             if(content.length>0){
                    // process each row of json data
                    var data = JSON.parse(content); 
                    for(i = 0;i<data.length;i++){
                        console.log(data[i]);
                    }
             }
         }
     }, false);
    ireq.send(null);
    return false;
}
//assuming now that transactionId can be harcoded into transaction elements or passed in 
function acceptBorrower(transactionId,response){
    acceptreqb.open('POST','/borrower/'+transactionId,true);
    //var response = 0;//will probably get out of transaction html element or something
    var param = 'type='+response;
    acceptreqb.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    acceptreqb.withCredentials = true;
    acceptreqb.send(param);
}
function acceptLender(transactionId,response){
    acceptreql.open('POST','/lender/'+transactionId,true);
    //var response = 1;//will probably get out of transaction html element or something
    var param = 'type='+response;
    acceptreql.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    acceptreql.withCredentials = true;
    acceptreql.send(param);
}
function finishLender(transactionId){
    finishreq.open('POST','/finish/'+transactionId);
    var response = 1;//will probably get out of transaction html element or something
    var param = 'type='+response;
    finishreq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    finishreq.withCredentials = true;
    finishreq.send(param);
}