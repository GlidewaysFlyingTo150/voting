window.addEventListener('message', (ev) => {
  console.log('Received postMessage:', ev.data);
});

// --- Configuration you will update ---
const APPS_SCRIPT_BASE = 'https://script.google.com/macros/s/AKfycbzlz1r5uKY9OMRoCLw1sNsGmRaUtPFiNetseujoh0qw1gPgxSCWguphaPITNxYmqmgN/exec'; 
// Replace YOUR_DEPLOY_ID later with your Apps Script web app URL
// ----------------------------------------------------------------

const loginBtn = document.getElementById('loginBtn');
const votingSection = document.getElementById('votingSection');
const statusEl = document.getElementById('status');
const voteForm = document.getElementById('voteForm');
const voteResult = document.getElementById('voteResult');

let currentUser = null;

// Handle login popup and postMessage from Apps Script
loginBtn.addEventListener('click', () => {
  const popup = window.open(`${APPS_SCRIPT_BASE}?action=login`, 'discordLogin', 'width=600,height=700');
  // receive user from popup
});

window.addEventListener('message', (ev) => {
  // IMPORTANT: check origin in production. Here we accept any for simplicity.
  const data = ev.data || {};
  if (data.source === 'glideways-discord-oauth' && data.user) {
    currentUser = data.user;
    onLoggedIn();
  }
});

function onLoggedIn(){
  statusEl.textContent = `Signed in as ${currentUser.username}#${currentUser.discriminator}`;
  loginBtn.hidden = true;
  votingSection.hidden = false;
}

// build payload for submit
voteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser) { alert('Please login first'); return; }
  const fd = new FormData(voteForm);
  const votes = {};
  for (const [k,v] of fd.entries()) votes[k] = v;

  voteResult.textContent = 'Submitting...';

  // open hidden popup to submit to Apps Script (avoids CORS)
  const payload = encodeURIComponent(JSON.stringify(votes));
  const url = `${APPS_SCRIPT_BASE}?action=submit&userId=${encodeURIComponent(currentUser.id)}&username=${encodeURIComponent(currentUser.username+'#'+currentUser.discriminator)}&votes=${payload}`;
  const popup = window.open(url, 'submitVote', 'width=600,height=400');
  // popup will postMessage back with result
});

window.addEventListener('message', (ev) => {
  const data = ev.data || {};
  if (data.source === 'glideways-submit-result') {
    if (data.success) {
      voteResult.textContent = 'Thanks — your votes were recorded.';
      voteForm.querySelectorAll('select').forEach(s => s.disabled = true);
    } else {
      voteResult.textContent = 'Error: ' + (data.message || 'unknown');
    }
  }
});
