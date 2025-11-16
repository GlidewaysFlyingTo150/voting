let userEmail = null;
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec";

// Google Login callback
function onGoogleLogin(response) {
  const data = jwt_decode(response.credential);
  userEmail = data.email;

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("voteBox").style.display = "block";
}

// Submit votes
const submitBtn = document.getElementById("submitVote");
submitBtn.addEventListener("click", async () => {

  if (!userEmail) {
    alert("Please login first!");
    return;
  }

  // List of categories matching safe HTML IDs (no spaces/apostrophes)
  const categories = [
    "Cafe/Restaurant",
    "Overall",
    "Aviation",
    "MostActive",
    "MostEnthusiastic",
    "MostKnown",
    "PeoplesFavorite"
  ];

  // Build votes array
  const votes = categories.map(cat => {
    const select = document.getElementById(`category-${cat}`);
    if (!select) {
      console.error(`Dropdown for category "${cat}" not found`);
      return null;
    }
    return { category: cat, choice: select.value };
  }).filter(v => v !== null);

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ email: userEmail, votes })
    });

    const result = await res.json();

    if (result.status === "success") {
      const msg = document.getElementById("successMessage");
      msg.classList.add("show");
      msg.classList.remove("hidden");

      setTimeout(() => msg.classList.remove("show"), 2500);
    } else {
      alert("Error submitting votes: " + (result.message || "unknown error"));
    }

  } catch(err) {
    alert("Error sending votes: " + err);
  }

});
