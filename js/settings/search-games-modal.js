// All Functions for Searching games  in Settings


// Function: openSportsModal
// Purpose: Opens the modal for sport info
// Returns: None
// Parameters: None
// #region openSearchGamesModal() //
async function openSearchGamesModal() {
    state.currTab = "search-games";

    await fetchSearchGameInfo(); 

    document.getElementById("search-games-modal").style.display = "flex";
};    

const searchGamesModal = document.getElementById("search-games-modal");

document.addEventListener("click", () => {
    document.querySelectorAll(".list-options").forEach(options => {
        options.style.display = "none";
    });
});

// #endregion //

// Function: fetchGameInfo
// Purpose: Fetches game info from the DB and populates the search games modal
// Returns: None
// Parameters: None
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region fetchSearchGameInfo() //
async function fetchSearchGameInfo() {
    const response = await fetch("/.netlify/functions/get-search-game-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();
    const games = data.games;

    if(!games || games.length === 0) {
        console.log("No games found.");
        return;
    }

    const container = document.getElementById("search-games-table-container");

    for (const game of games) {
        const id = game.game_id;
        const date = game.date;
        const sport = game.sport;
        const opponent = game.opponent;
        const location = game.location;
        const time = game.time;
        const notes = game.notes || "";
        const writer = (game.first_name || "") + " " + (game.last_name || "");
        const covered = game.available
            ? `<span style="color: red;">&#10006;</span>`
            : `<span style="color: green;">&#10004;</span>`;

        const gameBox = document.createElement("div");
        gameBox.classList.add("search-games-table-entry");
        gameBox.innerHTML = `
            <div class = "search-games-table-entry-section search-games-table-id">${id}</div>
            <div class = "search-games-table-entry-section search-games-table-date">${date}</div>
            <div class = "search-games-table-entry-section search-games-table-sport">${sport}</div>
            <div class = "search-games-table-entry-section search-games-table-opponent">${opponent}</div>
            <div class = "search-games-table-entry-section search-games-table-location">${location}</div>
            <div class = "search-games-table-entry-section search-games-table-time">${time}</div>
            ${notes ? `
                <div class = "search-games-table-entry-section search-games-table-notes">
                    <div class="search-games-table-notes-icon">i</div>
                    <div class="search-games-table-notes-modal">${notes}</div>
                </div>
            ` : `<div class = "search-games-table-entry-section search-games-table-notes"></div>`}
            <div class = "search-games-table-entry-section search-games-table-writer">${writer}</div>
            <div class = "search-games-table-entry-section search-games-table-covered">${covered}</div>
            <div class = "search-games-table-entry-section search-games-table-options list-options-button">&hellip;
                <div class="list-options">
                    <div class = "list-option edit-game-option">Edit</div>
                    <div class = "list-option delete-game-option">Delete</div>
                </div>
            </div>
         `;       
         
        gameBox.querySelector(".edit-game-option").addEventListener("click", () => openEditGameModal(game, "search-games")); 
        gameBox.querySelector(".delete-game-option").addEventListener("click", () => deleteGame(game.game_id, "search-games"));

        const optionsButton = gameBox.querySelector(".list-options-button");
        const options = gameBox.querySelector(".list-options");

        if(!optionsButton) console.log("Options button not found for game ID:", id);
        if(!options) console.log("Options menu not found for game ID:", id);

        options.addEventListener("click", e => e.stopPropagation());

        optionsButton.addEventListener("click", (e) => {
            console.log("clicked");
            e.stopPropagation();

            document.querySelectorAll(".list-options").forEach(m => {
                if (m !== options) m.style.display = "none";
            });

            options.style.display =
                options.style.display === "flex" ? "none" : "flex";
        });   
        
        container.appendChild(gameBox);
    }   

    const searchInput = document.getElementById("search-games-input");

    searchInput.oninput = () => {
        const term = searchInput.value.toLowerCase();

        document.querySelectorAll(".search-games-table-entry").forEach(game => {
            game.style.display =
                game.textContent.toLowerCase().includes(term)
                    ? "flex"
                    : "none";
        });
    };
}     
// #endregion //

// Function: openAddGameModal
// Purpose: Opens the modal for adding a game
// Returns: None
// Parameters: (1) containerId: container id to determine tab refresh 
// #region openAddGameModal //
async function openAddGameModal() {
    await loadSports("sport-input");

    document.getElementById("add-game-modal").style.display = "flex";
};    

const addModal = document.getElementById("add-game-modal");

document.getElementById("add-game-confirm").onclick = async () => {
    const sport = document.getElementById("sport-input").value;
    const opponent = document.getElementById("opponent-input").value;
    const location = document.getElementById("location-input").value;
    const date = document.getElementById("date-input").value;
    const time = document.getElementById("time-input").value;
    const notes = document.getElementById("notes-input").value;

    if(!sport || !opponent || !location || !date || !time) {
        alert("Please fill in all required fields");
    } 

    await addGame(sport, opponent, date, time, location, notes);
    
    addModal.style.display = "none";

    refreshCurrentTab(state.currTab);
};
// #endregion //


// Function: addGame
// Purpose: Adds the new game into the DB
// Returns: None
// Parameters: (1) sport: game's sport
//             (2) opponent: game's opponent
//             (3) date: date of game (MM-DD-YYYY)
//             (4) location: location of game (City, St.)
//             (5) notes: additional info for game (postseason, season opener, etc)
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region addGame() //
async function addGame(sport, opponent, date, time, location, notes) {
    try {
        const response = await fetch("/.netlify/functions/add-game", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ sport, opponent, date, time, location, notes })
        });

        const data = await response.json();

        if (data.success) {
            showToast("New game successfully added!", "success");
        } else {
            showToast("Failed to add new game", "error")
        }
        
        resetCaches();

    } catch (error) {
        console.error("Error:", error);
        alert("Error adding game to schedule.");
    }
};
// #endregion //


