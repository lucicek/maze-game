import { mazes } from './mazes.js'

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 30;
let mazeCount = 0;

let changingGamestate = false;

let map;

const wall = new Image();
wall.src = './images/wall.png';

const resultBackground = new Image();
resultBackground.src = './images/result-background.png'

const player = {
  x: tileSize + 5,
  y: tileSize + 5,
  size: 20,
  speed: 4,
  image: new Image()
};

player.image.src = './images/right.png';

const gameState = {
  x: 100,
  y: 4,
  width: 150,
  height: 25,
  text: "7-2"
};

let gameStateColour = "aqua";
let objectiveTracker = gameState.text;

class Result{
  x = 0;
  y = 0;
  size = 30;
  calculation;
  constructor(calculationImport){
    this.calculation = calculationImport;
  }

  place(){
    let x, y;
    let valid = false;

    while (!valid) {
      x = Math.floor(Math.random() * (map[0].length * 3 / 4) + map[0].length / 4);
      y = Math.floor(Math.random() * (map.length / 2) + map.length / 2);

      const px = x * tileSize;
      const py = y * tileSize;

      const isWallTile = map[y][x] === 1;

      const wallsAround =
        (map[y-1]?.[x] === 1) +
        (map[y+1]?.[x] === 1) +
        (map[y]?.[x-1] === 1) +
        (map[y]?.[x+1] === 1);

      const tooTight = wallsAround >= 2; 

      const hitsOtherResult = results.some(r =>
        r !== this &&
        px < r.x + r.size &&
        px + this.size > r.x &&
        py < r.y + r.size &&
        py + this.size > r.y
      );

      valid = !isWallTile && !hitsOtherResult && !tooTight;
    }

    this.x = x * tileSize;
    this.y = y * tileSize;
  }
}

const results = [
  new Result('7-2'),
  new Result('6-2'),
  new Result('10-4'),
  new Result('9-1')
]

const keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function levelStart() {
  map = mazes[mazeCount];
  canvas.width  = map[0].length * tileSize;
  canvas.height = map.length * tileSize;
  gameState.width = canvas.width / 6;
  gameState.x = (canvas.width - gameState.width) / 2;

  player.x = tileSize + 5
  player.y = tileSize + 5

  mazeCount++;

  placeResults();
  setCalculation();
}

function getCalculationResult(){
  let returnedResult;

  results.forEach((result) => {
    if(result.calculation === gameState.text){
      returnedResult = result;
    }
  })

  return returnedResult;
}

function isWall(x, y) {
  const col = Math.floor(x / tileSize);
  const row = Math.floor(y / tileSize);
  return map[row]?.[col] === 1;
}

function rectHitsWall(nx, ny) {
  return (
    isWall(nx, ny) ||
    isWall(nx + player.size, ny) ||
    isWall(nx, ny + player.size) ||
    isWall(nx + player.size, ny + player.size)
  );
}

function update() {
  let dx = 0, dy = 0;
  if(!changingGamestate){
    if (keys.a) {
      dx = -player.speed;
      player.image.src = './images/left.png'
    } 
    if (keys.d){
      dx = player.speed;
      player.image.src = './images/right.png'
    } 
    if (keys.w){
      dy = -player.speed;
      player.image.src = './images/up.png'
    } 
    if (keys.s){
      dy = player.speed;
      player.image.src = './images/down.png'
    } 
  }

  if (!rectHitsWall(player.x + dx, player.y)) player.x += dx;
  if (!rectHitsWall(player.x, player.y + dy)) player.y += dy;

  if (!changingGamestate) {
    const correctResult = getCalculationResult();

    if (collision(player, correctResult)) {
      if (mazeCount === mazes.length) {
        changingGamestate = true;
        gameStateColour = 'Lime'

        changeGameState('Konec Hry', () => {
          setTimeout(() => {
            mazeCount = 0;
            mazes[mazeCount];
            levelStart();
            changingGamestate = false;
          }, 3000)
        })

        return;
      }

      levelStart();
      return;
    }

    if (collisionOther()) {
      objectiveTracker = "Špatné číslo";
      gameStateColour = 'red';
    } else {
      objectiveTracker = gameState.text;
      gameStateColour = 'aqua';
    }
  }
}

function collisionOther() {
  const newResults = [];
  results.forEach((result) => {
    if(result.calculation !== gameState.text) {
      newResults.push(result);
    }
  })
  return newResults.some((newResult) => {
    return collision(player, newResult);
  })
}

function changeGameState(newGameState, action) {
  changingGamestate = true;
  objectiveTracker = newGameState;
  action();
}

function collision(a ,b) {
  return !(
    a.x + a.size < b.x ||
    a.x > b.x + b.size ||
    a.y + a.size < b.y ||
    a.y > b.y + b.size
  )
}

function placeResults(){
  results.forEach((result)=>{
    result.place();
  });
}

function setCalculation(){
  gameState.text = results[Math.floor(Math.random() * results.length)].calculation;
  objectiveTracker = gameState.text;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] === 1) {
        //ctx.fillStyle = "#333";
        ctx.drawImage(wall ,c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }
  }

  ctx.fillStyle = gameStateColour;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(gameState.x, gameState.y, gameState.width, gameState.height, gameState.height / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.font = `${gameState.height - gameState.height / 5}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    objectiveTracker,
    gameState.x + gameState.width / 2,
    gameState.y + gameState.height / 2
  );

  results.forEach((result)=>{
    //ctx.fillStyle = 'green';
    //ctx.fillRect(result.x, result.y, result.size, result.size);
    ctx.drawImage(resultBackground ,result.x, result.y, result.size, result.size);
    ctx.fillStyle = 'blue';
    ctx.font = "34px serif";
    ctx.fillText(eval(result.calculation), result.x + result.size / 2, result.y + result.size / 2 + 2);
  })


  ctx.fillStyle = "red";
  ctx.drawImage(player.image, player.x, player.y, player.size, player.size);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
};

levelStart();
loop();
