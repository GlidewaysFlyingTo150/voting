// ===========================
// CONFIG
// ===========================
const GOOGLE_CLIENT_ID = "232951174632-hkb769otpi9k5re4avti8mv3vamsg7hk.apps.googleusercontent.com";
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec"; // your Google Apps Script web app


// ===========================
// STATE
// ===========================
let userEmail = null;


// ===========================
// GOOGLE LOGIN
// ===========================
function initGoogle() {
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("google-login"),
        {
            theme: "outline",
            size: "large",
            width: 260
        }
    );
}


async function handleCredentialResponse(response) {
    showLoading(true);

    try {
        const res = await fetch(`${BACKEND_URL}?action=verifyToken`, {
            method: "POST",
            body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!data.success) {
            alert("Login failed");
            showLoading(false);
            return;
        }

        userEmail = data.email;

        document.getElementById("login-box").style.display = "none";
        document.getElementById("vote-box").style.display = "flex";

    } catch (err) {
        console.error(err);
        alert("Login error");
    }

    showLoading(false);
}


// ===========================
// VOTING
// ===========================
async function submitVote() {
    const choice = document.querySelector("input[name='vote']:checked");
    if (!choice) {
        alert("Please select an option.");
        return;
    }

    showLoading(true);

    try {
        const res = await fetch(`${BACKEND_URL}?action=submitVote`, {
            method: "POST",
            body: JSON.stringify({
                email: userEmail,
                vote: choice.value
            })
        });

        const data = await res.json();

        if (data.success) {
            showSuccess("Your vote has been submitted!");
            document.getElementById("vote-form").reset();
        } else {
            alert("Error saving vote.");
        }

    } catch (err) {
        console.error(err);
        alert("Error submitting vote.");
    }

    showLoading(false);
}


// ===========================
// UI Helpers
// ===========================
function showLoading(show) {
    document.getElementById("loading").style.display = show ? "flex" : "none";
}

function showSuccess(msg) {
    const box = document.getElementById("success-message");
    box.innerText = msg;
    box.classList.add("show");

    setTimeout(() => {
        box.classList.remove("show");
    }, 2500);
}


// ===========================
// Start Google Login After Load
// ===========================
window.onload = initGoogle;
