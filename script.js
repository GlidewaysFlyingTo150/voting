// ------------------------
// GOOGLE LOGIN
// ------------------------

let userEmail = null;

function handleCredentialResponse(response) {
    const jwt = response.credential;
    
    // Decode credential
    const payload = JSON.parse(atob(jwt.split('.')[1]));
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
        { theme: "filled_blue", size: "large", width: 260 }
    );
};


// ------------------------
// SUBMIT VOTE
// ------------------------

document.getElementById("voteForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!userEmail) {
        alert("You must log in first!");
        return;
    }

    const choice = document.querySelector("input[name='vote']:checked");
    if (!choice) {
        alert("Please pick an option.");
        return;
    }

    const vote = choice.value;

    // Show spinner
    document.getElementById("loadingSpinner").style.display = "block";

    try {
        const res = await fetch(
            "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec",
            {
                method: "POST",
                body: JSON.stringify({
                    email: userEmail,
                    vote: vote
                })
            }
        );

        const text = await res.text();

        document.getElementById("loadingSpinner").style.display = "none";

        // Success animation
        document.getElementById("successMessage").classList.add("show");

        setTimeout(() => {
            document.getElementById("successMessage").classList.remove("show");
        }, 2500);

    } catch (err) {
        console.error(err);
        alert("Error submitting vote.");
        document.getElementById("loadingSpinner").style.display = "none";
    }
});
