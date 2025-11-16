console.log("Script loaded.");

// ==========================
// GOOGLE LOGIN
// ==========================

let userEmail = null;

// This MUST match the callback name in your HTML (data-callback)
function onGoogleLogin(response) {
    try {
        console.log("Google response:", response);

        const jwt = response.credential;
        const payload = JSON.parse(atob(jwt.split(".")[1]));

        userEmail = payload.email;
        console.log("Logged in as:", userEmail);

        // Switch UI
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("voteBox").style.display = "block";

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        alert("Google login failed. Check console.");
    }
}

window.onload = function () {
    try {
        google.accounts.id.initialize({
            client_id: "232951174632-hkb769otpi9k5re4avti8mv3vamsg7hk.apps.googleusercontent.com",
            callback: onGoogleLogin
        });

        google.accounts.id.renderButton(
            document.getElementById("googleButton"),
            {
                theme: "outline",     // white button
                size: "large",
                width: 260
            }
        );

        console.log("Google button initialized.");
    } catch (err) {
        console.error("GOOGLE INIT ERROR:", err);
    }
};


// ==========================
// SUBMIT VOTE
// ==========================

document.getElementById("submitVote").addEventListener("click", async () => {
    console.log("Submit clicked.");

    if (!userEmail) {
        alert("You must sign in first.");
        console.error("Submit blocked: no email.");
        return;
    }

    // Collect categories
    const votes = [
        { category: "Cafe / Restaurant", choice: document.getElementById("cat-cafe").value },
        { category: "Aviation",          choice: document.getElementById("cat-aviation").value },
        { category: "Most Active",       choice: document.getElementById("cat-active").value },
        { category: "Most Enthusiastic", choice: document.getElementById("cat-enthusiastic").value },
        { category: "Most Known",        choice: document.getElementById("cat-known").value },
        { category: "People's Favorite", choice: document.getElementById("cat-favorite").value },
        { category: "Overall",           choice: document.getElementById("cat-overall").value }
    ];

    console.log("Votes object:", votes);

    // Check empty fields
    const missing = votes.filter(v => v.choice === "");
    if (missing.length > 0) {
        alert("Please select an option for every category.");
        console.warn("Missing categories:", missing);
        return;
    }

    // Show spinner
    document.getElementById("successMessage").innerText = "Submitting...";
    document.getElementById("successMessage").classList.add("show");

    try {
        console.log("Sending POST to GAS…");

        const response = await fetch(
            "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec",
            {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: userEmail,
                    votes: votes
                })
            }
        ).catch(err => {
            console.error("FETCH ERROR:", err);
            throw new Error("Browser blocked: CORS or network error.");
        });

        console.log("RAW response:", response);

        const text = await response.text();
        console.log("Server returned:", text);

        let json;
        try {
            json = JSON.parse(text);
        } catch (parseErr) {
            console.error("JSON PARSE ERROR:", parseErr);
            throw new Error("Server returned non-JSON. Check Apps Script logs.");
        }

        if (json.status !== "success") {
            throw new Error("Server error: " + JSON.stringify(json));
        }

        // Success animation
        document.getElementById("successMessage").innerText = "Votes Submitted ✔️";

        setTimeout(() => {
            document.getElementById("successMessage").classList.remove("show");
        }, 2000);

    } catch (err) {
        console.error("VOTE SUBMIT ERROR:", err);

        document.getElementById("successMessage").innerText =
            "❌ Failed: " + err.message;

        setTimeout(() => {
            document.getElementById("successMessage").classList.remove("show");
        }, 3000);

        alert("Submission failed.\n\nCheck the console for details.");
    }
});
