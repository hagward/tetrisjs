const options = {
  blockSize: 30,
  widthInBlocks: 10,
  heightInBlocks: 24,
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

// Contains all 19 fixed tetriminos. The first element in all lists is the
// pivot element that the other g_blocks rotate around.
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
  const { x, tetromino, rotation } = state.currentTetromino;
  const newX = x + dx;
  const blocks = tetrominos[tetromino][rotation];
  for (let i = 0; i < blocks.length; i++) {
    if (newX + blocks[i][0] < 0 || newX + blocks[i][0] >= options.widthInBlocks) {
      return;
    }
  }
  state.currentTetromino.x = newX;
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
    state.playfield[blockY][blockX] = 1;
  }
}

function spawnNew() {
  state.currentTetromino.x = 0;
  state.currentTetromino.y = 0;
  state.currentTetromino.rotation = 0;
  state.currentTetromino.tetromino = (state.currentTetromino.tetromino + 1) % tetrominos.length;
}

function draw() {
  context.clearRect(0, 0, width, height);

  // Draw current.
  const { x, y, tetromino, rotation } = state.currentTetromino;
  const blocks = tetrominos[tetromino][rotation];
  for (let i = 0; i < blocks.length; i++) {
    context.fillRect(
      (blocks[i][0] + x) * options.blockSize,
      (blocks[i][1] + y) * options.blockSize,
      options.blockSize,
      options.blockSize
    );
  }

  // Draw landed.
  context.beginPath();
  for (let y = 0; y < options.heightInBlocks; y++) {
    for (let x = 0; x < options.widthInBlocks; x++) {
      if (state.playfield[y][x] > -1) {
        context.rect(
          x * options.blockSize,
          y * options.blockSize,
          options.blockSize,
          options.blockSize
        );
      }
    }
  }
  context.fill();
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

window.requestAnimationFrame(run);
