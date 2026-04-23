let allScheduledFilters = { sports: [], locations: [] };

//#region Load Methods

async function loadWriters() {
    const response = await fetch("/.netlify/functions/get-writers");
    const data = await response.json();
    const writers = data.writers;   

    const select = document.getElementById("writer-select");
    select.innerHTML = ""; 

    writers.forEach(writer => {
        const option = document.createElement("option");

        option.value = writer.writer_id;  
        option.textContent = writer.first_name + " " + writer.last_name;

        select.appendChild(option);
    });
}

async function loadSports(selectId) {
    const response = await fetch("/.netlify/functions/get-sports");
    const data = await response.json();
    const sports = data.sports;

    const select = document.getElementById(selectId);
    select.innerHTML = "";

    sports.forEach(sport => {
        const option = document.createElement("option");
        option.value = sport.sport;
        option.textContent = sport.sport;
        select.appendChild(option);
    });
}

async function loadGameInfo(gameId) {
    const response = await fetch("/.netlify/functions/get-game-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId })
    });

    const gameInfo = await response.json();

    return gameInfo;
}
//#endregion        
       
//#region Fetch Methods

async function fetchAllScheduledGames(writerId, filters = { sports: [], locations: [] }) {
    const response = await fetch("/.netlify/functions/all-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId, filters }) 
    });

    if (!response.ok) {
        console.log("Failed to fetch all scheduled games. Status:", response.status);
        return;
    }

    const data = await response.json();
    const games = data.games;

    const container = document.getElementById("all-games-container");
    container.innerHTML = "";

    if (!games || games.length === 0) {
    console.log("No scheduled games found.");

    const noGames = document.createElement("div");
    noGames.classList.add("no-games");
        
    noGames.innerHTML = `
    <div class = "no-games">No Scheduled Games</div>
    `;

        container.appendChild(noGames);
    }

    games.forEach(game => {
        const gameId = game.game_id;
        const sport = game.sport;
        const opp = game.opponent;
        const location = game.location;
        const date = game.date;
        const time = game.time;
        const notes = game.notes;
        const name = game.first_name + " " + game.last_name;
        let where = "";
        let recap = "";
        let recap_css = "";
                                
        if(location == "Seattle, Wash. " || location == "Seattle, Wash."){
            where = "vs";
            recap_css = "home-recap"
        } else {
            where = "@";
            recap_css = "away-recap"
        }

        const gameBox = document.createElement("div");
        gameBox.classList.add("game-box");

        gameBox.innerHTML = `
            <div class = "sport-container">
                <div class = "sport-box">${sport}</div>
                <div class = "notes-box">${notes}</div> 
            </div>
            <div class = "matchup-container">
                <img class = "washington-icon" src = "/images/schools/Washington.webp" alt = "UW">
                <div class = "where">${where}</div>
                <img class="opp-icon" src="/images/schools/${opp}.webp" alt="${opp}">
            </div>
            <div class = "recap-container">
                <div class="${recap_css}"></div>
                <p class="recap-location">${location}</p>
            </div>
            <div class = "when-container">
                <div class = "date">${formatDate(date)}</div>
                <div class = "time">${time}</div>
            </div>
            <div class = "writer">${name}</div>
            <div class = "options-container"> 
                <button class = "remove" data-game-id = "${gameId}">REMOVE</button>
                <button class = "edit" onclick="openEditGameModal(${gameId})">EDIT</button>
            </div>    
        `;

        container.appendChild(gameBox);

        const removeButton = gameBox.querySelector(".remove");
        removeButton.addEventListener("click", async (e) => {
            const gameId = e.target.getAttribute("data-game-id");

            await remove(gameId);

            fetchAllScheduledGames(currWriter.writer_id, allScheduledFilters);
        });
    });
}   
//#endregion      

//#region tabHandlers

