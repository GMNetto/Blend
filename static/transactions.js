var acceptreqb;
var acceptreql;
var finishreq;
window.addEventListener('load', function(){
    //http://stackoverflow.com/questions/3338642/updating-address-bar-with-new-url-without-hash-or-reloading-the-page
    window.history.pushState("object or string", "Title", "/transactions");
    acceptreqb = new XMLHttpRequest();
    acceptreql = new XMLHttpRequest();
    finishreq = new XMLHttpRequest();
    //cancelreq = new XMLHttpRequest();
    //acceptBorrower(1);
    //finishLender(1);
    //populateDateField(720);
    /**
    var nums = document.getElementById("curborrows");
    var listItem = nums.getElementsByTagName("li");
    for (var i=0; i < listItem.length; i++) {
        console.log(listItem[i].id);
    }
    **/
        $('.remove_btn').on('click', function(){
      console.log(this);
      // alert(params.idItem);
      
      var params = {
        idItem: this.getAttribute('data-value')
      };

      $.post("/removeItem", params, function(server_response) {
        if(server_response.status) {
          alert("Your item is successfully removed!")

          var elem = this.closest('li');

          elem.parentNode.removeChild(elem);
          // alert(this.getAttribute('data-value'));
          var params = {
            idItem: this.getAttribute('data-value')
          };
        } else {
          alert("Cannot remove an item currently in a transaction!");
        }
      });

    });
    
}, false);




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
function populateDateField(date,duration){
    //http://stackoverflow.com/questions/15910761/add-5-days-to-the-current-date-using-javascript
    //http://stackoverflow.com/questions/3818193/how-to-add-number-of-days-to-todays-date
    var curdate = date;
    var enddate = new Date(curdate);
    console.log(curdate);
    if(duration==1){
        console.log("hour");
        console.log(curdate.getTime());
        enddate.setHours(curdate.getHours()+1);
        enddate.setDate(curdate.getDay()-7);

    }
    if(duration==24){
        console.log("day");
        //enddate.setHours(curdate.getHours()+24);
        enddate.setDate(curdate.getDate()+1);
        enddate.setMonth(curdate.getMonth()-1);
    }
    if(duration==148){
        console.log("week");
        enddate.setDate(enddate.getDate()+7);

    }
    else
    {//duration is 720, which is a month
        enddate.setMonth(enddate.getMonth()+1);
    ;}
    console.log(enddate);
}
//for ongoing transactions with others with a known start date
function cancelTrans(transactionId){
    finishreq.open('POST','/borrowercancel/'+transactionId);
    finishreq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    finishreq.withCredentials = true;
    finishreq.send(null);
}
