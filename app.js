const express = require('express'); 
const app = express(); 

const server = require('http').Server(app);

const db = require('./config/keys_dev').mongoURI;

const mongoose = require('mongoose'); 
const bodyParser = require('body-parser'); 
const passport = require('passport'); 

const users = require('./routes/api/users'); 

const path = require('path');

const socket = require('socket.io');


if (process.env.NODE_ENV === 'production') {
    app.use(express.static('frontend/build'));
    app.get('/', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
    })
  }

mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('Connected to mongoDB'))
    .catch(err => console.log(err)); 

app.use(passport.initialize()); 
require('./config/passport')(passport); 

app.use(bodyParser.urlencoded({
    extended: false 
})); 
app.use(bodyParser.json()); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.use("/api/users", users); 

const port = process.env.PORT || 5000; 

server.listen(port);

const io = socket(server);


    // Users have profiles, and can click on another user's profile to request to chat 
    // with that other user ("requested chat partner"). Two users will be into a private
    // chat room with each other only when they have both requested to speak to each other.

    // I implemented the matching and live chat functionality using a JS library called 
    // socket.io, which uses the WebSockets protocol and other tools to facilitate real-time
    // communication. The following code is the server-side matching system 
    // other 

const possibleRooms = {};

io.on('connection',onConnect) 

function onConnect(socket) {

    // 

    socket.on('request_room', (receivedRoomIds) => {
        const requesterSocketId = socket.id;

        if (possibleRooms[receivedRoomIds[0]] && (possibleRooms[receivedRoomIds[0]] !== requesterSocketId)) {
            
            const partnerSocketId = possibleRooms[receivedRoomIds[0]];

            socket.emit('possible_room', receivedRoomIds[0] );
            socket.emit('verified_room', receivedRoomIds[0] );
            io.to(partnerSocketId).emit('verified_room', receivedRoomIds[0]);
            removeUserFromPossibleRooms(partnerSocketId);
            removeUserFromPossibleRooms(requesterSocketId);
                
        } else {
                
            possibleRooms[receivedRoomIds[1]] = requesterSocketId;
            socket.emit('possible_room', receivedRoomIds[1] );

        }
    });

    socket.on('join_room', (roomId) => {
        const rooms = Object.keys(socket.rooms);
        socket.leave(rooms[0]);
        socket.join(roomId);
        
        io.sockets.in(roomId).emit('request_partner_data');
    })

    socket.on('send_own_user_data', (userData) => {
        
        const roomId = userData.roomId;

        socket.to(roomId).emit('chat_partner_data', {
            partnerUserHandle: userData.userHandle,
            partnerLearnLang: userData.learnLang,
            partnerShareLang: userData.shareLang,
            partnerProfilePic: userData.profilePic,
            partnerMessageArray: userData.messageArray
        })
    })

    socket.on('chat_message', (message) => {
    
        io.sockets.in(message.roomId).emit('display_message', {
            gif: message.isGif,
            message: message.messageBody,
            userId: message.userId
        })
    })

    socket.on('off-users-index', () => {
        removeUserFromPossibleRooms(socket.id);
        socket.disconnect();
    })

    socket.on('off-chat', () => {
        socket.disconnect();
    })

    function removeUserFromPossibleRooms(socketId) {
        Object.keys(possibleRooms).forEach(function (roomId) {
            if (possibleRooms[roomId] == socketId) {
                delete possibleRooms[roomId]
            }
        });
    } 

}



