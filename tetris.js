const options = {
  blockSize: 30,
  widthInBlocks: 10,
  heightInBlocks: 24,
  colors: [
    "#95BDFF", // turquoise
    "#FFD966", // yellow
    "#BA90C6", // purple
    "#7286D3", // blue
    "#FAAB78", // orange
    "#A2CDB0", // green
    "#FD8A8A", // red
  ],
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
context.strokeStyle = '#'

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
  },
  keydown: {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowDown: false,
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

  if (state.keydown.ArrowLeft) {
    tryMoveLeftOrRight(-1);
  } else if (state.keydown.ArrowRight) {
    tryMoveLeftOrRight(1);
  }

  if (state.keydown.ArrowDown) {
    if (!tryLand()) {
      state.currentTetromino.y++;
    }
  }
}

function tryMoveLeftOrRight(dx) {
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const blocks = tetrominos[tetromino][rotation];
  for (let i = 0; i < blocks.length; i++) {
    const blockX = x + dx + blocks[i][0];
    if (blockX < 0 || blockX >= options.widthInBlocks) {
      return;
    }
    const blockY = y + blocks[i][1];
    if (blockY >= 0) {
      if (blockX >= 0 && state.playfield[blockY][blockX] > -1) {
        return;
      }
      if (blockX <= options.widthInBlocks - 1 && state.playfield[blockY][blockX] > -1) {
        return;
      }
    }
  }
  state.currentTetromino.x = x + dx;
}

function tryLand() {
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const blocks = tetrominos[tetromino][rotation];
  for (let i = 0; i < blocks.length; i++) {
    const blockX = x + blocks[i][0];
    const blockY = y + blocks[i][1];
    console.log(`blockX: ${blockX}, blockY: ${blockY}`);
    if (blockY >= options.heightInBlocks - 1 || state.playfield[blockY + 1][blockX] > -1) {
      land();
      spawnNew();
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

function spawnNew() {
  const tetromino = Math.floor(Math.random() * tetrominos.length);
  state.currentTetromino.tetromino = tetromino;
  state.currentTetromino.x = 4;
  state.currentTetromino.y = ([TETROMINO_I, TETROMINO_S, TETROMINO_Z].includes(tetromino)) ? 0 : 1;
  state.currentTetromino.rotation = 0;
}

function draw() {
  context.clearRect(0, 0, width, height);

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
}

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
    case "ArrowRight":
    case "ArrowDown":
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
      state.keydown[key] = false;
      break;
  }
});

spawnNew();
window.requestAnimationFrame(run);
