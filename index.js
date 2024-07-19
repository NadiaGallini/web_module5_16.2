const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const filePath = path.join(__dirname, 'views', 'index.html');
    fs.readFile(filePath, 'utf-8', (err, content) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(content);
    });
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found');
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('updateUserCount', onlineUsers);
  
  console.log('New client connected');
  
  socket.on('joinRoom', (room) => {
    socket.join(room);
    const roomSize = io.sockets.adapter.rooms.get(room).size;
    io.to(room).emit('updateRoomUserCount', roomSize);
    console.log(`Client joined room: ${room}`);
  });

  socket.on('message', (data) => {
    const { room, message } = data;
    console.log(`Received message: ${message} in room: ${room}`);
    io.to(room).emit('message', message);
  });

  socket.on('privateMessage', (data) => {
    const { to, message } = data;
    console.log(`Private message from ${socket.id} to ${to}: ${message}`);
    socket.to(to).emit('privateMessage', { from: socket.id, message });
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('updateUserCount', onlineUsers);

    socket.rooms.forEach(room => {
      const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
      io.to(room).emit('updateRoomUserCount', roomSize);
    });
    
    console.log('Client disconnected');
  });
});

httpServer.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
