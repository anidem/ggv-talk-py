// server_app.js

// includes
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require("body-parser");
var mustacheExpress = require('mustache-express');
var request = require('request');

// Register '.mustache' extension with The Mustache Express
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views/');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// http request routes

//==> css and js
app.get('/ggvchat.css', function(req, res) {
  res.sendFile(__dirname + '/public/css/ggvchat.css');
});

app.get('/jquery-2.1.1.min.js', function(req, res) {
  res.sendFile(__dirname + '/public/js/jquery-2.1.1.min.js');
});

//==> homepage landing - not sure we need this but here for now
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

//==> chat window
app.get('/ggvchat', function(req, res) {
  // accepts query params to set up template vars in ggvchat.html for socket registration.
  // Note: could try to do this with post data.
  // 'chatuser': req.body.uname, etc...

  // sample requests: 
  // http://localhost:3000/ggvchat/?uname=user0&uroom=admins-only
  // http://localhost:3000/ggvchat/?uname=user1&uroom=admins-only
  
  d = {
    'chatuser': req.query.uname, 
    'chatroom': req.query.uroom
  }
  res.render('ggvchat', d);
});

// slack connections

//==> slack event url handler
app.get('/ggvchat/receive', function(req, res) {
  post_data = req.body;
  console.log('Slack sent: ' + post_data);
  io.to('admins-only').emit('chat message', 'received slack data');
});


// main app functions

// request.post(
//     'http://www.yoursite.com/formpage',
//     { json: { key: 'value' } },
//     function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             console.log(body)
//         }
//     }
// );



var print_users_in_room = function(socket) {
  r = socket.adapter.rooms[socket.room_id];
  console.log(socket.room_id + " has:");
  console.log("Occupants ==> ");
  for (let i in r.sockets) {
    console.log(i);
  }
  console.log();
};

// Slack API

slack_token = process.env.SLACK_TOKEN;
slack_ch_id = process.env.SLACK_CH_ID;
params = {token: slack_token, channel: slack_ch_id};
slack_test_url = 'https://slack.com/api/conversations.info';

// var slack_get_conv_info = request(
//   {
//     url: slack_test_url,
//     method: "GET",
//     headers: {"content-type": "application/x-www-form-urlencoded"},
//     qs: params,
//   },
//   function (error, response, body) {
//     console.log('error:', error); // Print the error if one occurred
//     console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//     console.log(body);
//     rdata = JSON.parse(body);
//     console.log('CHANNEL==> ', rdata.channel.name); 
//   }
// );


// socket.io handlers
io.on('connection', function(socket) {

    socket.on('register', function (username, room_id) {
        // Store the username in the socket object for this client
        socket.username = username;
        socket.room_id = room_id;
        socket.join(socket.room_id);

        socket.id = username;

        // Echo to room that a new user is in room.
        // io.to(socket.room_id).emit('user registered', {
        //     username: socket.username,
        //     room_id: socket.room_id,
        //     socket_id: socket.id
        // });

        print_users_in_room(socket);
    });

    socket.on('chat message', function(msg) {
        print_users_in_room(socket);

        msg = socket.username + " ==> " + msg;
        io.to(socket.room_id).emit('chat message', msg);
    });

    socket.on('disconnect', function() {
        console.log(socket.username + " disconnected.");
        io.to(socket.room_id).emit('chat message', socket.username + ' disconnected');
    });
});

// server proc
http.listen(3000, function(){
  console.log('listening on *:3000');
});