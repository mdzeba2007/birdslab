// =====================================================
// OPEN POSITIONS - GOOGLE SHEET
// =====================================================

const OPEN_POSITIONS_API =
    "https://script.google.com/macros/s/AKfycbxd4kRsGOI8yJfFitPI37P6dLaROZfW7pcZo80DzMM3LHKIQjg0xrXS0O63tMYR2GvMEQ/exec";


// =====================================================
// LOAD GOOGLE SHEET DATA
// =====================================================

async function loadOpenPositions() {
    try {
        const response = await fetch(
            OPEN_POSITIONS_API + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Failed to load Open Positions data.");
        }

        const data = await response.json();
        console.log("OPEN POSITIONS DATA:", data);

        const content = data.content || {};
        applyCardContent(content);

    } catch (error) {
        console.error("OPEN POSITIONS ERROR:", error);
    }
}


// =====================================================
// APPLY GOOGLE SHEET DATA TO CARD
// =====================================================

function applyCardContent(content) {

    setText("position-status", content.status);
    setText("position-card-title", content.card_title);
    setText("position-card-subtitle", content.card_subtitle || "Submit your profile for open position");

    setText("available-label", content.available_label);
    setText("available-value", content.available_value);

    setText("contact-label", content.contact_label);
    setText("contact-person", content.contact_person);

    setText("email-label", content.email_label);
    setText("email-address", content.email);

    const responsesBtn = document.getElementById("viewResponsesBtn");
    if (responsesBtn && content.responses_sheet_url) {
    responsesBtn.href = content.responses_sheet_url;
    }
    
    const email = String(content.email || "").trim();
    const emailAddress = document.getElementById("email-address");

    if (emailAddress) {
        emailAddress.href = "mailto:" + email;
    }

    setText("notice-text", content.notice_text);

    // Update submit button text & link if present in API data
    if (content.submit_button_text) {
        setText("submit-button-text", content.submit_button_text);
    }

    const submitBtn = document.getElementById("submitProfileBtn");
    if (submitBtn && content.form_url) {
        submitBtn.href = content.form_url;
    }
}


// =====================================================
// SET TEXT
// =====================================================

function setText(id, value) {
    const element = document.getElementById(id);

    if (!element || value === undefined || value === null) {
        return;
    }

    element.textContent = value;
}


// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    loadOpenPositions();
});