const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let players = {};
let itPlayerId = null;

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('newPlayer', (name) => {
    players[socket.id] = {
      id: socket.id,
      name: name,
      x: Math.random() * 800,
      y: Math.random() * 600,
      isIt: false,
      notItTime: 0
    };

    if (!itPlayerId) {
      itPlayerId = socket.id;
      players[socket.id].isIt = true;
    }

    io.emit('updatePlayers', players);
  });

  socket.on('movePlayer', (movementData) => {
    const player = players[socket.id];
    if (player) {
      player.x = movementData.x;
      player.y = movementData.y;
      io.emit('updatePlayers', players);
    }
  });

  socket.on('tag', (taggedPlayerId) => {
    if (players[socket.id].isIt) {
      players[socket.id].isIt = false;
      players[taggedPlayerId].isIt = true;
      itPlayerId = taggedPlayerId;
      io.emit('updatePlayers', players);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    if (itPlayerId === socket.id) {
      const playerIds = Object.keys(players);
      if (playerIds.length > 0) {
        itPlayerId = playerIds[0];
        players[itPlayerId].isIt = true;
      } else {
        itPlayerId = null;
      }
    }
    io.emit('updatePlayers', players);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
