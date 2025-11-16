// ------------------------
// GOOGLE LOGIN
// ------------------------

let userEmail = null;

function handleCredentialResponse(response) {
    const jwt = response.credential;
    const payload = JSON.parse(atob(jwt.split('.')[1]));

    userEmail = payload.email;

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("voteBox").style.display = "block";

    console.log("Logged in as:", userEmail);
}

window.onload = function () {

    google.accounts.id.initialize({
        client_id: "232951174632-hkb769otpi9k5re4avti8mv3vamsg7hk.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleButton"),
        {
            theme: "outline",      // WHITE BUTTON
            size: "large",
            width: 260,
            shape: "rectangular"
        }
    );
};


// ------------------------
// SUBMIT VOTES
// ------------------------

document.getElementById("submitVote").addEventListener("click", async function () {

    if (!userEmail) {
        alert("You must log in first!");
        return;
    }

    // Get all category values
    const voteData = {
        email: userEmail,
        cafe: document.getElementById("category-cafe").value,
        aviation: document.getElementById("category-aviation").value,
        mostActive: document.getElementById("category-mostActive").value,
        mostEnthusiastic: document.getElementById("category-mostEnthusiastic").value,
        mostKnown: document.getElementById("category-mostKnown").value,
        peoplesFavorite: document.getElementById("category-peoplesFavs").value,
        overall: document.getElementById("category-overall").value
    };

    // Spinner
    document.getElementById("loadingSpinner").style.display = "block";

    try {
        const res = await fetch(
            "https://script.google.com/macros/s/AKfycbwJklZ2sMbKJ6gCnmIvF7FJECSryGNX4xBHE10U42jq-pHTO9rj1GOvJG5cMf2BcP9k/exec",
            {
                method: "POST",
                body: JSON.stringify(voteData)
            }
        );

        document.getElementById("loadingSpinner").style.display = "none";

        // Success animation
        const msg = document.getElementById("successMessage");
        msg.classList.add("show");

        setTimeout(() => msg.classList.remove("show"), 2500);

    } catch (err) {
        console.error(err);
        alert("Error submitting votes.");
        document.getElementById("loadingSpinner").style.display = "none";
    }
});
