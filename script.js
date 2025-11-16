let userEmail = null;

// Handle Google login
function handleCredentialResponse(response) {
  const payload = JSON.parse(atob(response.credential.split(".")[1]));
  userEmail = payload.email;

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("voteBox").style.display = "block";
  document.getElementById("welcomeText").innerText = `Welcome, ${userEmail}`;
}

// Initialize Google One Tap
window.onload = function () {
  google.accounts.id.initialize({
    client_id: "232951174632-hkb769otpi9k5re4avti8mv3vamsg7hk.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    auto_select: false
  });

  google.accounts.id.renderButton(
    document.getElementById("googleButton"),
    { theme: "outline", size: "large", width: 260 }
  );
};

// Voting submit
document.getElementById("submitVote").addEventListener("click", async function () {
  if (!userEmail) {
    alert("You must log in first!");
    return;
  }

  // Collect votes
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
    console.error("Missing categories: ", missing);
    return;
  }

  document.getElementById("loadingSpinner").style.display = "block";

  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec",
      {
        method: "POST",
        body: JSON.stringify({ email: userEmail, votes }),
        headers: { "Content-Type": "application/json" }
      }
    );

    const data = await res.json();
    document.getElementById("loadingSpinner").style.display = "none";

    if (data.status === "success") {
      document.getElementById("successMessage").classList.add("show");
      setTimeout(() => document.getElementById("successMessage").classList.remove("show"), 2500);
    } else {
      console.error("VOTE SUBMIT ERROR:", data);
      alert("Vote submission failed: " + JSON.stringify(data));
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);
    alert("Vote submission failed. Check console for details.");
    document.getElementById("loadingSpinner").style.display = "none";
  }
});
