import { getSocket } from './socket.js';
let socket = getSocket();

let roomId;

window.onload = function () {
  let params = new URLSearchParams(document.location.search);
  roomId = params.get('roomId');
  let roomIdHeader = document.querySelector('#room-id');
  roomIdHeader.textContent = roomId;
};

socket.on('connect', () => {
  console.log('conn');
  console.log(`${socket.id} joined`);
  socket.emit('let me join this room', roomId);
});

socket.on("the room is full, can't join", () => {
  console.log("can't join");
  let gameplayDiv = document.querySelector('.gameplay');
  gameplayDiv.style.filter = 'blur(10px)';
  let CantJoinHeader = document.createElement('h1');
  CantJoinHeader.classList.add('cant-join');
  CantJoinHeader.textContent = "the room is full. Can't join";
  document.body.append(CantJoinHeader);
});

socket.on('map changed', (data) => {
  console.log(data);
  render(data.shipMap, player2Map);
});

socket.on('other player disconnected', () => {
  console.log('the other player disconnected');
});

function render(map, grid) {
  console.log('rendering');
  console.log(map);
  for (let i = 0; i < 100; i++) {
    if (map[i] === 1) {
      console.log('red');
      grid[i].style.backgroundColor = 'red';
    } else {
      grid[i].style.backgroundColor = '#3E39A0';
    }
  }
}

var player1BoardDiv = document.querySelector('.player1-board');
var player2BoardDiv = document.querySelector('.player2-board');
var shipsDiv = document.querySelector('.ships');
var isShipSelected = false;
var shipSelectedSize = 0;
var pos = 0;

var prevPos;

function createBoard(playerBoardDiv) {
  for (let i = 0; i < 100; i++) {
    playerBoardDiv.appendChild(document.createElement('div'));
  }
}

function createShip(size) {
  let ship = document.createElement('div');
  ship.classList.add('ship');
  for (let i = 0; i < size; i++) {
    ship.appendChild(document.createElement('div'));
  }
  shipsDiv.appendChild(ship);
  console.log('ship added');
}

function createShips() {
  for (let i = 1; i <= 5; i++) {
    createShip(i);
  }
}

createBoard(player1BoardDiv);
createBoard(player2BoardDiv);
createShips();

//select tiles
var player1Map = document.querySelectorAll('.player1-board div');
var player2Map = document.querySelectorAll('.player2-board div');
var shipDivs = document.querySelectorAll('.ship');

var shipMap = [];
var shipInfo = [];

// shipMap.fill(0, 0); // set correct end parameter

function handleShipDivClick(size) {
  isShipSelected = true;
  shipSelectedSize = size;

  if (shipInfo[shipSelectedSize - 1] != undefined) {
    let inc = 1;
    if (shipInfo[shipSelectedSize - 1][1]) inc = 10; // for rotation
    for (let i = 0; i < shipSelectedSize * inc; i += inc) {
      player1Map[shipInfo[shipSelectedSize - 1][0] + i].style.backgroundColor =
        '#3E39A0';
      shipMap[shipInfo[shipSelectedSize - 1][0] + i] = 0;
    }
  }
  renderBoard();
}

// attach event listeners to ships
shipDivs.forEach((shipDiv, index) => {
  console.log('add event listener');
  shipDiv.addEventListener('click', () => handleShipDivClick(index + 1));
});

function isChecked() {
  var checkbox = document.querySelector('input[type=checkbox]');
  return checkbox.checked;
}

function renderBoard() {
  for (let i = 0; i < 100; i++) {
    if (shipMap[i] != 1) {
      player1Map[i].style.backgroundColor = '#3E39A0';
    } else if (shipMap[i] == 1) {
      player1Map[i].style.backgroundColor = 'red';
    }
  }
}
// i don't know why it's here
document
  .querySelector('input[type=checkbox]')
  .addEventListener('change', renderBoard);

function checkBoundaries() {
  let check = true;
  if (!isChecked()) {
    if (Math.floor(pos / 10) != Math.floor((pos + shipSelectedSize - 1) / 10)) {
      check = false;
    }
  } else {
    if (pos + (shipSelectedSize - 1) * 10 >= 100) {
      check = false;
    }
  }
  return check;
}

function checkOverlap() {
  let check = true;
  let inc = 1;
  if (isChecked()) inc = 10;
  for (let k = 0; k < shipSelectedSize * inc; k += inc) {
    if (shipMap[pos + k] == 1) {
      check = false;
      break;
    }
  }
  return check;
}

// think i should move some variables next to this function. maybe with a module pattern or classes(?)
function placeship(e, index) {
  if (!isShipSelected) return;

  let inc = 1;
  if (isChecked()) inc = 10;
  pos = index;
  // check is used for two different things.
  // and also it can be confused with a isChecked function !!
  // that does yet another different thing
  // don't let ships overlap

  if (checkBoundaries() && checkOverlap()) {
    // remove ship
    if (prevPos != null) {
      for (let i = 0; i < shipSelectedSize * inc; i += inc) {
        if (player1Map[prevPos + i] != null) {
          player1Map[prevPos + i].style.backgroundColor = '#3E39A0';
        }
      }
    }
    // draw ship
    prevPos = index;
    inc = 1;
    if (isChecked()) inc = 10;
    for (let i = 0; i < shipSelectedSize * inc; i += inc) {
      if (player1Map[pos + i] != null)
        player1Map[pos + i].style.backgroundColor = 'red';
    }
  }
  // this does none of the checks
  // and this is what causes bugs
  e.target.addEventListener('click', (e) => {
    if (!(checkBoundaries() && checkOverlap())) return;
    inc = 1;
    if (isChecked()) inc = 10;
    prevPos = null;
    isShipSelected = false;
    shipInfo[shipSelectedSize - 1] = [pos, isChecked()];
    for (let i = 0; i < shipSelectedSize * inc; i += inc) {
      shipMap[pos + i] = 1;
      player1Map[pos + i].removeEventListener('mouseover', placeship); // ?
    }
    shipSelectedSize = 0;
    pos = 0;
    socket.emit('map changed', { roomId, shipMap });
  });
}
player1Map.forEach((tile, index) => {
  tile.addEventListener('mouseover', (e) => placeship(e, index));
});
