// --------------------------------------
// GOOGLE LOGIN
// --------------------------------------

let userEmail = null;

function handleCredentialResponse(response) {
    const jwt = response.credential;
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    userEmail = payload.email;

    // Hide login, show voting UI
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("voteBox").style.display = "block";
}

// Google Button Init
window.onload = function () {
    google.accounts.id.initialize({
        client_id: "232951174632-hkb769otpi9k5re4avti8mv3vamsg7hk.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleButton"),
        {
            theme: "outline",  // <-- WHITE BUTTON
            size: "large",
            width: 260
        }
    );
};


// --------------------------------------
// VOTING SUBMIT HANDLER
// --------------------------------------

document.getElementById("submitVote").addEventListener("click", async () => {

    if (!userEmail) {
        alert("You must log in first.");
        return;
    }

    // Collect values
    const votes = {
        email: userEmail,
        cafe: document.getElementById("cat-cafe").value,
        aviation: document.getElementById("cat-aviation").value,
        active: document.getElementById("cat-active").value,
        enthusiastic: document.getElementById("cat-enthusiastic").value,
        known: document.getElementById("cat-known").value,
        favorite: document.getElementById("cat-favorite").value,
        overall: document.getElementById("cat-overall").value
    };

    // Validate ALL categories
    for (const field in votes) {
        if (votes[field] === "" && field !== "email") {
            alert("Please choose an option for every category.");
            return;
        }
    }

    // Show success after sending
    try {
        await fetch(
            "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec",
            {
                method: "POST",
                body: JSON.stringify(votes)
            }
        );

        const msg = document.getElementById("successMessage");
        msg.classList.add("show");

        setTimeout(() => msg.classList.remove("show"), 2500);

    } catch (err) {
        console.error(err);
        alert("Error submitting vote.");
    }
});
