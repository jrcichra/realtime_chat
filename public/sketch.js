//Global variables because I don't understand how to use callbacks fully yet
var socket;
var buttonwidth = 75;
var shapefill = [];
var shapepos = [];
var input;
var username;
var fullmessages = [];
var partialmessages = [];
var lobbyid;
const SPACING = 20;
var a = 0;

//This function is called when the canvas is created
function setup(){
    rectMode(CENTER);
    //generate cube properties
    shapepos = []
    shapefill = [random(255),random(255),random(255)];

    //Build the canvas to the dimensions of the window using jQuery
    createCanvas($(document).width(),$(document).height()-5);

    //Ask them for a username

    //username = window.prompt("Please enter your username:",'User' + int(random(1000)));
    username = window.prompt("Please enter your username:",'Justin');
    //username = "Justin";

    lobbyid = window.prompt("Please enter your lobbyid:",0);
    //lobbyid = 0;

    //create the input box and the button
    input  = createInput();
    input.size(width - buttonwidth - 5,input.height);
    input.position(5, height - input.height);
    //make and place the button
    var button = createButton('Send');
    button.size(buttonwidth - 5, input.height);
    button.position(input.width, height - input.height);
    //create the socket for my website
    socket = io.connect('http://yourwebsite:4000');
    //Trigger a packet when the input changes
    input.input(sendPartial);
    //Send a message when enter is pressed
    button.mouseClicked(sendMessage);
    //Wait for new packets on your lobby
    socket.on(lobbyid.toString(),getResponse);
    //wait for the backlog to come in
    socket.on('init',initMessages);
    //send out a backlog request
    socket.emit('init',payload(true,true));
}

//Build a payload

function payload(full,backlog){
    data = {
        lobbyid: lobbyid,
        messageid: guid(),      //unique id
        username: username,
        message: input.value(),
        fullmessage: full,
        backlog : backlog,
        backmessages : []
    }
    return data;
}

function guid() { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}


//Send a message when the enter key is pressed
function keyPressed(){
    if(keyCode == ENTER){
        sendMessage();      //send a full message
        input.value('');    //clear the input box
    }
}

//This function is called when a new packet is recieved from the server
function getResponse(msg){
    console.log('We got a packet from the server');
    console.log(msg);
    if(msg.fullmessage && !msg.backlog){    //if we got a fullmesssage, push it onto the fullmessages list
        fullmessages.push(msg);
        //Now we need to remove that partial message
        for(var i=0;i<partialmessages.length;i++){
            if(partialmessages[i].name == msg.name){
                partialmessages.splice(i,1);            //splice out that person from the partial list
            }
        }
    }else if(!msg.fullmessage && !msg.backlog){  //This is a partial message, we need to check if this person already has
            //a partial message being build, if they do, we need to change it, if
            //if there is no partial message for this user, we need to add them to the list
        console.log("we got a partial packet");
        var found = false;
        for(var i=0; i<partialmessages.length;i++){
            if(partialmessages[i].name == msg.name){         //if we already have a partial name for this person
                partialmessages[i].message = msg.message;    //update its text
                found = true;
            }
        }
        if(!found){
            partialmessages.push(msg);
        }
    }else{
        console.error(msg);   //got a weird packet...
    }
    
}

 //This function is called when the local user starts typing something, and we want to send out an update
function sendPartial(){
   socket.emit(lobbyid.toString(),payload(false,false));
}

//This function is called when the user wishes to send a full message, by enter or clicking
function sendMessage(){
    var msg = payload(true,false);
    console.log('Sending ' + msg);
    fullmessages.push(msg);
    socket.emit(lobbyid, msg);
}

//This function is called when we receive previous messages from the server
function initMessages(msg){
    console.log("We hit init messages");
    console.log(msg);
    for(var i=0; i < msg.backmessages.length; i++){
        fullmessages.push(msg.backmessages[i]);
    }
}

//This is called every frame update, use this to draw stuff on the canvas
function draw(){
    background(51);
    

    push();
    fill(random(255),random(255),random(255));
    translate(0,0);
    a+=.10;
    rotate(a);
    rect(random(width),random(height),50,50);
    pop();

    var p_i = 0;
    //Draw out the text for partial messages, if there are any
    for(;p_i<partialmessages.length;p_i++){
        var index = partialmessages.length - 1 - p_i;

        var i_username = partialmessages[index].username;
        var i_message = partialmessages[index].message;
        var y = height - ((p_i + 1) * SPACING + input.height + 20);
        fill(0,0,100);
        text(i_username + ':  ' + i_message,20,y);
    }

    //Draw out the text for full messages
    for(var i=0;i<fullmessages.length;i++){

        var index = fullmessages.length - 1 - i;

        var i_username = fullmessages[index].username;
        var i_message = fullmessages[index].message;
        var y = height - ((i+1 + p_i + 1) * SPACING + input.height + 20);

        if(username == fullmessages[index].username){
            fill(0,255,100);
        }else{
            fill(255,0,100);
        }

        text(i_username + ':  ' + i_message,20,y);
    }
}