const SPREADSHEET_ID = "1S6Q0HVBUUqYoE37mF8w146zRNqMnef4FrZwPHKwtzCk";
const SHEET_NAME = "Votes";

/* ------------------------- CORS SETUP ------------------------- */
function setCors(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function doOptions(e) {
  return setCors(ContentService.createTextOutput("{}"));
}

/* ------------------------- HEADER SETUP ------------------------- */
function ensureHeader(sheet) {
  const header = ["Timestamp", "Email", "Category", "Choice"];
  const existing = sheet.getRange(1, 1, 1, header.length).getValues()[0];

  if (existing[0] !== "Timestamp") {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

/* ------------------------- DUPLICATE CHECK ------------------------- */
function hasVoted(sheet, email) {
  const emails = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  return emails.some(row => row[0] === email);
}

/* ------------------------- POST (SAVE VOTE) ------------------------- */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Empty POST body");
    }

    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    ensureHeader(sheet);

    // Prevent double voting
    if (hasVoted(sheet, data.email)) {
      return setCors(
        ContentService.createTextOutput(
          JSON.stringify({
            status: "duplicate",
            message: "This email has already voted"
          })
        )
      );
    }

    // Save all votes
    data.votes.forEach(vote => {
      sheet.appendRow([
        new Date(),
        data.email,
        vote.category,
        vote.choice
      ]);
    });

    return setCors(
      ContentService.createTextOutput(
        JSON.stringify({ status: "success" })
      )
    );

  } catch (err) {
    return setCors(
      ContentService.createTextOutput(
        JSON.stringify({
          status: "error",
          message: err.toString()
        })
      )
    );
  }
}

/* ------------------------- GET (TEST ENDPOINT) ------------------------- */
function doGet() {
  return setCors(
    ContentService.createTextOutput(
      JSON.stringify({ status: "ok" })
    )
  );
}
