// server_app.js

// includes
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require("body-parser");
var mustacheExpress = require('mustache-express');

// Register '.mustache' extension with The Mustache Express
app.engine('html', mustacheExpress());

app.set('view engine', 'html');
app.set('views', __dirname + '/');


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// http request routes
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/ggvchat', function(req, res) {
  // accepts query params to set up template vars for socket registration.
  // Note: could try to do this with post data.
  // 'chatuser': req.body.uname, etc...
  
  d = {
    'chatuser': req.query.uname, 
    'chatroom': req.query.uroom
  }
  res.render('ggvchat', d);
});

var request = require('request');

slack_token = process.env.SLACK_TOKEN;
slack_ch_id = process.env.SLACK_CH_ID;
params = {token: slack_token, channel: slack_ch_id};

slack_test_url = 'https://slack.com/api/conversations.info';
// request.post(
//     'http://www.yoursite.com/formpage',
//     { json: { key: 'value' } },
//     function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             console.log(body)
//         }
//     }
// );
request({
    url: slack_test_url,
    method: "GET",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    qs: params,
  },
  function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log(body);
    rdata = JSON.parse(body);
    console.log('CHANNEL==> ', rdata.channel.name); // Print the HTML for the Google homepage.
  }
);


app.get('/ggvchat/receive', function(req, res) {
  post_data = req.body;
  console.log('Slack sent: ' + post_data);
  io.to('admins-only').emit('chat message', 'payload received');
});

app.get('/ggvchat.css', function(req, res) {
  res.sendFile(__dirname + '/ggvchat.css');
});

var print_users_in_room = function(socket) {
  r = socket.adapter.rooms[socket.room_id];

  console.log(socket.room_id);
  console.log(r.sockets);
};


// socket.io handlers
io.on('connection', function(socket){
  var is_registered = false;

  socket.on('register', function (username, room_id) {
    
    if (is_registered) return;

    // we store the username in the socket session for this client
    socket.username = username;
    socket.room_id = room_id;
    socket.join(socket.room_id);
    console.log('==> ' + socket.username + ' ' + socket.room_id);

    is_registered = true;

    // echo to room
    io.to(socket.room_id).emit('user registered',{
      username: socket.username,
      room_id: socket.room_id
    });

    print_users_in_room(socket);
  });

  socket.on('chat message', function(msg){
    // console.log(socket.adapter.rooms[socket.room_id]);
    // console.log(socket.id + " ==> " + 'message: ' + msg);
    io.to(socket.room_id).emit('chat message', msg);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
    io.to(socket.room_id).emit('chat message', socket.username + ' disconnected');
  });

});

// server proc
http.listen(3000, function(){
  console.log('listening on *:3000');
});