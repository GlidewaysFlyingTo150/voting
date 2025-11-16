const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec";

/* ---------------- JWT DECODE (no external libs) ---------------- */
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(payload)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(decoded);
  } catch (e) {
    console.error("JWT decode failed", e);
    return null;
  }
}

/* ---------------- Count Animation ---------------- */
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

/* ---------------- Trend Row Builder ---------------- */
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

  setTimeout(() => animateCount(countEl, count), 150);

  return row;
}

/* ---------------- GOOGLE LOGIN ---------------- */
let currentUserEmail = null;

function onGoogleLogin(response) {
  const payload = decodeJwtPayload(response.credential);
  if (!payload) {
    alert("Google login failed.");
    return;
  }

  currentUserEmail = payload.email;

  // Swap boxes
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("voteBox").style.display = "block";
}

/* ---------------- VOTE SUBMISSION (index.html) ---------------- */
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
      const cat = sec.querySelector("h3").textContent.trim();
      const choice = sec.querySelector("select").value;
      votes.push({ category: cat, choice });
    });

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
        successMessage.classList.remove("hidden");
        successMessage.classList.add("show");
        submitBtn.textContent = "Submitted ✓";

        setTimeout(() => {
          successMessage.classList.remove("show");
          successMessage.classList.add("hidden");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Votes";
        }, 2200);
      } else {
        throw new Error(json.message || "Unknown error");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit votes: " + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Votes";
    }
  });
}

/* ---------------- TOTALS PAGE (totals.html) ---------------- */
function handleTotalsPage() {
  const resultsContainer = document.getElementById("resultsContainer");
  if (!resultsContainer) return;

  const header = document.createElement("div");
  header.className = "results-header";
  header.innerHTML = `
      <label for="categoryFilter">Filter:</label>
      <select id="categoryFilter">
          <option value="__ALL__">All</option>
      </select>
  `;

  const list = document.createElement("div");
  list.id = "resultsList";

  resultsContainer.appendChild(header);
  resultsContainer.appendChild(list);

  const filter = header.querySelector("#categoryFilter");

  async function fetchTotals() {
    try {
      const res = await fetch(WEB_APP_URL);
      const totals = await res.json();

      renderTotals(totals);
      updateFilter(Object.keys(totals));
    } catch (e) {
      console.error(e);
      list.innerHTML = `<p>Failed to load results.</p>`;
    }
  }

  function updateFilter(cats) {
    cats.forEach(c => {
      if (![...filter.options].some(o => o.value === c)) {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        filter.appendChild(opt);
      }
    });
  }

  function renderTotals(totals) {
    list.innerHTML = "";

    const selected = filter.value;
    const catsToShow = selected === "__ALL__" ? Object.keys(totals) : [selected];

    let globalMax = 1;
    Object.values(totals).forEach(cat => {
      Object.values(cat).forEach(count => {
        if (count > globalMax) globalMax = count;
      });
    });

    catsToShow.forEach(cat => {
      const block = document.createElement("div");
      block.className = "results-category";

      block.innerHTML = `<h3>${cat}</h3>`;

      const entries = Object.entries(totals[cat] || {}).sort((a, b) => b[1] - a[1]);

      if (entries.length === 0) {
        block.innerHTML += `<p>No votes yet.</p>`;
      } else {
        entries.forEach(([choice, count]) => {
          block.appendChild(createTrendRow(choice, count, globalMax));
        });
      }

      list.appendChild(block);
    });
  }

  filter.addEventListener("change", fetchTotals);

  fetchTotals();
  setInterval(fetchTotals, 7000); // FIXED
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  handleIndexPage();
  handleTotalsPage();
});

window.onGoogleLogin = onGoogleLogin;
