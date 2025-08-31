/* Memory game clone — script.js
   - Supports multiple board sizes (pairs selection)
   - Tracks moves, timer, pairs found
   - Prevents flipping while checking
   - Simple emoji-based card faces (no external assets)
*/

const EMOJIS = [
  "🐶","🐱","🐵","🦊","🦁","🐼","🐨","🐯","🦄","🐸","🐷","🐮",
  "🐔","🐧","🐥","🦉","🐴","🦋","🐝","🐙","🐠","🦖","🌵","🍁",
  "🍓","🍍","🍉","🍇","🍪","🍩","⚽️","🎵","🎲","🚗","✈️","🔔"
];

const boardEl = document.getElementById("board");
const sizeSelect = document.getElementById("sizeSelect");
const newGameBtn = document.getElementById("newGameBtn");
const movesEl = document.getElementById("moves");
const timerEl = document.getElementById("timer");
const pairsFoundEl = document.getElementById("pairsFound");

const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const finalMoves = document.getElementById("finalMoves");
const finalTime = document.getElementById("finalTime");
const playAgainBtn = document.getElementById("playAgainBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

let pairs = parseInt(sizeSelect.value, 10); // number of pairs
let totalCards = pairs * 2;
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let foundPairs = 0;
let timerInterval = null;
let seconds = 0;
let started = false;

function formatTime(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function startTimer(){
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer(){
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer(){
  stopTimer();
  seconds = 0;
  timerEl.textContent = "00:00";
  started = false;
}

function shuffle(array) {
  // Fisher-Yates
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildDeck(pairCount){
  // Use EMOJIS array to generate unique faces for pairs
  const faces = EMOJIS.slice(0, pairCount);
  const deck = [];
  faces.forEach(face => {
    deck.push({ id: cryptoRandomId(), face });
    deck.push({ id: cryptoRandomId(), face });
  });
  return shuffle(deck);
}

function cryptoRandomId(){
  return Math.random().toString(36).slice(2,9);
}

function createCardElement(cardObj){
  const wrapper = document.createElement("div");
  wrapper.classList.add("card");
  wrapper.dataset.face = cardObj.face;
  wrapper.dataset.id = cardObj.id;
  wrapper.setAttribute("tabindex","0");
  wrapper.setAttribute("role","button");
  wrapper.setAttribute("aria-label","Memory card");
  wrapper.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-front">${cardObj.face}</div>
      <div class="card-face card-back">?</div>
    </div>
  `;
  wrapper.addEventListener("click", onCardClicked);
  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); wrapper.click(); }
  });
  return wrapper;
}

function onCardClicked(e){
  const card = e.currentTarget;
  if (lockBoard) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  if (!started) {
    started = true;
    startTimer();
  }

  flipCard(card);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves++;
  movesEl.textContent = moves;

  checkForMatch();
}

function flipCard(card){
  card.classList.add("flipped");
}

function unflipCards(a, b){
  lockBoard = true;
  setTimeout(() => {
    a.classList.remove("flipped");
    b.classList.remove("flipped");
    resetTurn();
  }, 700);
}

function checkForMatch(){
  const faceA = firstCard.dataset.face;
  const faceB = secondCard.dataset.face;
  if (faceA === faceB) {
    // matched
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    foundPairs++;
    pairsFoundEl.textContent = `${foundPairs} / ${pairs}`;
    resetTurn(true);
    if (foundPairs === pairs) {
      // finished
      onGameComplete();
    }
  } else {
    unflipCards(firstCard, secondCard);
  }
}

function resetTurn(matched = false){
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
  if (!matched) {
    // no-op
  }
}

function clearBoard(){
  boardEl.innerHTML = "";
  boardEl.className = "board";
}

function renderBoard(pairCount){
  clearBoard();
  pairs = pairCount;
  totalCards = pairs * 2;
  const deck = buildDeck(pairs);
  deck.forEach(cardObj => {
    const cardEl = createCardElement(cardObj);
    boardEl.appendChild(cardEl);
  });
  // update layout size class to help CSS grid
  boardEl.classList.add(`size-${pairs}`);
  // reset stats
  moves = 0; movesEl.textContent = "0";
  foundPairs = 0; pairsFoundEl.textContent = `0 / ${pairs}`;
  resetTimer();
  // small delay for visual readiness
  setTimeout(()=> {
    // Ensure ARIA live text updated if needed
  }, 0);
}

function onGameComplete(){
  stopTimer();
  // show modal with stats
  finalMoves.textContent = moves;
  finalTime.textContent = formatTime(seconds);
  modalText.textContent = `You found all ${pairs} pairs!`;
  modal.classList.remove("hidden");
}

function init(){
  // initial render
  renderBoard(parseInt(sizeSelect.value,10));

  // event listeners
  newGameBtn.addEventListener("click", ()=> {
    renderBoard(parseInt(sizeSelect.value,10));
  });

  sizeSelect.addEventListener("change", (e) => {
    renderBoard(parseInt(e.target.value,10));
  });

  playAgainBtn.addEventListener("click", ()=> {
    modal.classList.add("hidden");
    renderBoard(parseInt(sizeSelect.value,10));
  });

  closeModalBtn.addEventListener("click", ()=> {
    modal.classList.add("hidden");
  });

  // create keyboard shortcut: N for new game
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "n") {
      renderBoard(parseInt(sizeSelect.value,10));
    }
  });
}

init();