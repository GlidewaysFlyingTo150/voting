const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec";

/* -------------------- JWT DECODE -------------------- */
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch (err) {
    console.error("JWT decode failed:", err);
    return null;
  }
}

/* -------------------- Animation Helpers -------------------- */
function animateCount(el, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(progress * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function createTrendRow(choice, count, maxCount) {
  const row = document.createElement("div");
  row.className = "trend-row";

  const left = document.createElement("div");
  left.className = "trend-left";
  left.textContent = choice;

  const right = document.createElement("div");
  right.className = "trend-right";

  const countEl = document.createElement("div");
  countEl.className = "trend-count";
  countEl.textContent = "0";

  const barWrap = document.createElement("div");
  barWrap.className = "trend-bar-wrap";

  const bar = document.createElement("div");
  bar.className = "trend-bar";

  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  bar.style.width = pct + "%";

  barWrap.appendChild(bar);
  right.appendChild(countEl);
  right.appendChild(barWrap);

  row.appendChild(left);
  row.appendChild(right);

  setTimeout(() => animateCount(countEl, count), 150);

  return row;
}

/* -------------------- Google Login -------------------- */
let currentUserEmail = null;

function onGoogleLogin(response) {
  const payload = decodeJwtPayload(response.credential);
  if (!payload) {
    alert("Login failed.");
    return;
  }

  currentUserEmail = payload.email;

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("voteBox").style.display = "block";
}

/* -------------------- INDEX PAGE (Voting) -------------------- */
function handleIndexPage() {
  const submitBtn = document.getElementById("submitVote");
  if (!submitBtn) return;

  const voteBox = document.getElementById("voteBox");
  const successMessage = document.getElementById("successMessage");

  submitBtn.addEventListener("click", async () => {
    if (!currentUserEmail) {
      alert("Please sign in first.");
      return;
    }
