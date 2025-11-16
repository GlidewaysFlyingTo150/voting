const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec";

/* -------------------------------
   Minimal JWT decode (no library)
-------------------------------- */
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
    console.error("JWT decode failed:", e);
    return null;
  }
}

/* -------------------------------
   Animated Count
-------------------------------- */
function animateCount(el, target, duration = 1000) {
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(target * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* -------------------------------
   Trend Row Builder
-------------------------------- */
function createTrendRow(choice, count, maxCount) {
  const row = document.createElement("div");
  row.className = "trend-row";

  row.innerHTML = `
    <div class="trend-left">${choice}</div>
    <div class="trend-right">
      <div class="trend-count">0</div>
      <div class="trend-bar-wrap">
        <div class="trend-bar" style="width:${(count / maxCount) * 100}%"></div>
      </div>
    </div>
  `;

  const countEl = row.querySelector(".trend-count");
  setTimeout(() => animateCount(countEl, count), 150);

  return row;
}

/* -------------------------------
   Google Login Callback
-------------------------------- */
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

/* -------------------------------
   INDEX PAGE – Submit Votes
-------------------------------- */
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
      const category = sec.querySelector("h3").textContent.trim();
      const choice = sec.querySelector("select").value;
      votes.push({ category, choice });
    });

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const res = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUserEmail,
          votes
        })
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
      alert("Failed to submit votes: " + err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Votes";
    }
  });
}

/* -------------------------------
   TOTALS PAGE (totals.html)
-------------------------------- */
function handleTotalsPage() {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  const filterSelect = document.createElement("select");
  filterSelect.id = "categoryFilter";
  filterSelect.innerHTML = `<option value="__ALL__">All Categories</option>`;

  const listWrap = document.createElement("div");
  listWrap.id = "resultsList";

  container.appendChild(filterSelect);
  container.appendChild(listWrap);

  async function loadTotals() {
    try {
      const res = await fetch(WEB_APP_URL);
      const totals = await res.json();

      renderTotals(totals);

      // populate filter
      filterSelect.innerHTML = `<option value="__ALL__">All Categories</option>`;
      Object.keys(totals).forEach(cat => {
        filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      });
    } catch (err) {
      console.error("Totals fetch error:", err);
      listWrap.innerHTML = `<p>Failed to load results.</p>`;
    }
  }

  function renderTotals(totals) {
    listWrap.innerHTML = "";

    const selected = filterSelect.value;
    const cats = selected === "__ALL__" ? Object.keys(totals) : [selected];

    cats.forEach(cat => {
      const block = document.createElement("div");
      block.className = "results-category";

      const title = document.createElement("h3");
      title.textContent = cat;
      block.appendChild(title);

      const entries = Object.entries(totals[cat] || {}).sort((a, b) => b[1] - a[1]);
      const max = entries.length ? entries[0][1] : 1;

      entries.forEach(([choice, count]) => {
        block.appendChild(createTrendRow(choice, count, max));
      });

      listWrap.appendChild(block);
    });
  }

  filterSelect.addEventListener("change", loadTotals);
  loadTotals();
  setInterval(loadTotals, 7000);
}

/* -------------------------------
   Init
-------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  handleIndexPage();
  handleTotalsPage();
});

window.onGoogleLogin = onGoogleLogin;
