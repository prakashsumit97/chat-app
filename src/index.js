const express = require('express');
const app = express();
const http = require('http')
const path = require('path');
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage} = require('./utils/message')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')


const server = http.createServer(app)
const io = socketio(server)


// Define paths for Express config
const publicDirectory = path.join(__dirname,'../public')
const port = process.env.PORT||3000;

// setup static directory to serve
app.use(express.static(publicDirectory))

io.on('connection',(socket)=>{
   socket.on('sendMessage',(message,callback)=>{
       const filter = new Filter();
       if(filter.isProfane(message)){
           return callback('Profanity is not allowed.')
       }
       let user = getUser(socket.id)
       io.to(user.room).emit('message',generateMessage(message,user.username))
       callback()
   })

   socket.on('disconnect',()=>{
       const user = removeUser(socket.id)
       if (user) {
           io.to(user.room).emit('message', generateMessage(`${user.username} has left!`,user.username))
           io.to(user.room).emit('roomData',{
               room:user.room,
               users:getUsersInRoom(user.room)
           })
       }
   })

    socket.on('sendLocation', (message,callback) => {
        // io.emit('message', `https://google.com/maps?q=${message}`)
        let user = getUser(socket.id)
        io.to(user.room).emit('sendLocationMessage', generateMessage(`https://google.com/maps?q=${message}`,user.username))
        callback('Location shared')
    })

    socket.on('join', (options,callback) => {
        const {error,user} = addUser({id:socket.id,...options})
        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Welcome to Chatboat.',"Admin"))
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined!`,user.username))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })


        // io.to.emit
        callback()
    })
})

app.get('',(req,res)=>{
    res.render('index',{
        title:"Weather App",
        name:"Sumit Prakash"
    });
})

server.listen(port,()=>{
    console.log(`server is up in port ${port}`);
})