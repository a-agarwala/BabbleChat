const express = require('express'); 
const app = express(); 

const server = require('http').Server(app);

const db = require('./config/keys_dev').mongoURI;

const mongoose = require('mongoose'); 
const bodyParser = require('body-parser'); 
const passport = require('passport'); 

const users = require('./routes/api/users'); 
const tweets = require('./routes/api/tweets'); 
const path = require('path');
// const chat = require('./routes/chat');

// const User = require('./models/User'); 

//new code
const socket = require('socket.io');
//new code end

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
// app.get("/", (req, res) => {
//     res.send("Hello Wd!"); 
// }); 

app.use("/api/users", users); 
app.use("/api/tweets", tweets); 
// app.use('/chat', chat);
const port = process.env.PORT || 5000; 

//COMMENTED OUT
// app.listen(port, () => {
//     console.log(`Listening on port ${port}`)
// }); 
// COMMENTED OUT END

//new code
server.listen(port, () => {
    console.log(`Listening on port ${port}`)
});

const io = socket(server);

let possible_rooms = {};
let created_rooms = [];
let users_in_rooms = [];

io.on('connection',onConnect) 

function onConnect(socket) {
    console.log('made socket connection');
    console.log(socket.id);


    function remove_user_from_possible_rooms (socketid) {
        Object.keys(possible_rooms).forEach(function(room_id) {
            if (possible_rooms[room_id] == socketid) {
                delete possible_rooms[room_id]
            }
        });
    } 
    // console.log(socket.id);
    
    socket.on('request_room', (room_ids) => {
        const possible_room_ids = Object.keys(possible_rooms);
        const users_in_possible_rooms = Object.values(possible_rooms);
        const requester_id = socket.id;

        if (possible_room_ids.includes(room_ids[0]) && (possible_rooms[room_ids[0]] !== requester_id)) {
                
                console.log('found first room');
                socket.emit('possible_room', room_ids[0] );
                socket.emit('verified_room', room_ids[0] );
                const other_socketid = possible_rooms[room_ids[0]];
                io.to(other_socketid).emit('verified_room', room_ids[0]);
                remove_user_from_possible_rooms(other_socketid);
                console.log(possible_rooms);
                
        } else if (possible_room_ids.includes(room_ids[1]) && (possible_rooms[room_ids[1]] !== requester_id)) {

                console.log('found second room');
                socket.emit('possible_room', room_ids[1]);
                socket.emit('verified_room', room_ids[1]);
                const other_socketid = possible_rooms[room_ids[1]];
                io.to(other_socketid).emit('verified_room', room_ids[1]);
                remove_user_from_possible_rooms(other_socketid);
                console.log(possible_rooms);

            } else {

                remove_user_from_possible_rooms(socket.id);
                possible_rooms[room_ids[0]] = socket.id;
                console.log(socket.id);
                console.log(possible_rooms);
                socket.emit('possible_room', room_ids[0] );

            }
        
    });

    socket.on('join_room', (room_id) => {
        let rooms = Object.keys(socket.rooms);
        socket.leave(rooms[0]);
        console.log(room_id);
        socket.join(room_id, () => {
            let rooms = Object.keys(socket.rooms);
            console.log(`joining these rooms: ${rooms}`);}
        );
        io.sockets.in(room_id).emit('request_partner_data');
    })

    socket.on('send_own_user_data', (user_data_object) => {
        const user_handle = user_data_object['user_handle'];
        const learn_lang = user_data_object['learning_language'];
        const share_lang = user_data_object['sharing_language'];
        const profile_pic = user_data_object['profile_picture'];
        const room_id = user_data_object['roomId'];
        console.log(user_data_object);
        console.log(room_id);
        // io.sockets.in(room_id).
        console.log('send_user_data');
        socket.to(room_id).emit('chat_partner_data', {
            other_user_handle: user_handle,
            other_learn_lang: learn_lang,
            other_share_lang: share_lang,
            other_profile_pic: profile_pic
        })
    })

    socket.on('chat_message', (message_object) => {
        console.log(message_object);
        console.log(message_object['roomId']);
        const room_id_of_message = message_object['roomId'];
        const message_body = message_object['message'];
        const author_id = message_object['userId'];
        const is_gif = message_object['gif']
        io.sockets.in(room_id_of_message).emit('display_message', {
            gif: is_gif,
            message: message_body,
            userId: author_id
        })
    })

    socket.on('off-users-index', () => {
        console.log('users index socket is being turned off');
        remove_user_from_possible_rooms(socket.id);
        socket.disconnect();
    })

    socket.on('off-chat', () => {
        console.log('chat socket is being turned off');
        socket.disconnect();
    })

}




//new code end

// module.exports = {
//     port
// }


