const express = require('express');
const res = require('express/lib/response');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { SocketAddress } = require('net');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const PORT = 3000;
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
  // socket.on('newPlayer', (player) => {
  //   // maybe change player.id to socket.id
  //   if (players.playing.find((p) => p.id === player.id)) {
  //     console.log('the player is already in');
  //   } else if (players.length == 2) {
  //     console.log("the room is full. player can't join");
  //   } else {
  //     socket.join('game');
  //     players.push(player);
  //     io.to('game').emit('a new user has joined the room');
  //   }
  // });
  socket.on('disconnect', () => {
    console.log('rip ' + socket.id);
    socket.broadcast.emit('other player disconnected');
  });
  socket.on('map changed', ({ roomId, shipMap }) => {
    if (io.sockets.adapter.rooms.get(roomId).size == 1) {
      socket.emit('the other player disconnected');
      return;
    }
    socket.to(roomId).emit('map changed', { roomId, shipMap });
  });
});
