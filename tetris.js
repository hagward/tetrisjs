const options = {
  blockSize: 30,
  widthInBlocks: 10,
  heightInBlocks: 24,
  colors: [
    "#1C82AD", // cyan
    "#FFD700", // yellow
    "#810CA8", // purple
    "#00337C", // blue
    "#FA7D09", // orange
    "#4E9F3D", // green
    "#CD1818", // red
  ],
  gridColor: "#222",
};

const RUNNING = 0;
const PAUSED = 1;
const GAME_OVER = 2;

const width = options.widthInBlocks * options.blockSize;
const height = options.heightInBlocks * options.blockSize;
const scale = window.devicePixelRatio;

const canvas = document.getElementById("canvas");
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
canvas.width = Math.floor(width * scale);
canvas.height = Math.floor(height * scale);

const context = canvas.getContext("2d");
context.scale(scale, scale);
context.strokeStyle = options.gridColor;

// Contains all 19 fixed tetrominos. The first element in the innermost lists is the pivot block
// that the other blocks rotates around.
const tetrominos = [
  [[[0,0],[-1,0],[1,0],[2,0]], [[0,0],[0,-1],[0,1],[0,2]]],           // I
  [[[0,0],[1,0],[0,-1],[1,-1]]],                                      // O
  [[[0,0],[-1,0],[1,0],[0,-1]], [[0,0],[0,-1],[0,1],[1,0]],           // T
          [[0,0],[-1,0],[1,0],[0,1]], [[0,0],[0,-1],[0,1],[-1,0]]],
  [[[0,0],[-1,0],[1,0],[-1,-1]], [[0,0],[0,-1],[0,1],[1,-1]],         // J
          [[0,0],[-1,0],[1,0],[1,1]], [[0,0],[0,-1],[0,1],[-1,1]]],
  [[[0,0],[-1,0],[1,0],[1,-1]], [[0,0],[0,-1],[0,1],[1,1]],           // L
          [[0,0],[-1,0],[1,0],[-1,1]], [[0,0],[0,-1],[0,1],[-1,-1]]],
  [[[0,0],[0,1],[-1,1],[1,0]], [[0,0],[0,-1],[1,0],[1,1]]],           // S
  [[[0,0],[-1,0],[0,1],[1,1]], [[0,0],[0,1],[1,0],[1,-1]]]            // Z
];

const TETROMINO_I = 0;
const TETROMINO_O = 1;
const TETROMINO_T = 2;
const TETROMINO_J = 3;
const TETROMINO_L = 4;
const TETROMINO_S = 5;
const TETROMINO_Z = 6;

const state = {
  state: RUNNING,
  timestamp: {
    game: undefined,
    advance: undefined,
    move: undefined,
  },
  keydown: {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowDown: false,
    ArrowUp: false,
  },
  currentTetromino: {
    x: 0,
    y: 0,
    tetromino: 0,
    rotation: 0,
  },
  playfield: Array.from(Array(options.heightInBlocks), () =>
    Array.from(Array(options.widthInBlocks), () => -1)
  ),
};

function run(timestamp) {
  if (state.state !== RUNNING) {
    return;
  }

  if (state.timestamp.game === undefined || timestamp - state.timestamp.game >= 16) {
    update(timestamp);
    draw();
    state.timestamp.game = timestamp;
  }
  window.requestAnimationFrame(run);
}

function update(timestamp) {
  if (state.timestamp.advance === undefined) {
    state.timestamp.advance = timestamp;
  }
  if (timestamp - state.timestamp.advance >= 1000) {
    if (!tryLand()) {
      state.currentTetromino.y++;
    }
    state.timestamp.advance = timestamp;
  }

  if (state.keydown.ArrowLeft || state.keydown.ArrowRight) {
    if (state.timestamp.move === undefined) {
      tryMoveLeftOrRight(state.keydown.ArrowLeft ? -1 : 1);
      state.timestamp.move = timestamp;
    } else if (timestamp - state.timestamp.move >= 200) {
      tryMoveLeftOrRight(state.keydown.ArrowLeft ? -1 : 1);
    }
  }

  if (state.keydown.ArrowUp) {
    tryRotate(1);
  }

  if (state.keydown.ArrowDown) {
    if (!canLand()) {
      state.currentTetromino.y++;
    }
  }
}

function tryMoveLeftOrRight(dx) {
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const newX = x + dx;
  const blocks = tetrominos[tetromino][rotation];
  if (!isValidPosition(blocks, newX, y)) {
    return;
  }
  state.currentTetromino.x = newX;
}

