import { getSocket } from './socket.js';
let socket = getSocket();
socket.on('connect', () => {
  console.log('connected');
  socket.emit('new player in the lobby', { id: socket.id });

  let joinBtn = document.querySelector('#join-btn');
  joinBtn.addEventListener('click', handleJoinBtnClick);
  let startBtn = document.querySelector('#start-btn');
  startBtn.addEventListener('click', handleStartBtnClick);
});

socket.on('other player disconnected', () => {
  console.log('let me join');
  socket.emit('newPlayer', { id: socket.id });
});

socket.on('can join', (roomId) => {
  window.location.href = `gameplay?roomId=` + encodeURIComponent(roomId);
});

function handleJoinBtnClick() {
  socket.emit('player wants to join a room', { id: socket.id });
}

function handleStartBtnClick() {
  socket.emit('player wants to start', { id: socket.id });
}

// function updateCnt(playerCnt, playerInLobbyCnt) {
//   let playerCntSpan = document.querySelector('#playerCnt');
//   let playerInLobbyCntSpan = document.querySelector('#playerInLobbyCnt');
//   playerCntSpan.textContent = playerCnt;
//   playerInLobbyCntSpan.textContent = playerInLobbyCnt;
// }

// export { updateCnt };
