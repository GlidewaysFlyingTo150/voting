const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec";


// ---------------- JWT DECODE ----------------
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    console.error("JWT decode failed", e);
    return null;
  }
}


// ---------------- ANIMATED COUNTER ----------------
function animateCount(el, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + (target - start) * progress);
    el.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


// ---------------- TREND ROW ----------------
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

  const widthPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  bar.style.width = `${widthPct}%`;

  barWrap.appendChild(bar);
  right.appendChild(countEl);
  right.appendChild(barWrap);

  row.appendChild(left);
  row.appendChild(right);

  // animate count
  setTimeout(() => animateCount(countEl, count, 900), 100);

  return row;
}


// ---------------- LOGIN ----------------
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


// ---------------- INDEX PAGE ----------------
function handleIndexPage() {
  const voteBox = document.getElementById("voteBox");
  if (!voteBox) return;

  const submitBtn = document.getElementById("submitVote");
  const successMessage = document.getElementById("successMessage");

  submitBtn.addEventListener("click", async () => {
    if (!currentUserEmail) {
      alert("Please sign in first.");
      return;
    }

    const sections = voteBox.querySelectorAll(".category-section");
    const votes = [];

    sections.forEach(sec => {
      const category = sec.querySelector("h3")?.textContent.trim();
      const choice = sec.querySelector("select")?.value;
      if (category && choice) votes.push({ category, choice });
    });

    if (votes.length === 0) {
      alert("No votes selected.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const res = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail, votes })
      });

      const json = await res.json();

      if (json.status === "success") {
        successMessage.classList.add("show");
        successMessage.classList.remove("hidden");
        submitBtn.textContent = "Submitted ✓";

        setTimeout(() => {
          successMessage.classList.remove("show");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Votes";
        }, 2000);
      } else {
        throw new Error(json.message);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit votes: " + err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Votes";
    }
  });
}


// ---------------- TOTALS PAGE ----------------
function handleTotalsPage() {
  const resultsContainer = document.getElementById("resultsContainer");
  if (!resultsContainer) return;

  const headerRow = document.createElement("div");
  headerRow.className = "results-header";

  const filterLabel = document.createElement("label");
  filterLabel.textContent = "Filter by category:";

  const filterSelect = document.createElement("select");
  filterSelect.id = "categoryFilter";
  filterSelect.innerHTML = `<option value="__ALL__">All Categories</option>`;

  headerRow.appendChild(filterLabel);
  headerRow.appendChild(filterSelect);
  resultsContainer.appendChild(headerRow);

  const listWrap = document.createElement("div");
  listWrap.id = "resultsList";
  resultsContainer.appendChild(listWrap);

  async function fetchTotals() {
    try {
      const res = await fetch(WEB_APP_URL);
      const totals = await res.json();
      renderTotals(totals);
      updateFilter(Object.keys(totals));
    } catch (err) {
      listWrap.innerHTML = `<p class="muted">Failed to load results.</p>`;
    }
  }

  function updateFilter(cats) {
    cats.forEach(cat => {
      if (!Array.from(filterSelect.options).some(o => o.value === cat)) {
        const opt = document.createElement("option");
