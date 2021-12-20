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

socket.on('the other player disconnected', () => {
  console.log('the other player disconnected');
});

// function render(map, grid) {
//   console.log('rendering');
//   console.log(map);
//   for (let i = 0; i < 100; i++) {
//     if (map[i] === 1) {
//       console.log('red');
//       grid[i].style.backgroundColor = 'red';
//     } else {
//       grid[i].style.backgroundColor = '#3E39A0';
//     }
//   }
// }

{
  let player1BoardDiv = document.querySelector('.player1-board');
  let player2BoardDiv = document.querySelector('.player2-board');
  let shipsDiv = document.querySelector('.ships');

  function createBoard(playerBoardDiv) {
    for (let i = 0; i < 100; i++) {
      let tile = document.createElement('div');
      tile.dataset.index = i;
      playerBoardDiv.appendChild(tile);
    }
  }

  function createShip(size) {
    let ship = document.createElement('div');
    ship.classList.add('ship');
    ship.dataset.size = size;
    console.log(size);
    for (let i = 0; i < size; i++) {
      ship.appendChild(document.createElement('div'));
    }
    shipsDiv.appendChild(ship);
  }

  function createShips() {
    for (let i = 1; i <= 5; i++) {
      createShip(i);
    }
  }

  createBoard(player1BoardDiv);
  createBoard(player2BoardDiv);
  createShips();
}

{
  let isShipSelected = false;
  let shipSelectedSize;
  let pos;
  let prevPos;

  let player1Map = Array(100).fill(0, 0);

  let inc = 1;

  let shipInfos = [];

  // attach event listeners to ships
  let shipDivs = document.querySelectorAll('.ship');
  function handleShipDivClick(e) {
    isShipSelected = true;
    shipSelectedSize = parseInt(e.currentTarget.dataset.size);

    if (
      shipInfos[shipSelectedSize - 1] != undefined ||
      shipInfos[shipSelectedSize - 1] != null
    ) {
      if (shipInfos[shipSelectedSize - 1][1]) inc = 10;
      else inc = 1;

      for (let i = 0; i < shipSelectedSize * inc; i += inc) {
        console.log(i);
        player1TileDivs[
          shipInfos[shipSelectedSize - 1][0] + i
        ].style.backgroundColor = '#3E39A0';
        player1Map[shipInfos[shipSelectedSize - 1][0] + i] = 0;
      }
      shipInfos[shipSelectedSize - 1] = null;
    }
    // takes care of a glitch. when you are hovering one ship and
    // then select another one without inserting the previous one,
    // the previous ship image stays up on the board
    renderBoard();
  }
  shipDivs.forEach((shipDiv) => {
    shipDiv.addEventListener('click', handleShipDivClick);
  });

  let player1TileDivs = document.querySelectorAll('.player1-board div');
  for (const player1TileDiv of player1TileDivs) {
    player1TileDiv.addEventListener('click', (e) => {
      if (!isShipSelected) return;
      if (!(checkBoundaries() && checkOverlap())) return;

      setInc();
      prevPos = null;
      isShipSelected = false;
      shipInfos[shipSelectedSize - 1] = [pos, isRotated()];
      for (let i = 0; i < shipSelectedSize * inc; i += inc) {
        player1Map[pos + i] = 1;
        player1TileDivs[pos + i].removeEventListener('mouseover', hoverShip); // ?
      }
      shipSelectedSize = 0;
      pos = 0;
    });
  }

  document
    .querySelector('input[type=checkbox]')
    .addEventListener('change', renderBoard);

  function setInc() {
    if (isRotated()) inc = 10;
    else inc = 1;
  }

  function isRotated() {
    var checkbox = document.querySelector('input[type=checkbox]');
    return checkbox.checked;
  }

  function renderBoard() {
    for (let i = 0; i < 100; i++) {
      if (player1Map[i] != 1) {
        player1TileDivs[i].style.backgroundColor = '#3E39A0';
      } else if (player1Map[i] == 1) {
        player1TileDivs[i].style.backgroundColor = 'red';
      }
    }
  }

  function checkBoundaries() {
    let check = true;
    if (!isRotated()) {
      if (
        Math.floor(pos / 10) != Math.floor((pos + shipSelectedSize - 1) / 10)
      ) {
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
    setInc();
    for (let k = 0; k < shipSelectedSize * inc; k += inc) {
      if (player1Map[pos + k] == 1) {
        check = false;
        break;
      }
    }
    return check;
  }

  // think i should move some variables next to this function. maybe with a module pattern or classes(?)
  function hoverShip(e, index) {
    if (!isShipSelected) return;
    console.log(shipInfos);

    setInc();
    pos = index;
    if (checkBoundaries() && checkOverlap()) {
      // erase the ship
      if (prevPos != null) {
        for (let i = 0; i < shipSelectedSize * inc; i += inc) {
          if (player1TileDivs[prevPos + i] != null) {
            player1TileDivs[prevPos + i].style.backgroundColor = '#3E39A0';
          }
        }
      }
      // draw the ship
      prevPos = index;
      setInc();
      for (let i = 0; i < shipSelectedSize * inc; i += inc) {
        if (player1TileDivs[pos + i] != null)
          player1TileDivs[pos + i].style.backgroundColor = 'red';
      }
    }
  }

  player1TileDivs.forEach((tile, index) => {
    tile.addEventListener('mouseover', (e) => hoverShip(e, index));
  });

  let isStartBtnActive = true;
  function handleStartBtnClick() {
    if (!isStartBtnActive) return;
    check if the player fully populated their board
    if (shipInfos.length != 5) {
      return;
    }
    for (const shipInfo of shipInfos) {
      if (shipInfo == undefined) {
        return;
      }
    }

    isStartBtnActive = false;
    for (const shipDiv of shipDivs) {
      shipDiv.removeEventListener('click', handleShipDivClick);
    }
    socket.emit('start round', {
      playerId: socket.id,
      roomId,
      map: player1Map,
    });
  }
  let startBtn = document.querySelector('#start-btn');
  startBtn.addEventListener('click', handleStartBtnClick);

  socket.on('the round started', (startingPlayerId) => {
    let isPlayer1Turn;
    if (startingPlayerId == socket.id) {
      isPlayer1Turn = true;
    } else {
      isPlayer1Turn = false;
    }

    console.log('the round started');

    let player2Map = Array(100).fill(0, 0);
    function handlePlayer2TileDivClick(e) {
      if (!isPlayer1Turn) return;
      let index = parseInt(e.target.dataset.index);
      if (player2Map[index] == 0) {
        isPlayer1Turn = false;
        player2Map[index] = 1;
        e.target.style.backgroundColor = 'red';
        socket.emit('attack', { roomId, index });
      }
    }
    let player2TileDivs = document.querySelectorAll('.player2-board div');
    for (const [i, player2TileDiv] of player2TileDivs.entries()) {
      player2TileDiv.addEventListener('click', handlePlayer2TileDivClick);
    }

    socket.on('it is your turn', () => (isPlayer1Turn = true));

    socket.on('attack status', ({ index, isSuccess }) => {
      console.log('attack status');
      console.log(isSuccess);
      if (isSuccess) {
        player2TileDivs[index].style.backgroundColor = 'green';
      }
    });

    socket.on('you have won', () => {
      console.log('you have won');
    });

    socket.on('you have lost', () => {
      console.log('you have lost');
    });
  });
}
