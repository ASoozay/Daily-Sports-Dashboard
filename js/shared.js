let currWriter = null;
let currGameId = null;

//#region Logging In / Logging Out
// Initialize Netlify Identity / Logging in
netlifyIdentity.on("init", async user => {
    console.log("Netlify Identity Initialized:", user);

    if (!user) {
        window.location.href = "/";
        return;
    }

    await fetchWriterData(user);
});

// Logging Out
document.getElementById("logout").onclick = function () {
    console.log("Attempting to log out...");

    netlifyIdentity.logout();
};

netlifyIdentity.on("logout", () => {
    console.log("Logged out successfully");

    localStorage.removeItem("netlify_identity");

    window.location.href = "/";
 });
//#endregion 

//#region Fetching Methods

let activeFilters = { sports: [], locations: [] };
let allScheduledFilters = { sports: [], locations: [] };
let scheduleFilters = { sports: [], locations: [] };
let availableFilters = { sports: [], locations: [] };
let historyFilters = { sports: [], locations: [], months: [] };

async function fetchWriterData(user) {
    const email = user.email;
    const response = await fetch("/.netlify/functions/writer-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    const data = await response.json();
    currWriter = data.writer;

    if (currWriter && currWriter.first_name) {
        document.getElementById("greetingHeader").textContent = `Hi, ${currWriter.first_name}!`;
    } else {
        document.getElementById("greetingHeader").textContent = "Hi, Guest";
    }

     return currWriter; 
};

async function fetchMySchedule(writerId, filters = { sports: [], locations: [] }) {
    if (!writerId) {
        console.log("Writer ID is missing!");

        return;  
    }
            
    const response = await fetch("/.netlify/functions/scheduled-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId, filters }) 
    });

    if (!response.ok) {
        console.log("Failed to fetch my scheduled games. Status:", response.status);
                
        return;
    }

    const data = await response.json();
    const games = data.games;

    if (!games || games.length === 0) {
        console.log("No scheduled games found.");
    }

    const container = document.getElementById("scheduled-games-container");
    container.innerHTML = "";

    games.forEach(game => {
        const gameId = game.game_id;
        const sport = game.sport;
        const opp = game.opponent;
        const location = game.location;
        const date = game.date;
        const time = game.time;
        const notes = game.notes;
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
            <img class = "washington-icon" src = "/images/schools/Washington.webp" alt = "UW">
            <div class = "where">${where}</div>
            <img class="opp-icon" src="/images/schools/${opp}.webp" alt="${opp}">
            <div class = "recap-container">
                <div class="${recap_css}"></div>
                <p class="recap-location">${location}</p>
            </div>
            <div class = "date">${formatDate(date)}</div>
            <div class = "time">${time}</div>
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

            fetchMySchedule(currWriter.writer_id, { sports: [], locations: [] });
        });
    });
}    

async function fetchAvailableGames(filters = { sports: [], locations: [] }) {
    const response = await fetch("/.netlify/functions/available-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }) 
    });

    const data = await response.json();
    const games = data.games;
            
    const container = document.getElementById("available-games-container");
    container.innerHTML = "";

    games.forEach(game => {
        const gameId = game.game_id;
        const sport = game.sport;
        const opp = game.opponent;
        const location = game.location;
        const date = game.date;
        const time = game.time;
        const notes = game.notes;
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
            <img class = "washington-icon" src = "/images/schools/Washington.webp" alt = "UW">
            <div class = "where">${where}</div>
            <img class="opp-icon" src="/images/schools/${opp}.webp" alt="${opp}">
            <div class = "recap-container">
                <div class="${recap_css}"></div>
                <p class="recap-location">${location}</p>
            </div>
            <div class = "date">${formatDate(date)}</div>
            <div class = "time">${time}</div>
            <div class = "options-container"> 
                <button class = "add" data-game-id = "${gameId}">ADD</button>
                <button class= "assign" onclick="openAssignModal(${gameId})">ASSIGN</button>
                <button class = "edit" onclick="openEditGameModal(${gameId})">EDIT</button>
            </div>    
            `;``

        container.appendChild(gameBox);

        const addButton = gameBox.querySelector(".add");
        addButton.addEventListener("click", async (e) => {
            const gameId = e.target.getAttribute("data-game-id");

            await signup(gameId, currWriter.writer_id);
        });
    });
}

async function fetchInvoices(writerId) {
    const response = await fetch("/.netlify/functions/get-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId }) 
    });  
            
    const data = await response.json();
    const invoices = data.invoices;
            
    const container = document.getElementById("invoice-entries-container");
    container.innerHTML = "";   

    invoices.forEach(invoice => {
        const date = invoice.date;
        const total = invoice.total;
        const link = invoice.link;

        const invoiceBox = document.createElement("div");
        invoiceBox.classList.add("invoice-history-box");
        invoiceBox.style.cursor = "pointer";

        invoiceBox.innerHTML = `
            <div class = "invoice-history-box-date">${formatDateWithYearNoDOW(date)}</div>
            <div class = "invoice-history-box-total">$${total}</div>
        `;
                
        invoiceBox.addEventListener("click", () => {
            if (link) {
                window.open(link, "_blank");
            }
        });

            container.appendChild(invoiceBox);
    });
}; 

async function fetchHistoryGames(writerId, filters = { sports: [], locations: [], months: [] }) {
    const response = await fetch("/.netlify/functions/history-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId, filters }) 
    });

    const data = await response.json();
    const games = data.games;
            
    const container = document.getElementById("history-container");
    container.innerHTML = "";

    games.forEach(game => {
        const gameId = game.game_id;
        const sport = game.sport;
        const opp = game.opponent;
        const location = game.location;
        const date = game.date;
        const time = game.time;
        const notes = game.notes;
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
            <img class = "washington-icon" src = "/images/schools/Washington.webp" alt = "UW">
            div class = "where">${where}</div>
            <img class="opp-icon" src="/images/schools/${opp}.webp" alt="${opp}">
            <div class = "recap-container">
                <div class="${recap_css}"></div>
                <p class="recap-location">${location}</p>
            </div>
            <div class = "date">${formatDateWithYear(date)}</div>
            <div class = "time">${time}</div>   
        `;``

        container.appendChild(gameBox);
    });
} 
//#endregion

