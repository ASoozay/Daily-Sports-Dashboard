// Functions for getting the user's scheduled games and available games

// Function: createSkeletonGameBoxes 
// Purpose: creates a skeleton box while games are fetched
// Returns: None
// Parameters: (1) container: container to put the skeleton in
// errors: None
// #region createSkeletonGameBoxes //
function createSkeletonGameBoxes(container) {
    for(let i = 0; i < 6; i++){
        const skeleton = document.createElement("div");
        skeleton.classList.add("game-box", "skeleton-game");

        skeleton.innerHTML = `
            <div class="skeleton skeleton-sport"></div>
            <div class="skeleton skeleton-matchup"></div>
            <div class="skeleton skeleton-location"></div>
            <div class="skeleton skeleton-date"></div>
        `;

        container.appendChild(skeleton);
    }
}
// #endregion //


// Function: noGames
// Purpose: adds a "No Games" box if there are no games for a given section
// Returns: None
// Parameters: (1) container: container to put the skeleton in
//             (2) message: message to put inside the "No Games" box
// errors: None
// #region noGames //
function noGames(container, message) {
    console.log("No scheduled games found.");

    const noGames = document.createElement("div");
    noGames.classList.add("no-games");
    noGames.textContent = message;

    container.appendChild(noGames);
}
// #endregion //


// Function: fetchMySchedule
// Purpose: Fetches the info for the games the user is scheduled to cover and shows games in dashboard
// Returns: None
// Parameters: (1) writerId: id of writer to get schedule for
//             (2) filters: Filters for games. Can filter by sport and/or location
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region fetchMySchedule() //
async function fetchMySchedule(filters = { sports: [], locations: [], months: [] }) {
    const container = document.getElementById("my-games-container");
    container.innerHTML = "";

    createSkeletonGameBoxes(container);
            
    const myGames = await fetchGames("my-games", filters);
    container.innerHTML = "";

    if (!myGames || myGames.length === 0) {
        noGames(container, "No Games in Schedule");
    }

    myGames.forEach(game => {
        const gameBox = createGameBox(game, options = ["remove"], tab = "my-games");
        container.appendChild(gameBox);
    });
}
// #endregion //


// Function: fetchAvailableGames
// Purpose: Fetches the info for the games that are available to be covered and shows games in dashboard
// Returns: None
// Parameters: (1) filters: Filters for games. Can filter by sport and/or location
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region fetchAvailableGames() //
async function fetchAvailableGames(filters = { sports: [], locations: [], months: [] }) {
    const container = document.getElementById("available-games-container");
    container.innerHTML = "";

    createSkeletonGameBoxes(container);

    const availableGames = await fetchGames("available-games", filters);
    container.innerHTML = "";

    if (!availableGames || availableGames.length === 0) {
        noGames(container, "No Available Games");
    }

    const currWriterPosition = state.currWriter.position;

    if(currWriterPosition === "Writer") {
        availableGames.forEach(game => {
            const gameBox = createGameBox(game, options = ["add"], tab = "available-games");
            container.appendChild(gameBox);
        })
    }

    if(currWriterPosition === "Editor" || currWriterPosition === "EIC" || currWriterPosition === "Copy") {
        availableGames.forEach(game => {
            const gameBox = createGameBox(game, options = ["add", "assign", "edit"], tab = "available-games");
            container.appendChild(gameBox);
        })
    }
}
// #endregion //


// Function: fetchAllScheduledGames
// Purpose: Fetches the info for all scheduled games and shows games in dashboard
// Returns: None
// Parameters: (1) filters: Filters for games. Can filter by sport and/or location
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region fetchAllScheduledGames //
async function fetchAllScheduledGames(filters = { sports: [], locations: [], months: [] }) {
    const container = document.getElementById("all-games-container");
    container.innerHTML = "";

    createSkeletonGameBoxes(container);

    const allGames = await fetchGames("all-games", filters);
    container.innerHTML = "";

    if (!allGames || allGames.length === 0) {
        noGames(container, "No Games in Schedule");
    }

    allGames.forEach(game => {
        const gameBox = createGameBox(game, options = ["edit", "remove"], tab = "all-games");
        container.appendChild(gameBox);
    });
} 
// #endregion //


// Function: fetchHistoryGames
// Purpose: Fetches the info for the games the user has covered in the past and shows games in dashboard
// Returns: None
// Parameters: (1) writerId: id of writer to get history for
//             (2) filters: Filters for games. Can filter by sport, location, and month
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region fetchHistoryGames() //
async function fetchHistoryGames(filters = { sports: [], locations: [], months: [] }) {
    const container = document.getElementById("history-games-container");
    container.innerHTML = "";

    createSkeletonGameBoxes(container);

    const historyGames = await fetchGames("history-games", filters);
    container.innerHTML = "";

    if (!historyGames || historyGames.length === 0) {
        noGames(container, "No Games in History");
    }

    historyGames.forEach(game => {
        const gameBox = createGameBox(game, options = [], tab = "history-games");
        container.appendChild(gameBox);
    });
}
// #endregion //


