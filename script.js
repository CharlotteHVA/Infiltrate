// Naam opslaan 
const game = { 
  name: "" 
};

// Timer en missie
let timeLeft = 120; // 2 minuten in seconden
let timerInterval;
let missionSuccess = false;
let hasPlayedVictorySound = false;

// Geluid laden en afspelen 
// MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio 'new Audio()', loop, volume
function createSound(src, loop = false, volume = 1) {
  const sound = new Audio(src);
  sound.loop = loop;
  sound.volume = volume;
  return sound;
}

// Geluiden aanmaken
const backgroundMusic = createSound("audio/background_game-loop.wav", true, 1);
const clickSound = document.getElementById("clickSound");
const gameOverSound = createSound("audio/gameover.wav", false, 0.3);
const gameVictorySound = createSound("audio/gameVictory.mp3", false, 0.3);

// Canvas instellen voor tekenen
// MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D 
// https://www.youtube.com/watch?v=yP5DKzriqXA gebruikt voor canvas, walls (collisions, etc.) en karakter
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 32;
const cols = 70;
const rows = collisions.length / cols;
canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

// Player met beweging + animatie (frames) in de afbeelding
const player = {
  x: 50,
  y: 50,
  w: 12,
  h: 48,
  speed: 5,
  direction: "down",
  frame: {
    max: 4,
    hold: 10
  },
  frameTimer: 0,
  frameInterval: 10
};

// Speler sprites per richting
const playerSprites = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image()
};

playerSprites.down.src = "images/playerDown.png";
playerSprites.up.src = "images/playerUp.png";
playerSprites.left.src = "images/playerLeft.png";
playerSprites.right.src = "images/playerRight.png";

let missionTriggered = false;
let walls = []; // muren van de map
const keys = {}; // keys bijhouden

// Achtergrondafbeelding map (gemaakt met Tiled om de arrays voor collision.js, mission.js en door.js)
const background = new Image();
background.src = "images/gamecanvas.png";

// Klikgeluid afspelen
function playClickSound() {
  clickSound.currentTime = 0;
  clickSound.play();
}

// Toon specifieke schermen (sections) en verberg anderen
function showScreen(id) {
  document.querySelectorAll("section").forEach(section => section.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// Timer terugzetten naar 2 minuten
function resetTimer() {
  clearInterval(timerInterval);
  timeLeft = 120;
  const timerText = document.getElementById("timer");
  timerText.textContent = "02:00";
  timerText.style.color = "white";
}

// Border aanpassen van pop-up (fout, goed en normaal)
function setPopupBorderColor(color) {
  document.querySelector(".popup-content").style.borderColor = color;
}

// Tijd weergeven in minuut:seconden formaat voor de timer
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
function formatTime(secondsLeft) {
  let min = Math.floor(secondsLeft / 60);
  let sec = secondsLeft % 60;

  if (min < 10) min = "0" + min;
  if (sec < 10) sec = "0" + sec;

  return min + ":" + sec;
}

// Startknop naar login scherm
document.getElementById("startGameBtn").addEventListener("click", () => {
  showScreen("loginScreen");
  playClickSound();
  backgroundMusic.play();
});

// Codenaam invoeren en tonen in missiebrief 
document.getElementById("submitCodenameBtn").addEventListener("click", () => {
  const input = document.getElementById("codenameInput").value.trim();
  if (input !== "") {
    game.name = input;
    document.getElementById("playerCodename").textContent = input;
    playerCodename.style.color = "#597cff";
    showScreen("missionBrief");
  }
  playClickSound();
});

// Missiebriefing naar canvas. Player locatie resetten en timer starten (dit is ook als de player wilt restarten zonder te refreshen)
document.getElementById("startMission").addEventListener("click", () => {
  showScreen("gameCanvas");
  player.x = 50;
  player.y = 50;
  player.direction = "down";
  player.frame = 0;
  hasPlayedVictorySound = false;
  missionTriggered = false;
  missionSuccess = false;
  setPopupBorderColor("");
  startTimer();
  playClickSound();
});

// Terug naar missiebrief en timer opnieuw
document.getElementById("retryBtn").addEventListener("click", () => {
  showScreen("missionBrief");
  resetTimer();
  playClickSound();
  backgroundMusic.play();
  hasPlayedVictorySound = false;
});

// Volgende level knop (werkt nog niet)
document.getElementById("nextLevelBtn").addEventListener("click", () => {
  alert("The next level is under development!");
  playClickSound();
});

// Keys bijhouden
document.addEventListener("keydown", e => {
  if (e.key) keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", e => {
  if (e.key) keys[e.key.toLowerCase()] = false;
});

// Timer starten en bijhouden
function startTimer() {
  const timerText = document.getElementById("timer");
  const timerDisplay = document.getElementById("timerDisplay");
  timerDisplay.classList.remove("hidden");

  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = formatTime(timeLeft);

    if (timeLeft <= 10) timerText.style.color = "red";

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      document.getElementById("timerDisplay").classList.add("hidden");
      canvas.classList.add("hidden");
      document.getElementById("missionPopup").classList.remove("show");
      document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
      showScreen("failureScreen");
      backgroundMusic.pause();
      gameOverSound.play();
    }
  }, 1000);
}

