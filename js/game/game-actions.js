// All game-actions


// Function: signup
// Purpose: Signs the user up to cover a game 
// Returns: None
// Parameters: (1) gameId: id of game to sign up for
//             (2) writerId: id of writer signing up for game
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region signup() //
async function signup(game, writerId) {
   console.log("signup game:", game);
    console.log("signup writer:", writerId);
    console.log("signup called", game.game_id, writerId);
    try {
        console.log("game:", game);
        console.log("writerId:", writerId);
        const response = await fetch("/.netlify/functions/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ gameId: game.game_id, writerId })
        });

        const data = await response.json();

        if (data.success) {
            showToast("Successfully added game to schedule!", "success");
            resetCaches();
            fetchAvailableGames(state.filters.availableGames);
        } else {
            showToast("Failed to add game to schedule", "error");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error adding game to assignments.");
    }
} 
// #endregion //


// Function: remove
// Purpose: Removes the user from a game they were signed up for
// Returns: None
// Parameters: (1) gameId: id of game to remove from
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region remove() //
async function remove(game) {
    try {
        const response = await fetch("/.netlify/functions/remove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ gameId: game.game_id})
        });

        const data = await response.json();

        if (data.success) {
            showToast("Game removed from schedule", "success");
            resetCaches();
            refreshCurrentTab(state.currTab);
        } else {
            showToast("Failed to remove game from schedule", "error")
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error removing game from assignments.");
    }
} 
// #endregion //


// Function: openAssignModal
// Purpose: Assigns an open game to a writer
// Returns: None
// Parameters: (1) gameId: id of the game 
// #region openAssignModal //
async function openAssignGameModal(game) {
    state.currGame = game;

    await loadWriters("writer-select");

    document.getElementById("assign-modal").style.display = "flex";
}   

const assignModal = document.getElementById("assign-modal");

document.getElementById("confirm-assign").onclick = async () => {
    const writerId = document.getElementById("writer-select").value;

    if (!writerId) {
        alert("Please select a writer");
        return;
    }

    await signup(game, writerId);

    assignModal.style.display = "none";
    
    resetCaches();
    refreshCurrentTab(state.currTab);
};
// #endregion //


// Function: openEditGameModal
// Purpose: Opens the modal for editing a game 
// Returns: None
// Parameters: (1) gameId: id of game to edit
//             (2) containerId: container id to determine tab refresh
// #region openeditGameModal //
async function openEditGameModal(game) {
    state.currGame = game;

    await loadSports("edit-sport-input");

    document.getElementById("edit-sport-input").value = game.sport;
    document.getElementById("edit-opponent-input").value = game.opponent;
    document.getElementById("edit-location-input").value = game.location;
    document.getElementById("edit-date-input").value = game.date;
    document.getElementById("edit-time-input").value = game.time;
    document.getElementById("edit-notes-input").value = game.notes || "";

    document.getElementById("edit-game-modal").style.display = "flex";
};    

const editModal = document.getElementById("edit-game-modal");

document.getElementById("edit-game-confirm").onclick = async () => {
    const sport = document.getElementById("edit-sport-input").value;
    const opponent = document.getElementById("edit-opponent-input").value;
    const location = document.getElementById("edit-location-input").value;
    const date = document.getElementById("edit-date-input").value;
    const time = document.getElementById("edit-time-input").value;
    const notes = document.getElementById("edit-notes-input").value;

    if(!sport || !opponent || !location || !date || !time) {
        alert("Please fill in all required fields");
        return;
    } 

    await editGame(state.currGame, sport, opponent, date, time, location, notes);

    editModal.style.display = "none";

    resetCaches();
    refreshCurrentTab(state.currTab); 
};

document.getElementById("delete-game-confirm").onclick = async () => {
    resetCaches();
    await deleteGame(state.currGame);
    
    editModal.style.display = "none";
}


// Function: loadGameInfo
// Purpose: Loads the info for a game to pre-fill the edit game modal
// Returns: game info object
// Parameters: (1) gameId: id of game to get info for
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region loadGameInfo() //
async function loadGameInfo(gameId) {
    const response = await fetch("/.netlify/functions/get-game-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId })
    });

    const gameInfo = await response.json();

    return gameInfo;
}
// #endregion //


// Function: editGame
// Purpose: Edits the info for a game in the DB
// Returns: None
// Parameters: (1) gameId: id of game to edit
//             (2) sport: game's sport
//             (3) opponent: game's opponent
//             (4) date: date of game (MM-DD-YYYY)
//             (5) location: location of game (City, St.)
//             (6) notes: additional info for game (postseason, season opener, etc)
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region editGame() //
async function editGame(game, sport, opponent, date, time, location, notes) {
    try {
        const response = await fetch("/.netlify/functions/edit-game", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ gameId: game.game_id, sport, opponent, date, time, location, notes })
        });

        const data = await response.json();

        if (data.success) {
            showToast("Game successfully edited!", "success");
        } else {
            showToast("Failed to edit game", "error");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error editing game.");
    }
}; 
// #endregion //


// Function: deleteGame
// Purpose: Deletes a game from the DB
// Returns: None
// Parameters: (1) gameId: id of game to delete
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region deleteGame() //
async function deleteGame(game) {
    try {
        const response = await fetch("/.netlify/functions/delete-game", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ gameId: game.game_id })
        });

       const data = await response.json();

        if (data.success) {
            showToast("Game successfully deleted!", "success");
        } else {
            showToast("Failed to delete game", "error");
            return;
        }

        refreshCurrentTab(state.currTab);

    } catch (error) {
        console.error("Error:", error);
        alert("Error deleting game.");
    }
}
// #endregion //
