var express  = require('express');
var app      = express(); 
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

var users = {};
var numUsers = 0;
io.on('connection', function(socket){

  var id = socket.id;
  users[id] = {};
  users[id].id = id;

  console.log('a user connected',id);

  socket.on('disconnect', function(){
    if(users[socket.id].username){
    	console.log('user disconnected',socket.id);
    	if(numUsers > 0) {
	    	numUsers = numUsers - 1;
	    } else {
	    	numUsers = 0;
	    }
	    socket.leave(users[socket.id].roomname ,function(){
    		console.log('Leave Error');
    	});
	    socket.in(users[socket.id].roomname).emit('user left', { 'username' : users[socket.id].username, numUsers: numUsers});
	    delete users[socket.id];	
    }
  });

  socket.on('newuser', function(username){
  	console.log('User',users[socket.id]);
    users[socket.id].username = username;
    console.log('User',users[socket.id]);
  });

  socket.on('newroom', function(roomname){
  	console.log('User',users[socket.id]);
    users[socket.id].roomname = roomname;
    var roomname = roomname;
    var username = users[socket.id].username;
    socket.join(roomname,function(){
    	console.log('Join Error',roomname,username);
    });
    numUsers = numUsers + 1;
    socket.emit('login', { 'numUsers' : numUsers, 'users': users});
    socket.in(roomname).emit('user joined', { 'username' : username,	'numUsers': numUsers, 'users': users});
    console.log('Rooms',socket.rooms);
    
  });

  socket.on('typing', function() {
  	socket.in(users[socket.id].roomname).emit('typing', { 'username' : users[socket.id].username});
  });

  socket.on('stop typing', function() {
  	socket.in(users[socket.id].roomname).emit('stop typing', { 'username' : users[socket.id].username});
  });

  socket.on('chat message', function(data){
  	console.log(data.to);
    socket.to(data.to).emit('chat message', {
      username: users[socket.id].username,
      message: data.message
    });
  });
});


http.listen(80,function(){
  console.log('listening on *:3000');
});