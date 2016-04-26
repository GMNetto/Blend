var initial_date
window.addEventListener('load', function(){
    initial_date = document.getElementById("start_date").innerHTML.replace("start date: ","");
    populateDateField(parseFloat(meta("duration")));
    
}, false);

function populateDateField(duration){
    //http://stackoverflow.com/questions/15910761/add-5-days-to-the-current-date-using-javascript
    var curdate = new Date(initial_date);
    var enddate = new Date(curdate);
    if(duration==1){
        //console.log("hour");
        //console.log(curdate.getTime());
        enddate.setHours(curdate.getHours()+1);
        enddate.setDate(curdate.getDay()-7);
        
    }
    if(duration==24){
        //console.log("day");
        //enddate.setHours(curdate.getHours()+24);
        enddate.setDate(curdate.getDate()+1);
        enddate.setMonth(curdate.getMonth()-1);
    }
    if(duration==148){
        //console.log("week");
        enddate.setDate(enddate.getDate()+7);
        
    }
    else
    {//duration is 720, which is a month
        enddate.setMonth(enddate.getMonth()+1);
    }
    //console.log(enddate);
    //http://stackoverflow.com/questions/2554149/html-javascript-change-div-content
    //document.getElementById("start_date").innerHTML = "start date:"+curdate;
    document.getElementById("end_date").innerHTML = "end date:"+enddate;
}
function meta(name) {
    var tag = document.querySelector('meta[name=' + name + ']');
    
    if (tag != null){
        return tag.content;
    }
    return '';
}