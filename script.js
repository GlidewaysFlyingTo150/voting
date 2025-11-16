// ===== GLOBAL =====
let userEmail = null;

// ===== GOOGLE LOGIN =====
function handleCredentialResponse(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    userEmail = payload.email;

    const loginBox = document.getElementById("loginBox");
    const voteBox = document.getElementById("voteBox");
    const welcomeText = document.getElementById("welcomeText");

    if (loginBox) loginBox.style.display = "none";
    if (voteBox) voteBox.style.display = "block";
    if (welcomeText) welcomeText.innerText = `Welcome, ${userEmail}`;
  } catch (err) {
    console.error("Error handling credential:", err);
  }
}

// Initialize Google One Tap safely
window.onload = function () {
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: "232951174632-hkb769otpi9k5re4avti8mv3vamsg7hk.apps.googleusercontent.com",
      callback: handleCredentialResponse,
      auto_select: false
    });

    const googleButton = document.getElementById("googleButton");
    if (googleButton) {
      google.accounts.id.renderButton(
        googleButton,
        { theme: "outline", size: "large", width: 260 }
      );
    }
  } else {
    console.error("Google Identity Services not loaded.");
  }

  setupVoteSubmit();
};

// ===== VOTE SUBMISSION =====
function setupVoteSubmit() {
  const submitBtn = document.getElementById("submitVote");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", async function () {
    if (!userEmail) {
      alert("You must log in first!");
      return;
    }

    const categories = [
      { id: "cat-cafe", name: "Cafe / Restaurant" },
      { id: "cat-aviation", name: "Aviation" },
      { id: "cat-active", name: "Most Active" },
      { id: "cat-enthusiastic", name: "Most Enthusiastic" },
      { id: "cat-known", name: "Most Known" },
      { id: "cat-favorite", name: "People's Favorite" },
      { id: "cat-overall", name: "Overall" }
    ];

    const votes = [];
    const missing = [];

    categories.forEach(cat => {
      const el = document.getElementById(cat.id);
      if (el && el.value) {
        votes.push({ category: cat.name, choice: el.value });
      } else {
        missing.push(cat.name);
      }
    });

    if (missing.length > 0) {
      alert("Please pick an option for: " + missing.join(", "));
      console.error("Missing categories:", missing);
      return;
    }

    const spinner = document.getElementById("loadingSpinner");
    if (spinner) spinner.style.display = "block";

    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, votes })
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (spinner) spinner.style.display = "none";

      if (data.status === "success") {
        const successMsg = document.getElementById("successMessage");
        if (successMsg) {
          successMsg.classList.add("show");
          setTimeout(() => successMsg.classList.remove("show"), 2500);
        }
      } else {
        console.error("VOTE SUBMIT ERROR:", data);
        alert("Vote submission failed: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      alert("Vote submission failed. Check console for details.");
      if (spinner) spinner.style.display = "none";
    }
  });
}
