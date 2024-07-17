const socket = io();

let canvas, ctx;
let players = {};
let playerId = null;
let playerName = null;
const speed = 5;
const playerSize = 35;

let playerInputs = {
  left: false,
  right: false,
  up: false,
  down: false
};

document.getElementById('start-button').onclick = () => {
  playerName = document.getElementById('name-input').value;
  if (playerName) {
    socket.emit('newPlayer', playerName);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    initGame();
  }
};

function initGame() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('resize', resizeCanvas);

  socket.on('updatePlayers', (updatedPlayers) => {
    players = updatedPlayers;
    playerId = socket.id;
    draw();
  });

  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth - 20; // Adjust width for border
  canvas.height = window.innerHeight - 20; // Adjust height for border
}

function handleKeyDown(e) {
  e.preventDefault();
  if (!playerId) return;

  const player = players[playerId];
  switch (e.key) {
    case 'w':
      playerInputs.up = true;
      break;
    case 'a':
      playerInputs.left = true;
      break;
    case 's':
      playerInputs.down = true;
      break;
    case 'd':
      playerInputs.right = true;
      break;
  }
}

function handleKeyUp(e) {
  e.preventDefault();
  if (!playerId) return;

  const player = players[playerId];
  switch (e.key) {
    case 'w':
      playerInputs.up = false;
      break;
    case 'a':
      playerInputs.left = false;
      break;
    case 's':
      playerInputs.down = false;
      break;
    case 'd':
      playerInputs.right = false;
      break;
  }
}

function gameLoop() {
  movePlayer();
  checkTagging();
  draw();
  requestAnimationFrame(gameLoop);
}

function movePlayer() {
  if (!playerId) return;

  const player = players[playerId];
  let dx = 0;
  let dy = 0;

  if (playerInputs.up) dy -= speed;
  if (playerInputs.left) dx -= speed;
  if (playerInputs.down) dy += speed;
  if (playerInputs.right) dx += speed;

  if (dx !== 0 || dy !== 0) {
    const newX = player.x + dx;
    const newY = player.y + dy;

    // Prevent players from moving through the border
    if (newX >= 0 && newX + playerSize <= canvas.width &&
        newY >= 0 && newY + playerSize <= canvas.height) {
      player.x = newX;
      player.y = newY;
      socket.emit('movePlayer', { x: player.x, y: player.y });
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const id in players) {
    const player = players[id];
    ctx.fillStyle = player.isIt ? 'red' : 'green';
    ctx.fillRect(player.x, player.y, playerSize, playerSize);

    ctx.fillStyle = '#000';
    ctx.font = '16px Arial'; // Adjust font size here (e.g., 16px)
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x + playerSize / 2, player.y - 10);

    if (id === playerId) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, player.y, playerSize, playerSize);
    }
  }

  updateScoreboard();
}

function updateScoreboard() {
  const scoreboard = document.getElementById('scoreboard');
  scoreboard.innerHTML = '<h3>Scoreboard</h3>';
  const sortedPlayers = Object.values(players).sort((a, b) => b.notItTime - a.notItTime);
  sortedPlayers.forEach(player => {
    const playerScore = document.createElement('div');
    playerScore.innerText = `${player.name}: ${player.notItTime} seconds`;
    scoreboard.appendChild(playerScore);
  });
}

function checkTagging() {
  const itPlayer = players[playerId];
  if (!itPlayer || !itPlayer.isIt) return;

  for (const id in players) {
    if (id === playerId) continue;

    const player = players[id];
    if (collides(itPlayer, player)) {
      socket.emit('tag', id);
      break;
    }
  }
}

function collides(player1, player2) {
  return player1.x < player2.x + playerSize &&
         player1.x + playerSize > player2.x &&
         player1.y < player2.y + playerSize &&
         player1.y + playerSize > player2.y;
}

// Inside the renderPlayers function in game.js

for (let id in players) {
  const player = players[id];
  ctx.fillStyle = '#000'; // Black color for text
  ctx.font = '12px Arial';
  ctx.fillText(player.name, player.x, player.y - 20);
}


