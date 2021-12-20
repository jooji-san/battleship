const express = require('express');
const res = require('express/lib/response');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { SocketAddress } = require('net');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 80;
const io = new Server(server);

// app.set('view engine', 'pug');

app.use(express.static('public', { extensions: ['html'] }));

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

// routing

app.get('/', (req, res) => {
  res.redirect('lobby');
});

// app.get('/', (req, res) => {
//   res.render('lobby.pug', {
//     playerCnt: players.totalPlayers,
//     playerInLobbyCnt: players.lobby.length,
//   });
// });

// socket.io

io.on('connection', (socket) => {
  console.log('hello');

  socket.on('new player in the lobby', (player) => {
    socket.join('lobby');
    console.log(`${player.id} entered lobby`);
  });
  // socket.on('new player joined the room' (player) => {
  //   for (int )
  //   socket.join('')
  // })

  socket.on('player wants to join a room', (player) => {
    socket.join('waitingRoom');
    // maybe greater than
    if (io.sockets.adapter.rooms.get('waitingRoom').size == 2) {
      let uuid = crypto.randomUUID();
      io.to('waitingRoom').emit('can join', uuid);
      io.socketsLeave('waitingRoom');
    }
  });

  socket.on('let me join this room', (roomId) => {
    if (
      io.sockets.adapter.rooms.get(roomId) == undefined ||
      io.sockets.adapter.rooms.get(roomId).size < 2
    ) {
      socket.join(roomId);
      console.log(`${socket.id} joined`);
    } else {
      socket.emit("the room is full, can't join");
    }
  });

  socket.on('player wants to start', (player) => {
    let uuid = crypto.randomUUID();
    socket.emit('can join', uuid);
  });

  socket.on('disconnect', () => {
    console.log('rip ' + socket.id);
    socket.broadcast.emit('other player disconnected');
  });

  rooms = {};
  socket.on('start round', ({ playerId, roomId, map }) => {
    // maybe there is a better way of doing this
    if (rooms[roomId] == undefined) {
      rooms[roomId] = {};
    }
    rooms[roomId][playerId] = { map, points: 0 };
    if (Object.keys(rooms[roomId]).length == 2) {
      io.in(roomId).emit('the round started', playerId);
    }
  });

  socket.on('attack', ({ roomId, index }) => {
    let player2Map;
    for (const playerId of Object.keys(rooms[roomId])) {
      if (playerId != socket.id) {
        player2Map = rooms[roomId][playerId].map;
      }
    }

    if (player2Map[index] == 1) {
      socket.emit('attack status', { index, isSuccess: true });
      rooms[roomId][socket.id].points++;
      if (rooms[roomId][socket.id].points == 15) {
        socket.emit('you have won');
        socket.to(roomId).emit('you have lost');
      } else {
        socket.to(roomId).emit('it is your turn');
      }
    } else {
      socket.emit('attack status', { index, isSuccess: false });
      socket.to(roomId).emit('it is your turn');
    }
  });
});