tabHandlers["all-games"] = function() {
    const container = document.getElementById("all-games-filter-container");

    if (!container.hasChildNodes()) {
        createGamesFilter(
            "all-games-filter-container",
            allScheduledFilters,
            filters => {
                fetchAllScheduledGames(currWriter.writer_id, filters);
            });
    }

    fetchAllScheduledGames(currWriter.writer_id, myScheduleFilters);
};


//#endregion

//#region Modals

async function openAssignModal(gameId) {
    currGameId = gameId;

    await loadWriters();

    document.getElementById("assign-modal").style.display = "flex";
    }   

    const assignModal = document.getElementById("assign-modal");

    document.getElementById("confirm-assign").onclick = async () => {

    const writerId = document.getElementById("writer-select").value;

    if (!writerId) {
        alert("Please select a writer");
        return;
    }

    await signup(currGameId, writerId);

    assignModal.style.display = "none";
};

async function openAddGameModal() {
    await loadSports("sport-input");

    document.getElementById("add-modal").style.display = "flex";
};    

const addModal = document.getElementById("add-modal");

document.getElementById("confirm-add").onclick = async () => {
    const sport = document.getElementById("sport-input").value;
    const opponent = document.getElementById("opponent-input").value;
    const location = document.getElementById("location-input").value;
    const date = document.getElementById("date-input").value;
    const time = convertTo12Hour(document.getElementById("time-input").value);
    const notes = document.getElementById("notes-input").value;

    if(!sport || !opponent || !location || !date || !time) {
        alert("Please fill in all required fields");
    } 

    await addGame(sport, opponent, date, time, location, notes);
    
    addModal.style.display = "none";
};

async function openEditGameModal(gameId) {
    currGameId = gameId;

    const data = await loadGameInfo(gameId);
    console.log("GAME DATA:", data);
    const game = data.game;

    await loadSports("edit-sport-input");

    document.getElementById("edit-sport-input").value = game.sport;
    document.getElementById("edit-opponent-input").value = game.opponent;
    document.getElementById("edit-location-input").value = game.location;
    document.getElementById("edit-date-input").value = game.date;
    document.getElementById("edit-time-input").value = convertTo24Hour(game.time);
    document.getElementById("edit-notes-input").value = game.notes || "";

    document.getElementById("edit-modal").style.display = "flex";
};    

const editModal = document.getElementById("edit-modal");

document.getElementById("confirm-edit").onclick = async () => {
    const sport = document.getElementById("edit-sport-input").value;
    const opponent = document.getElementById("edit-opponent-input").value;
    const location = document.getElementById("edit-location-input").value;
    const date = document.getElementById("edit-date-input").value;
    const time = convertTo12Hour(document.getElementById("edit-time-input").value);
    const notes = document.getElementById("edit-notes-input").value;

    if(!sport || !opponent || !location || !date || !time) {
        alert("Please fill in all required fields");
    } 

    await editGame(currGameId, sport, opponent, date, time, location, notes);

    editModal.style.display = "none";
};

document.getElementById("delete-game").onclick = async () => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    await deleteGame(currGameId);

    document.getElementById("edit-modal").style.display = "none";
};
//#endregion

//#region Game Functions (add, edit, delete)

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
            alert("Game successfully added to schedule");
        } else {
            alert("Failed to add game to schedule.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error adding game to schedule.");
    }
};

async function editGame(gameId, sport, opponent, date, time, location, notes) {
    try {
        const response = await fetch("/.netlify/functions/edit-game", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ gameId, sport, opponent, date, time, location, notes })
        });

        const data = await response.json();

        if (data.success) {
            alert("Game successfully edited.");
        } else {
            alert("Failed to edit game.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error editing game.");
    }
}; 
    
async function deleteGame(gameId) {
    try {
        const response = await fetch("/.netlify/functions/delete-game", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ gameId })
        });

       const data = await response.json();

        if (data.success) {
            alert("Game successfully deleted.");
        } else {
            alert("Failed to delete game.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error deleting game.");
    }
 }

//#endregion



 
 