// Muren genereren uit collisions-array 
// Gebaseerd op YouTube-tutorials van Chris Courses met Tiled (dat data maakt op basis van de map (zie data))
// https://www.youtube.com/watch?v=5IMXpp3rohQ en https://www.youtube.com/watch?v=yP5DKzriqXA&t=5415s mapstructuur op basis van tile arrays
function generateWallsFromCollisions() {
  collisions.forEach((value, i) => {
    if (value === 1025) {
      const x = (i % cols) * tileSize;
      const y = Math.floor(i / cols) * tileSize;
      walls.push({ x, y, w: tileSize, h: tileSize });
    }
  });
}

// Botsing speler en muren checken
function isColliding(x, y, w, h) {
  return walls.some(c => x < c.x + c.w && x + w > c.x && y < c.y + c.h && y + h > c.y);
}

// Check of speler mission.js 1025 binnen komt
function checkMissionTrigger() {
  const tileX = Math.floor(player.x / tileSize);
  const tileY = Math.floor(player.y / tileSize);
  const index = tileY * cols + tileX;
  if (mission[index] === 1025 && !missionTriggered) {
    missionTriggered = true;
    document.getElementById("missionPopup").classList.add("show");
  }
}

// Check of speler bij deur is en wachtwoord heeft gekraakt (Einde)
function checkDoorTrigger() {
  if (!missionSuccess) return;

  const tileX = Math.floor(player.x / tileSize);
  const tileY = Math.floor(player.y / tileSize);
  const index = tileY * cols + tileX;

  if (door[index] === 1025 && !hasPlayedVictorySound) {
    hasPlayedVictorySound = true;
    clearInterval(timerInterval);
    document.getElementById("timerDisplay").classList.add("hidden");
    canvas.classList.add("hidden");

    // Eindscore tonen
    document.getElementById("finalTime").textContent = formatTime(timeLeft);
    document.getElementById("finalScore").textContent = timeLeft * 5;
    finalTime.style.color = "#597cff";
    finalScore.style.color = "#597cff";

    showScreen("victoryScreen");
    gameVictorySound.play();
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
}

// Spelerpositie op basis van keys en collisions
function update() {
  let newX = player.x;
  let newY = player.y;

  if (keys["w"] || keys["arrowup"]) {
    newY -= player.speed;
    player.direction = "up";
  }
  if (keys["s"] || keys["arrowdown"]) {
    newY += player.speed;
    player.direction = "down";
  }
  if (keys["a"] || keys["arrowleft"]) {
    newX -= player.speed;
    player.direction = "left";
  }
  if (keys["d"] || keys["arrowright"]) {
    newX += player.speed;
    player.direction = "right";
  }

  // Binnen canvas blijven
  if (newX < 0) newX = 0;
  if (newY < 0) newY = 0;
  if (newX + player.w > canvas.width) newX = canvas.width - player.w;
  if (newY + player.h > canvas.height) newY = canvas.height - player.h;

  // Geen botsing = player beweegt
  if (!isColliding(newX, newY, player.w, player.h)) {
    player.x = newX;
    player.y = newY;
  }

  checkMissionTrigger();
  checkDoorTrigger();
}

// Teken alles op canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const sprite = playerSprites[player.direction];
  ctx.drawImage(
    sprite,
    player.frame * player.w, 0,
    player.w, player.h,
    player.x, player.y,
    player.w * 5, player.h * 5
  );
}

// loop van het spel
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Popup controleren met wachtwoord
// MDN Web Docs https://developer.mozilla.org/en-US/docs/Web/API/Window/alert alert() om feedback te geven
function closePopup() {
  const answer = document.getElementById("answerInput").value.trim().toLowerCase();
  if (answer === "hello") {
    setPopupBorderColor("green");
    missionSuccess = true;
    document.getElementById("missionPopup").classList.remove("show");
    alert("Access granted! The door at the hallway is now open.");
  } else {
    setPopupBorderColor("red");
    timeLeft = Math.max(0, timeLeft - 30); // Straf
    document.getElementById("answerInput").value = "";
    alert("Incorrect password. 30 seconds lost!");
  }
}

// Start spel als achtergrond is geladen
background.onload = () => {
  generateWallsFromCollisions();
  loop();
};
