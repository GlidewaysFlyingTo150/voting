let userEmail = null;
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec";

// Google Login callback
function onGoogleLogin(response) {
  const data = jwt_decode(response.credential);
  userEmail = data.email;

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("voteBox").style.display = "block";
}

// Submit vote
const submitBtn = document.getElementById("submitVote");
submitBtn.addEventListener("click", async () => {

  if(!userEmail){
    alert("Please login first!");
    return;
  }

  const payload = {
    email: userEmail,
    category: document.getElementById("category").value,
    choice: document.getElementById("choice").value
  };

  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const result = await res.json();

  if (result.status === "success") {
    const msg = document.getElementById("successMessage");
    msg.classList.add("show");
    msg.classList.remove("hidden");

    setTimeout(() => {
      msg.classList.remove("show");
    }, 2500);
  } else {
    alert("Error submitting vote: " + (result.message || "unknown error"));
  }
});
