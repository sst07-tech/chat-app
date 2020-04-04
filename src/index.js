const path = require('path');
const http = require('http')
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express();
//Below step creates a server outside the express library and uses express app. Indirectly express does the same in the background. 
//But for socketio we need to pass the server socketio(server), that is why we need the server separately.
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// app.get('/', (req, res) => {
//     res.send()
// })
// let count = 0;

io.on('connection', (socket) => {
    console.log('New WebSocket Connection');
    // socket.emit('countUpdated', count);
    // socket.on('increment', () => {
    //     count++;
    //     // socket.emit('countUpdated', count);
    //     // socket.emit is only emitting the event to specific connection. But io.emit will emit the event to all client connections.
    //     io.emit('countUpdated', count);
    // })

    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        // Joins a room. You can join multiple rooms, and by default, on connection, you join a room with the same name as your ID
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit -> it emits an event to everybody in a specific room
        // socket.broadcast.emit --> it emits an event to everyone in a specific room except the current client

        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('Server is up and running on port ', port);
})