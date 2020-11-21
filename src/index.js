var path = require("path")
var http = require("http")
var express = require("express")
var socketio = require("socket.io")
var { generateMessage, generateLocationMessage } = require('./utils/messages')
var { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

var app = express()
var server = http.createServer(app)
var io = socketio(server)

var port = process.env.PORT || 3000
var publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log("New web socket connection")

    socket.on('join', (options, callback) => {
        var { error, user } = addUser({ id: socket.id, ...options })

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', `Welcome ${user.username}!`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        var user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback('Delivered!')
    })

    socket.on('sendLocation', (coords, callback) => {
        var user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        var user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room, 
                users: getUsersInRoom(user.room)
            })
        }
    })    
})

server.listen(port, () => {
    console.log("Server on:", port)
})