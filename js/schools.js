let sports = [];
let conferences = [];
let schools = [];

/* Fetch */
async function fetchSchools() {
    try {
        const response = await fetch("/.netlify/functions/get-schools", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sports, conferences, schools })
        });

    } catch (error) {
        console.error('Error fetching schools:', error);
    }
}