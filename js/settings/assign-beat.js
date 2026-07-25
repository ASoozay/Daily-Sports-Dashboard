/* All Functions for the Assign Beat Modal in Settings */

// Function: openAssignBeatModal
// Purpose: Opens the modal for assigning beats and populates dropdowns
// Returns: None
// Parameters: None
// #region openAssignBeatModal() //
async function openAssignBeatModal() {
    await loadSports("assign-beat-sport");
    await loadWriters("assign-beat-writer");

    const assignBeatModal = document.getElementById("assign-beat-modal");
    assignBeatModal.style.display = "flex";

    document.getElementById("confirm-assign-beat").onclick = async () => {
    const sportId = document.getElementById("assign-beat-sport").value;
    const writerId = document.getElementById("assign-beat-writer").value;

    if (!writerId) {
        alert("Please select a writer");
        return;
    }

    await assignBeat(sportId, writerId);

    assignBeatModal.style.display = "none";
    };
}
// #endregion //

async function assignBeat(sportId, writerId) {
    try {
        const response = await fetch("/.netlify/functions/assign-beat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ sportId, writerId })
        });

        const text = await response.text();

        console.log("NETLIFY RAW RESPONSE:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }

        if (data.success) {
            showToast("Beat successfully assigned!", "success");
        } else {
            showToast("Failed to assign beat", "error");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error assigning beat.");
    }      
}