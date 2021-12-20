function handlePlayer2TileDivClick(i) {
  return function () {};
}
let player2TileDivs = document.querySelectorAll('.player2-board div');
for ([i, player2TileDiv] of player2TileDivs.entries()) {
  player2TileDiv.addEventListener('click', handlePlayer2TileDivClick(i));
}
