const express = require('express');
const res = require('express/lib/response');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
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
let rooms = {};

function playerCntFactory() {
  lobbySockets = io.sockets.adapter.rooms.get('lobby');
  playerLobbyCnt = lobbySockets == undefined ? 0 : lobbySockets.size;
  gameplaySockets = io.sockets.adapter.rooms.get('gameplay');
  playerGameplayCnt = gameplaySockets == undefined ? 0 : gameplaySockets.size;
  return { playerLobbyCnt, playerGameplayCnt };
}

io.on('connection', (socket) => {
  console.log('hello');

  socket.on('new player in the lobby', (player) => {
    socket.join('lobby');
    console.log(`${player.id} entered lobby`);
    io.emit('count updated', playerCntFactory());
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
      socket.join('gameplay');
      io.emit('count updated', playerCntFactory());
      socket.join(roomId);
      if (rooms[roomId] == undefined) {
        rooms[roomId] = { wantStartCnt: 0 };
      }
      rooms[roomId][socket.id] = null;
      console.log(`${socket.id} joined`);
    } else {
      socket.emit("the room is full, can't join");
    }
  });

  socket.on('player wants to start', (player) => {
    let uuid = crypto.randomUUID();
    socket.leave('lobby');
    io.emit('count updated', playerCntFactory());
    socket.emit('can join', uuid);
  });

  socket.on('disconnect', () => {
    console.log('rip ' + socket.id);
    io.emit('count updated', playerCntFactory());
    // find roomId associated with the playerId
    let targetRoomId;
    for (let [roomId, value] of Object.entries(rooms)) {
      // console.log(roomId);
      // console.log(value);
      for (let playerId of Object.keys(value)) {
        // console.log('playerId: ' + playerId);
        if (playerId == socket.id) {
          targetRoomId = roomId;
        }
      }
    }
    console.log('target: ' + targetRoomId);
    socket.to(targetRoomId).emit('the other player disconnected');
    rooms[targetRoomId] = null;
  });

  socket.on('start round', ({ playerId, roomId, map }) => {
    rooms[roomId][playerId] = { map, points: 0 };
    rooms[roomId].wantStartCnt++;
    if (rooms[roomId].wantStartCnt == 2) {
      io.in(roomId).emit('the round started');
      io.to(playerId).emit('it is your turn');
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
      socket.to(roomId).emit('receive attack', { index, isSuccess: true });
      if (rooms[roomId][socket.id].points == 15) {
        socket.emit('you have won');
        socket.to(roomId).emit('you have lost');
      } else {
        socket.to(roomId).emit('it is your turn');
      }
    } else {
      socket.emit('attack status', { index, isSuccess: false });
      socket.to(roomId).emit('receive attack', { index, isSuccess: false });
      socket.to(roomId).emit('it is your turn');
    }
  });
});
