const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// Создаем HTTP сервер
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

// Создаем Socket.IO сервер
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

const messages = ['Hello world!', 'New Message'];

io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Отправка старых сообщений новым клиентам
    messages.forEach((message) => {
      socket.emit('message', message);
    });
  
    // Обработка новых сообщений от клиентов
    socket.on('message', (message) => {
      console.log('Received message:', message);
      messages.push(message); // Добавляем новое сообщение в массив
      io.emit('message', message); // Отправляем сообщение всем клиентам
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

httpServer.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
