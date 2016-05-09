var socket = io.connect();

window.addEventListener('load', function(){

    socket.on('new_transaction', function(transaction, lender){
        var li = document.createElement('li');
        li.innerHTML = '<p id="transaction">' + transaction.Username + ' ' + lender.Username + ' ' + transaction.name + '</p>';
        $("#list-transactions").append(li);
    });


    socket.emit('join', function(transactions, lenders){
        update(transactions, lenders);
    });
});

var update = function(transactions, lenders){
    $("#list-transactions").empty();
    for(var i = 0; i< transactions.length; ++i){
        var li = document.createElement('li');
        var user1_name = transactions[i].Username;
        var user2_name = lender[i].Username;
        var item_name = transactions[i].name;
        li.innerHTML = '<p id="transaction">' + user1_name + ' ' + user2_name + ' ' + item_name + '</p>';
        $("#list-transactions").append(li);
    }
};
