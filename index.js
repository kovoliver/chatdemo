const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server,  {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"]
    }
});

const mysql = require("mysql");
const roomMembers = {};
app.use('/', express.static('public'));


// app.get("/", ()=> {

// });

io.on('connection', (socket) => {
    socket.on('join', (roomId) => {
        if(roomMembers[roomId] === undefined) {
            socket.emit('room_created', roomId);
            roomMembers[roomId] = 1;
        } else {
            roomMembers[roomId]++;
        }

        socket.join(roomId);
        socket.emit('room_joined', roomId);
    });

    // These events are emitted to all the sockets connected to the same room except the sender.
    socket.on('start_call', (roomId) => {
        console.log(`Broadcasting start_call event to peers in room ${roomId}`);
        socket.broadcast.to(roomId).emit('start_call');
    });

    socket.on('webrtc_offer', (event) => {
        console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`);
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp);
    })

    socket.on('webrtc_answer', (event) => {
        console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`);
        socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp);
    })

    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`);
        socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event);
    })

    socket.on("text_message", (event)=> {
        const chatObj = {
            Message:event.Message,
            FullName:event.FullName,
            MessageDt:event.MessageDt
        };

        socket.broadcast.to(event.roomId).emit("text_message", chatObj);
    });

    socket.on("disconnecting", () => {
        console.log(socket.rooms); // the Set contains at least the socket ID

        socket.rooms.forEach((data)=> {
            if(roomMembers[data] !== undefined)
                roomMembers[data]--;

            if(roomMembers[data] === 0) 
                delete roomMembers[data];
        });
    });
    
    socket.on("disconnect", () => {
        console.log(roomMembers);
    });
})

// START THE SERVER =================================================================
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
})
