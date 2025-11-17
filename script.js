// ===== GLOBAL =====
let userEmail = null;
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec"; // not strictly needed in JS, kept for clarity

// ===== GOOGLE LOGIN =====
function handleCredentialResponse(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    userEmail = payload.email;

    const loginBox = document.getElementById("loginBox");
    const voteBox = document.getElementById("voteBox");
    const welcomeText = document.getElementById("welcomeText");
    const hiddenEmail = document.getElementById("hiddenEmail");

    if (loginBox) loginBox.style.display = "none";
    if (voteBox) voteBox.style.display = "block";
    if (welcomeText) welcomeText.innerText = `Welcome — ${userEmail}`;
    if (hiddenEmail) hiddenEmail.value = userEmail;

    console.log("Logged in as:", userEmail);
  } catch (err) {
    console.error("Error handling credential:", err);
  }
}

// Initialize Google button safely on window.onload
window.onload = function () {
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: "232951174632-hkb769otpi9k5re4avti8mv3vamsg7hk.apps.googleusercontent.com",
      callback: handleCredentialResponse,
      auto_select: false
    });

    const googleButton = document.getElementById("googleButton");
    if (googleButton) {
      google.accounts.id.renderButton(googleButton, { theme: "filled_white", size: "large", width: 260 });
    }
  } else {
    console.warn("Google API not loaded yet.");
  }

  setupFormListener();
};

// ===== FORM / IFRAME HANDLING =====
function setupFormListener() {
  const form = document.getElementById("voteForm");
  const submitBtn = document.getElementById("submitVote");
  const spinner = document.getElementById("loadingSpinner");
  const successMsg = document.getElementById("successMessage");
  const hiddenFrame = document.getElementById("hiddenFrame");

  if (!form || !submitBtn || !hiddenFrame) {
    console.error("Form elements missing.");
    return;
  }

  // before submit: validate client-side and ensure hidden email set
  form.addEventListener("submit", function (ev) {
    if (!userEmail) {
      alert("You must sign in with Google first.");
      ev.preventDefault();
      return false;
    }

    // Validate selects (required attribute already present, but we add friendly message)
    const selects = form.querySelectorAll("select");
    const missing = [];
    selects.forEach(s => {
      if (!s.value) missing.push(s.closest(".category-section")?.querySelector("h3")?.innerText || s.name);
    });

    if (missing.length > 0) {
      alert("Please pick an option for: " + missing.join(", "));
      ev.preventDefault();
      return false;
    }

    // show spinner
    spinner.classList.remove("hidden");
    successMsg.classList.add("hidden");

    // Ensure the hiddenEmail input is current
    const hiddenEmail = document.getElementById("hiddenEmail");
    if (hiddenEmail) hiddenEmail.value = userEmail;

    // let the form submit to the hidden iframe
    // after iframe loads it will trigger onload below
  });

  // Listen for iframe load (server response)
  hiddenFrame.onload = function () {
    try {
      // Try to read the iframe content (Apps Script returns JSON) — some browsers restrict cross-origin frames,
      // so this may fail; we rely mainly on success / duplicate responses if accessible.
      let doc;
      try {
        doc = hiddenFrame.contentDocument || hiddenFrame.contentWindow.document;
      } catch (e) {
        // cross-origin — cannot read body, but server still processed — show generic success
        console.warn("Could not access iframe content (cross-origin). Showing generic success.");
        spinner.classList.add("hidden");
        successMsg.classList.remove("hidden");
        // optionally disable submit to prevent re-vote UI wise; actual duplicate prevention is done server-side
        submitBtn.disabled = true;
        return;
      }

      const bodyText = (doc && doc.body && doc.body.innerText) ? doc.body.innerText : "";
      spinner.classList.add("hidden");

      if (!bodyText) {
        successMsg.classList.remove("hidden");
        submitBtn.disabled = true;
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(bodyText);
      } catch (e) {
        // If Apps Script returned HTML, try to extract JSON substring
        const jsonMatch = bodyText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { status: "unknown", raw: bodyText };
      }

      if (parsed.status === "success") {
        successMsg.classList.remove("hidden");
        submitBtn.disabled = true;
      } else if (parsed.status === "duplicate") {
        alert("Our records show this email has already voted. Duplicate votes are not allowed.");
        submitBtn.disabled = true;
      } else {
        alert("Vote failed: " + (parsed.message || JSON.stringify(parsed)));
      }

    } catch (err) {
      console.error("Iframe response handling error:", err);
      spinner.classList.add("hidden");
    }
  };
}
