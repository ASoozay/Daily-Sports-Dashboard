// Function: getSportNames
// Purpose: Returns the names of all sports in DB
// Returns: names of sports
// Parameters: None
// exceptions: (1) 500 if error with DB
// #region getSportNames()
async function getSportNames() {
    const response = await fetch("/.netlify/functions/get-sports");
    const data = await response.json();

    return data.sports.map(s => s.sport);
}
// #endregion //


// Function: getSports
// Purpose: Returns the objects of all sports in DB
// Returns: sports as objects
// Parameters: None
// exceptions: (1) 500 if error with DB
// #region getSports()
async function getSports() {
    const response = await fetch("/.netlify/functions/get-sports");

    console.log("response:", response);

    const data = await response.json();

    console.log("sports data:", data);

    return data.sports;
}
// #endregion //


// Function: loadSports
// Purpose: loads the sports into select options
// Returns: None
// Parameters: (1) selectId: id of container to put sport options in
// errors: (1) 500 if error with DB
// #region loadSports //
async function loadSports(selectId) {
    const sports = await getSports();

    console.log("sports:", sports);

    const select = document.getElementById(selectId);

    console.log("select:", select);

    select.innerHTML = "";

    sports.forEach(sport => {
        console.log("adding:", sport);

        const option = document.createElement("option");

        option.value = sport.sport;
        option.textContent = sport.sport;

        select.appendChild(option);
    });
}
// #endregion //


// Function: loadWriters
// Purpose: Loads writers into the select element in the assign game modal
// Returns: None
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region loadWriters() //
async function loadWriters(selectId) {
    const response = await fetch("/.netlify/functions/get-writers");
    const data = await response.json();
    const writers = data.writers;   

    const select = document.getElementById(selectId);
    select.innerHTML = ""; 

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a writer";
    defaultOption.disabled = true;
    defaultOption.selected = true;

    select.appendChild(defaultOption);

    writers.forEach(writer => {
        const option = document.createElement("option");

        option.value = writer.writer_id;  
        option.textContent = writer.first_name + " " + writer.last_name;

        select.appendChild(option);
    });
}
// #endregion //


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

