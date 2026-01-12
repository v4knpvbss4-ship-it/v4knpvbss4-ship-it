const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const startButton = document.getElementById("start-button");

const gameState = {
  running: false,
  score: 0,
  best: 0,
  meteors: [],
  particles: [],
  spawnTimer: 0,
  speed: 2.5,
  boost: 0,
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  radius: 16,
  speed: 5,
};

const keys = new Set();

const loadBest = () => {
  const stored = window.localStorage.getItem("meteor-best");
  if (stored) {
    gameState.best = Number(stored) || 0;
  }
  bestEl.textContent = gameState.best.toString();
};

const saveBest = () => {
  window.localStorage.setItem("meteor-best", gameState.best.toString());
};

const resetGame = () => {
  gameState.score = 0;
  gameState.meteors = [];
  gameState.particles = [];
  gameState.spawnTimer = 0;
  gameState.speed = 2.5;
  gameState.boost = 0;
  player.x = canvas.width / 2;
  updateScore();
};

const startGame = () => {
  resetGame();
  overlay.classList.add("hidden");
  gameState.running = true;
};

const endGame = () => {
  gameState.running = false;
  overlayTitle.textContent = "Crash!";
  overlayMessage.textContent = "Hit a meteor. Tap start to try again.";
  overlay.classList.remove("hidden");
  if (gameState.score > gameState.best) {
    gameState.best = gameState.score;
    bestEl.textContent = gameState.best.toString();
    saveBest();
  }
};

const updateScore = () => {
  scoreEl.textContent = Math.floor(gameState.score).toString();
};

const spawnMeteor = () => {
  const radius = 12 + Math.random() * 18;
  const x = radius + Math.random() * (canvas.width - radius * 2);
  const speed = gameState.speed + Math.random() * 1.5;
  gameState.meteors.push({
    x,
    y: -radius,
    radius,
    speed,
  });
};

const spawnBurst = (x, y) => {
  for (let i = 0; i < 10; i += 1) {
    gameState.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30 + Math.random() * 15,
    });
  }
};

const updateParticles = () => {
  gameState.particles = gameState.particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
    return particle.life > 0;
  });
};

const updatePlayer = () => {
  const speedBonus = gameState.boost > 0 ? 2.5 : 1;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) {
    player.x -= player.speed * speedBonus;
  }
  if (keys.has("ArrowRight") || keys.has("KeyD")) {
    player.x += player.speed * speedBonus;
  }
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));

  if (gameState.boost > 0) {
    gameState.boost -= 1;
  }
};

const updateMeteors = () => {
  gameState.meteors.forEach((meteor) => {
    meteor.y += meteor.speed;
  });
  gameState.meteors = gameState.meteors.filter((meteor) => meteor.y < canvas.height + meteor.radius);
};

const checkCollisions = () => {
  return gameState.meteors.some((meteor) => {
    const dx = meteor.x - player.x;
    const dy = meteor.y - player.y;
    return Math.hypot(dx, dy) < meteor.radius + player.radius;
  });
};

const updateDifficulty = () => {
  gameState.speed = 2.5 + Math.min(4, gameState.score / 250);
};

const update = () => {
  if (!gameState.running) {
    return;
  }

  updatePlayer();
  updateMeteors();
  updateParticles();

  gameState.spawnTimer -= 1;
  if (gameState.spawnTimer <= 0) {
    spawnMeteor();
    gameState.spawnTimer = 28 - Math.min(16, Math.floor(gameState.score / 150));
  }

  gameState.score += 1;
  updateScore();
  updateDifficulty();

  if (checkCollisions()) {
    spawnBurst(player.x, player.y);
    endGame();
  }
};

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#020617");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 83) % canvas.width;
    const y = (i * 47) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }
};

const drawPlayer = () => {
  ctx.beginPath();
  ctx.fillStyle = "#38bdf8";
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.arc(player.x - 4, player.y - 4, player.radius * 0.4, 0, Math.PI * 2);
  ctx.stroke();
};

const drawMeteors = () => {
  gameState.meteors.forEach((meteor) => {
    ctx.beginPath();
    ctx.fillStyle = "#f97316";
    ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.arc(meteor.x - meteor.radius * 0.3, meteor.y - meteor.radius * 0.2, meteor.radius * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  });
};

const drawParticles = () => {
  gameState.particles.forEach((particle) => {
    ctx.fillStyle = `rgba(248, 250, 252, ${particle.life / 40})`;
    ctx.fillRect(particle.x, particle.y, 3, 3);
  });
};

const render = () => {
  drawBackground();
  drawParticles();
  drawMeteors();
  drawPlayer();
};

const loop = () => {
  update();
  render();
  window.requestAnimationFrame(loop);
};

const handleKeyDown = (event) => {
  keys.add(event.code);
  if (event.code === "Space" && gameState.running) {
    gameState.boost = 20;
  }
};

const handleKeyUp = (event) => {
  keys.delete(event.code);
};

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
startButton.addEventListener("click", startGame);

loadBest();
loop();