function tryRotate(dr) {
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const newRotation = (rotation + dr) % tetrominos[tetromino].length;
  const blocks = tetrominos[tetromino][newRotation];
  if (!isValidPosition(blocks, x, y)) {
    return;
  }
  state.currentTetromino.rotation = newRotation;
  state.keydown.ArrowUp = false;
}

function tryLand() {
  if (!canLand()) {
    return false;
  }

  land();
  clearLines();
  if (!trySpawnNew()) {
    state.state = GAME_OVER;
    return false;
  }
  return true;
}

function canLand() {
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const blocks = tetrominos[tetromino][rotation];
  for (let i = 0; i < blocks.length; i++) {
    const blockX = x + blocks[i][0];
    const blockY = y + blocks[i][1];
    if (blockY >= options.heightInBlocks - 1 || state.playfield[blockY + 1][blockX] > -1) {
      return true;
    }
  }
  return false;
}

function land() {
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const blocks = tetrominos[tetromino][rotation];
  for (let i = 0; i < blocks.length; i++) {
    const blockX = x + blocks[i][0];
    const blockY = y + blocks[i][1];
    state.playfield[blockY][blockX] = tetromino;
  }
}

function clearLines() {
  for (let y = options.heightInBlocks - 1; y >= 0; y--) {
    let fullRow = true;
    for (let x = 0; x < options.widthInBlocks; x++) {
      if (state.playfield[y][x] === -1) {
        fullRow = false;
        break;
      }
    }
    if (fullRow) {
      state.playfield.splice(y, 1);
      state.playfield.unshift(Array.from(Array(options.widthInBlocks), () => -1));
    }
  }
}

function isValidPosition(tetromino, x, y) {
  for (let i = 0; i < tetromino.length; i++) {
    const blockX = x + tetromino[i][0];
    if (blockX < 0 || blockX >= options.widthInBlocks) {
      return false;
    }
    const blockY = y + tetromino[i][1];
    if (blockY >= 0) {
      if (blockX >= 0 && state.playfield[blockY][blockX] > -1) {
        return false;
      }
      if (blockX <= options.widthInBlocks - 1 && state.playfield[blockY][blockX] > -1) {
        return false;
      }
    }
  }
  return true;
}

function trySpawnNew() {
  const tetromino = Math.floor(Math.random() * tetrominos.length);
  const x = 4;
  const y = ([TETROMINO_I, TETROMINO_S, TETROMINO_Z].includes(tetromino)) ? 0 : 1;
  const rotation = 0;
  const blocks = tetrominos[tetromino][rotation];
  if (!isValidPosition(blocks, x, y)) {
    return false;
  }

  state.currentTetromino.tetromino = tetromino;
  state.currentTetromino.x = x;
  state.currentTetromino.y = y;
  state.currentTetromino.rotation = rotation;
  return true;
}

function draw() {
  context.clearRect(0, 0, width, height);

  // Draw landed.
  for (let y = 0; y < options.heightInBlocks; y++) {
    for (let x = 0; x < options.widthInBlocks; x++) {
      const colorIndex = state.playfield[y][x];
      if (colorIndex > -1) {
        context.fillStyle = options.colors[colorIndex];
        context.fillRect(
          x * options.blockSize,
          y * options.blockSize,
          options.blockSize,
          options.blockSize
        );
      }
    }
  }

  // Draw current.
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const blocks = tetrominos[tetromino][rotation];
  context.fillStyle = options.colors[tetromino];
  for (let i = 0; i < blocks.length; i++) {
    context.fillRect(
      (blocks[i][0] + x) * options.blockSize,
      (blocks[i][1] + y) * options.blockSize,
      options.blockSize,
      options.blockSize
    );
  }

  // Draw grid.
  context.beginPath();
  for (let y = 0; y < options.heightInBlocks; y++) {
    context.moveTo(0, y * options.blockSize);
    context.lineTo(width, y * options.blockSize);
  }
  for (let x = 0; x < options.widthInBlocks; x++) {
    context.moveTo(x * options.blockSize, 0);
    context.lineTo(x * options.blockSize, height);
  }
  context.stroke();
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  switch (event.key) {
    case "ArrowLeft":
    case "ArrowRight":
    case "ArrowDown":
    case "ArrowUp":
      event.preventDefault();
      state.keydown[event.key] = true;
      break;
  }
});

document.addEventListener("keyup", ({ key }) => {
  switch (key) {
    case "ArrowLeft":
    case "ArrowRight":
    case "ArrowDown":
    case "ArrowUp":
      state.keydown[key] = false;
      state.timestamp.move = undefined;
      break;
  }
});

trySpawnNew();
window.requestAnimationFrame(run);
