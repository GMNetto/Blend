
var socket = io.connect();
window.addEventListener('load', function(){

    socket.on('new_transaction', function(transaction, lender){
        var li = document.createElement('li');
        li.className = "list-group-item";
        var user1_name = transactions;
        var user2_name = lender;
        var item_name = transactions;
        li.innerHTML = '<div class="portfolio-item" style = "text-align:center"  >' +
										'<img class = "img_fade" src = "' + user1.profile_url + '">'+
									
										'<a href = "' + '#' + '" />' + 
											'<span id = "item_fade">' + user1.Username + '</span>' + 
										'</a>' +
										
										'<span style = "color:grey; margin-left: 30px; margin-right:30px;">borrowed from </span>' + 
										
										'<img class = "img_fade" src = "' + user2.profile_url + '">' + 
									
										'<a href = "' + '#' + '" />' +
											'<span id = "item_fade">' + user2.Username + '</span>' +
										'</a>' +
										
										'<span style = "color:grey; margin-left: 50px; margin-right:10px;">item:</span>' +
										
										'<img class = "img_fade" src = "' + item.image + '">' + '<span id = "item_fade">' + item.name + '</span>' +	
									'</div>';
        $(".list-transactions").append(li);
    });

    socket.on('connect', function(){
        socket.emit('join', function(transactions, lenders){
            console.log(transactions.Username);
            update(transactions, lenders);
        });
    });
    socket.on('disconnect', function(){
        var ul_el = document.getElementsByClassName('list-transactions');
        ul_el.innerHTML = "";
    });
});

var update = function(transactions, lenders){
    $("#list-transactions").empty();
    for(var i = 0; i< transactions.length; ++i){
        var li = document.createElement('li');
        li.className = "list-group-item";
        var user1 = transactions[i];
        var user2 = lenders[i];
        var item = transactions[i];
        li.innerHTML = '<div class="portfolio-item" style = "text-align:center"  >' +
										'<img class = "img_fade" src = "' + user1.profile_url + '">'+
									
										'<a href = "' + '#' + '" />' + 
											'<span id = "item_fade">' + user1.Username + '</span>' + 
										'</a>' +
										
										'<span style = "color:grey; margin-left: 30px; margin-right:30px;">borrowed from </span>' + 
										
										'<img class = "img_fade" src = "' + user2.profile_url + '">' + 
									
										'<a href = "' + '#' + '" />' +
											'<span id = "item_fade">' + user2.Username + '</span>' +
										'</a>' +
										
										'<span style = "color:grey; margin-left: 50px; margin-right:10px;">item:</span>' +
										
										'<img class = "img_fade" src = "' + item.image + '">' +
									
										'<span id = "item_fade">' + item.name + '</span>' +	
									'</div>';
        $(".list-transactions").append(li);
    }
};