// Function: fetchGames 
// Purpose: fecthes the games for the tab given filters
// Returns: games that meet criteria
// Parameters: (1) tab: current tab to get games for
//             (2) filters for games
// errors: (1) 500 if error with DB
// #region fetchGames //
async function fetchGames(tab, filters) {
    let fetchEndpoint = "";
    let fetchBody = null;

    switch(tab){
        case "all-games": 
            fetchEndpoint = "/.netlify/functions/get-all-games";
            fetchBody = JSON.stringify({ filters });
            break;

        case "my-games": 
            fetchEndpoint = "/.netlify/functions/get-my-games";
            fetchBody = JSON.stringify({ writerId: state.currWriter.writer_id, filters });
            break;

        case "available-games": 
            fetchEndpoint = "/.netlify/functions/get-available-games";
            fetchBody = JSON.stringify({ filters }); 
            break;

        case "history-games":
            fetchEndpoint = "/.netlify/functions/get-history-games";
            fetchBody = JSON.stringify({ writerId: state.currWriter.writer_id, filters });
            break;   
    }

    const response = await fetch(fetchEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fetchBody
    });

    if (!response.ok) {
        console.log("Failed to fetch games. Status:", response.status);
        return;
    }

    const data = await response.json();

    return data.games;
}
// #endregion //


// Function: createGameBox
// Purpose: creates a box for a game with info
// Returns: box of game to add to game container
// Parameters: (1) game: game object to make box for
//             (2) options: options to add to the game (add, assign, edit, etc)
//             (3) tab: current tab to update
// errors: None
// #region createGameBox //
function createGameBox(game, options = []) {
    console.log("game", game.game_id);

    const sport = game.sport;
    const notes = game.notes || "";
    const opponent = game.opponent;
    const location = game.location;
    const homeRecap = location.trim() === "Seattle, Wash.";
    const where = homeRecap ? "vs" : "@";
    const recapCSS = homeRecap ? "home-recap" : "away-recap";
    const date = game.date;
    const time = game.time;
    const writer = (game.first_name || "") + " " + (game.last_name || "");

    const gameId = game.game_id;
    const writerId = game.writer_id;

    let gameOptions = "";

    for (const option of options) {
        switch (option) {
            case "add":
                gameOptions += `<button class="game-option" data-action = "add-game">ADD</button>`;               
                break;

            case "assign":
                gameOptions += `<button class="game-option" data-action = "assign-game">ASSIGN</button>`;        
                break;

            case "edit":
                gameOptions += `<button class="game-option" data-action = "edit-game">EDIT</button>`;
                break;

            case "remove":
                gameOptions += `<button class="game-option" data-action = "remove-game">REMOVE</button>`;
                break;
        }
    }

    const gameBox = document.createElement("div");
    gameBox.className = "game-box";

    gameBox.innerHTML = `
        <div class = "sport-container">
            <div class = "sport-box">${sport}</div>
            <div class = "notes-box">${notes}</div> 
        </div>
        <div class = "matchup-container">
            <img class = "school-icon" src = "/images/schools/${state.school.school}.webp" alt = "UW">
            <div class = "where">${where}</div>
            <img class="school-icon" src="/images/schools/${opponent}.webp" alt="${opponent}">
        </div>
        <div class = "recap-container">
            <div class="${recapCSS}"></div>
            <p class="recap-location">${location}</p>
        </div>
        <div class = "when-container">
            <div class = "date">${formatDate(date)}</div>
            <div class = "time">${time}</div>
        </div>
        <div class = "writer">${writer}</div>
        <div class = "options-container"> 
            ${gameOptions}
        </div>    
        `;

        const addButton = gameBox.querySelector('[data-action="add-game"]');
        
        if(addButton){
            console.log("CREATING ADD BUTTON FOR:", game);
        
            addButton.addEventListener("click", async (e) => {
                console.log("ADD CLICKED");
                console.log("CLICK GAME:", game);
        
                await signup(game, state.currWriter.writer_id);
            });
        } 
        
        const assignButton = gameBox.querySelector('[data-action="assign-game"]');
        if(assignButton){
            assignButton.addEventListener("click", async (e) => {
                await openAssignGameModal(game);
            }); 
        }
        
        const editButton = gameBox.querySelector('[data-action="edit-game"]');
        if(editButton){
            editButton.addEventListener("click", async (e) => {
                await openEditGameModal(game);
            });  
        }
        
        const removeButton = gameBox.querySelector('[data-action="remove-game"]');
        if(removeButton){
            removeButton.addEventListener("click", async (e) => {
                await remove(game);
            });     
        }   

    return gameBox;
}
// #endregion //


// Function: resetCaches
// Purpose: resets caches when a game is updated
// Returns: None
// Parameters: None
// errors: None
// #region resetCaches //
function resetCaches() {
    myScheduleLoaded = false;
    availableGamesLoaded = false;
    historyLoaded = false;
    allScheduledGamesLoaded = false;
}
// #endregion //


// Function: refreshCurrentTab
// Purpose: refreshes the current tab when a game is added/edited/removed
// Returns: None
// Parameters: (1) tab: tab to refresh
// errors: (1) 500 if error with DB
// #region refreshCurrentTab //
async function refreshCurrentTab() {
    console.log("refreshing tab: ", state.currTab);

    switch(state.currTab) {
        case "all-games":
            return await fetchAllScheduledGames(state.filters.allGames);
            break;

        case "available-games":
            return await fetchAvailableGames(state.filters.availableGames);
            break;

        case "my-games":
            return await fetchMySchedule(state.filters.myGames);
            break;

        case "history-games":
            return await fetchHistoryGames(state.filters.historyGames);
            break;

        case "search-games":
            return await fetchSearchGameInfo();
            break;    
    }
}
// #endregion //
