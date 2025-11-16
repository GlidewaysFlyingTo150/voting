
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec";

// --- Minimal JWT decode for Google credential (no external lib) ---
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(payload).split("").map(function(c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
    return JSON.parse(json);
  } catch (e) {
    console.error("JWT decode failed", e);
    return null;
  }
}

// --- Helper: animate from 0 to target number in element ---
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

// --- Helper: create a trend row DOM node ---
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
  // width will be animated based on proportion
  const widthPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  bar.style.width = `${widthPct}%`;

  barWrap.appendChild(bar);
  right.appendChild(countEl);
  right.appendChild(barWrap);

  row.appendChild(left);
  row.appendChild(right);

  // animate the number
  setTimeout(() => animateCount(countEl, count, 900), 100);

  return row;
}

// --- Google callback (called by Google's library) ---
let currentUserEmail = null;
function onGoogleLogin(response) {
  const payload = decodeJwtPayload(response.credential);
  if (!payload) {
    alert("Login failed (couldn't decode token).");
    return;
  }
  currentUserEmail = payload.email || payload["email"];
  // show vote UI if present
  const loginBox = document.getElementById("loginBox");
  const voteBox = document.getElementById("voteBox");
  if (loginBox) loginBox.style.display = "none";
  if (voteBox) voteBox.style.display = "block";
}

// --- INDEX PAGE: collect all category sections -> votes, POST to Apps Script ---
async function handleIndexPage() {
  const voteBox = document.getElementById("voteBox");
  if (!voteBox) return; // not index page

  // Submit button
  const submitBtn = document.getElementById("submitVote");
  const successMessage = document.getElementById("successMessage");

  submitBtn.addEventListener("click", async () => {
    if (!currentUserEmail) {
      alert("Please sign in to vote first.");
      return;
    }

    // Gather votes: find all .category-section inside voteBox
    const sections = voteBox.querySelectorAll(".category-section");
    const votes = [];
    sections.forEach(sec => {
      const h3 = sec.querySelector("h3");
      const select = sec.querySelector("select");
      if (!h3 || !select) return;
      const category = h3.textContent.trim();
      const choice = select.value;
      votes.push({ category, choice });
    });

    if (votes.length === 0) {
      alert("No votes found (no dropdowns).");
      return;
    }

    // POST to Apps Script
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
      const res = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail, votes })
      });
      const json = await res.json();
      if (json && json.status === "success") {
        successMessage.classList.add("show");
        successMessage.classList.remove("hidden");
        // small celebration animation
        submitBtn.textContent = "Submitted ✓";
        setTimeout(() => {
          successMessage.classList.remove("show");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Votes";
        }, 2200);
      } else {
        throw new Error(json && json.message ? json.message : "Unknown error");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit votes: " + err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Votes";
    }
  });
}

// --- TOTALS PAGE: fetch totals, render trend rows, animated counters, category filter ---
async function handleTotalsPage() {
  // presence of #resultsContainer determines totals page
  const resultsContainer = document.getElementById("resultsContainer");
  if (!resultsContainer) return;

  // Build UI: top filter select + totals list
  const headerRow = document.createElement("div");
  headerRow.className = "results-header";
  const filterLabel = document.createElement("label");
  filterLabel.textContent = "Filter by category:";
  filterLabel.htmlFor = "categoryFilter";

  const filterSelect = document.createElement("select");
  filterSelect.id = "categoryFilter";
  filterSelect.innerHTML = `<option value="__ALL__">All categories</option>`;

  headerRow.appendChild(filterLabel);
  headerRow.appendChild(filterSelect);
  resultsContainer.appendChild(headerRow);

  const listWrap = document.createElement("div");
  listWrap.id = "resultsList";
  resultsContainer.appendChild(listWrap);

  async function fetchTotals() {
    try {
      const res = await fetch(WEB_APP_URL);
      const totals = await res.json(); // { category: { choice: count } }
      renderTotals(totals);
      populateFilter(Object.keys(totals));
    } catch (err) {
      console.error("Failed to fetch totals:", err);
      listWrap.innerHTML = `<p class="muted">Failed to load results.</p>`;
    }
  }

  function populateFilter(categories) {
    // add categories if not present
    categories.forEach(cat => {
      if (!Array.from(filterSelect.options).some(o => o.value === cat)) {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        filterSelect.appendChild(opt);
      }
    });
  }

  function renderTotals(totals) {
    listWrap.innerHTML = "";
    // compute global max for bars
    let globalMax = 0;
    for (const cat of Object.keys(totals)) {
      const choices = totals[cat];
      for (const count of Object.values(choices)) {
        if (count > globalMax) globalMax = count;
      }
    }

    const selected = filterSelect.value || "__ALL__";
    const catsToShow = selected === "__ALL__" ? Object.keys(totals) : [selected];

    catsToShow.forEach(cat => {
      const catBlock = document.createElement("div");
      catBlock.className = "results-category";

      const title = document.createElement("h3");
      title.textContent = cat;
      catBlock.appendChild(title);

      const choices = totals[cat] || {};
      // create an array sorted by count desc
      const entries = Object.entries(choices).sort((a,b)=> b[1]-a[1]);

      // if no choices, show empty
      if (entries.length === 0) {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "No votes yet.";
        catBlock.appendChild(p);
      } else {
        // trend rows
        const maxCount = entries[0][1] || globalMax || 1;
        entries.forEach(([choice, count]) => {
          const row = createTrendRow(choice, count, Math.max(maxCount, globalMax));
          catBlock.appendChild(row);
        });
      }

      listWrap.appendChild(catBlock);
    });
  }

  // filter change
  filterSelect.addEventListener("change", () => {
    fetchTotals();
  });

  // initial fetch and periodic refresh
  await fetchTotals();
  setInterval(fetchTotals, 7000);
}

// --- Initialization: decide which page we are on ---
document.addEventListener("DOMContentLoaded", () => {
  handleIndexPage();
  handleTotalsPage();
});

// Expose onGoogleLogin globally for Google's callback
window.onGoogleLogin = onGoogleLogin;
