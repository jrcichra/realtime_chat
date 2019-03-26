var express = require('express');
app = express();
var server = app.listen(4000);
app.use(express.static('public'));

console.log("My socket server is running");

var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);

//standard global variables
function initPayload(lobbyid,msgs){
    data = {
        lobbyid: lobbyid,
        messageid: null,      //this doesn't have an id since this is a backlog
        username: null,
        message: null,
        fullmessage: true,
        backlog : true,
        backmessages : msgs
    }
    return data;
}
//message dictionary, indexed by the lobbyid
var fullmessages = {};
var partialmessages = {};

//We have someone new, log it and listen to their messages
function newConnection(socket){
    console.log('New connection: ' + socket.handshake.address);

    //spawn an init lobby to get a lobby id for them and send a backlog
    socket.on('init',getInit);

    function getMessage(msg){
        socket.broadcast.emit(msg.lobbyid.toString(),msg);      //Send it out to everyone else
        
        if(msg.fullmessage && !msg.backlog){                    //We got a full message for this lobby
            fullmessages[msg.lobbyid].push(msg);                    //Add it to the dictionary for this lobby
            for(var i=0;i<partialmessages[msg.lobbyid].length;i++){//find their partial message and remove it if it's there
                if(partialmessages[msg.lobbyid][i].name == msg.name){   //if the names match
                    partialmessages[msg.lobbyid].splice(i,1);           //remove it
                }
            }                                                
                                                            
        }else if(!msg.fullmessage && !msg.backlog){             //We got a partial message  
            
            var found = false

            for(var i=0;i<partialmessages[msg.lobbyid].length;i++){     //loop through the partial users for this lobby
                if(partialmessages[msg.lobbyid][i].name == msg.name){
                    //We already have a partial message for this person, let's update it
                    partialmessages[msg.lobbyid][i].message = msg.message;
                    found = true;
                }
            }
            if(!found){
                partialmessages[msg.lobbyid].push(msg);         //if it's not there add them
            }
           
        }
        
        
        console.log(msg);
    }
    
    function getInit(msg){
        console.log("someone sent us an init packet");
    
        //check to see if the lobby exists, if not create it
        if(!fullmessages[msg.lobbyid]){
            fullmessages[msg.lobbyid] = [];
        }
        if(!partialmessages[msg.lobbyid]){
            partialmessages[msg.lobbyid] = [];
        }
    
        //send them the backlog
        var msgs = initPayload(msg.lobbyid,fullmessages[msg.lobbyid]);
        console.log("Sent backlog:");
        console.log(msgs);
        socket.emit('init',msgs);
    
        
    
        socket.on(msg.lobbyid.toString(),getMessage);
        console.log('Added user to lobby: ' + msg.lobbyid);
    }
}

