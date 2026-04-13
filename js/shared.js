let currWriter = null;
let currGameId = null;
let activeFilters = { sports: [], locations: [] };
let myScheduleFilters = { sports: [], locations: [] };
let availableFilters = { sports: [], locations: [] };
let historyFilters = { sports: [], locations: [], months: [] };

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
        `;

        container.appendChild(gameBox);
    });
} 
//#endregion

//#region Load Methods

function loadHistoryFilters() {
    const template = document.getElementById("history-filter-template");
    const container = document.getElementById("history-filter-container");

    container.innerHTML = "";
    const clone = template.content.cloneNode(true);
    container.appendChild(clone);
 }
//#endregion

//#region Filters

function createGamesFilter(containerId, onFilterChange) {
    const template = document.getElementById("games-filter-template");
    const clone = template.content.cloneNode(true);

    const container = document.getElementById(containerId);
    container.appendChild(clone);

    const boxes = container.querySelectorAll(".filter-box");

    boxes.forEach(box => {
        box.addEventListener("click", () => {
            box.classList.toggle("active");

            const value = box.dataset.value;
            const isSport = box.closest(".sport-options");
            const isLocation = box.closest(".location-options");

            if (isSport) {
                toggleFilterValue(activeFilters.sports, value);
            }

            if (isLocation) {
                toggleFilterValue(activeFilters.locations, value);
            }

            onFilterChange(activeFilters);
        });
    });
}

function toggleFilterValue(array, value) {
    const index = array.indexOf(value);

    if (index > -1) {
        array.splice(index, 1);
    } else {
        array.push(value);
    }
} 
//#endregion

//#region Tabs 
window.tabHandlers = {};

tabHandlers["scheduled-games"] = function() {
    const container = document.getElementById("scheduled-games-filter-container");

    if (!container.hasChildNodes()) {
        createGamesFilter("scheduled-games-filter-container", filters => {
            myScheduleFilters = filters;
            fetchMySchedule(currWriter.writer_id, myScheduleFilters);
        });
    }

    fetchMySchedule(currWriter.writer_id, myScheduleFilters);
};

tabHandlers["available-games"] = function() {
    const container = document.getElementById("available-games-filter-container");

    if (!container.hasChildNodes()) {
        createGamesFilter("available-games-filter-container", filters => {
            availableFilters = filters;
            fetchAvailableGames(availableFilters);
        });
    }

    fetchAvailableGames(availableFilters);
};

tabHandlers["invoices"] = function() {
    fetchInvoices(currWriter.writer_id);
};

tabHandlers["history"] = function() {
    const container = document.getElementById("history-filter-container");

    if (!container.hasChildNodes()) {
        loadHistoryFilters();
    }

    fetchHistoryGames(currWriter.writer_id, historyFilters);
};

window.onload = async function() {
    const user = netlifyIdentity.currentUser();

    if (!user) return;

    await fetchWriterData(user); 
            
    const scheduledTabId = "scheduled-games";
    const scheduledButton = document.querySelector(`button[onclick="showTab(event, '${scheduledTabId}')"]`);
    const scheduledTab = document.getElementById(scheduledTabId);

            
    const allTabs = document.getElementsByClassName("tab-content");
    const allButtons = document.getElementsByClassName("tab-button");
    for (let tab of allTabs) tab.style.display = "none";
    for (let btn of allButtons) btn.classList.remove("active-tab");

    scheduledTab.style.display = "flex";
    scheduledButton.classList.add("active-tab");

            
    const filterContainer = document.getElementById("scheduled-games-filter-container");
    if (!filterContainer.hasChildNodes()) {
        createGamesFilter("scheduled-games-filter-container", filters => {
            fetchMySchedule(currWriter.writer_id, filters);
        });
    }

    await fetchMySchedule(currWriter.writer_id, myScheduleFilters);
 };

window.showTab = function(event, tabId) {
    const tabs = document.getElementsByClassName("tab-content");
    const buttons = document.getElementsByClassName("tab-button");

    for (let tab of tabs) tab.style.display = "none";
    for (let btn of buttons) btn.classList.remove("active-tab");

    document.getElementById(tabId).style.display = "flex";
    event.currentTarget.classList.add("active-tab");

    if (tabHandlers[tabId]) {
        tabHandlers[tabId]();
    }
};
//#endregion

//#region Signup / Remove 

async function signup(gameId) {
    console.log("Game ID: ", gameId, "  Writer ID: ", currWriter.writer_id);

    try {
        const response = await fetch("/.netlify/functions/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ gameId: gameId, writerId: currWriter.writer_id })
        });

        const data = await response.json();

        if (data.success) {
            alert("Game successfully added to assignments!");

            fetchAvailableGames(availableFilters);
        } else {
            alert("Failed to add game to assignments.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error adding game to assignments.");
    }
} 

async function remove(gameId) {
    console.log("Game ID: ", gameId);

    try {
        const response = await fetch("/.netlify/functions/remove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ gameId: gameId})
        });

        const data = await response.json();

        if (data.success) {
            alert("Game successfully removed from schedule");
            
            fetchMySchedule(currWriter.writerId, myScheduleFilters);
        } else {
            alert("Failed to remove game to schedule.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error removing game from assignments.");
    }
}     

//#endregion

//#region Invoice

function openInvoiceModal() {
    document.getElementById("invoice-modal").style.display = "flex";
}

document.getElementById("confirm-invoice").addEventListener("click", async () => {
    const date = document.getElementById("invoice-date-input").value;
    const total = document.getElementById("invoice-total-input").value;
    const link = document.getElementById("invoice-link-input").value;

    if (!date || !total) {
        alert("Please fill in the date and total.");
        return;
    }

    await addInvoice(currWriter.writer_id, date, total, link);
    document.getElementById("invoice-modal").style.display = "none";
    
    fetchInvoices(currWriter.writer_id);
});

async function addInvoice(writerId, date, total, link) {
    try {
        const response = await fetch("/.netlify/functions/add-invoice", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ writerId, date, total, link })
        });

        const data = await response.json();
        if (data.success) {
            alert("Invoice successfully added!");
        } else {
            alert("Failed to add invoice.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error adding invoice.");
    }
}
//#endregion

//#region Modals
document.querySelectorAll(".close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = btn.closest(".modal");

        if (modal) modal.style.display = "none";
    });
});

window.addEventListener("click", (event) => {
    document.querySelectorAll(".modal").forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});
 //#endregion

//#region Functions (Times, Dates, PDFs, etc)
function openPDF(path) {
    if (path !== "") {
        window.open(path, "_blank");
    }
}

function toggleResources() {
    const list = document.getElementById("resources-list");

    if (list.style.display === "block") {
        list.style.display = "none";
    } else {
        list.style.display = "block";
    }
}

function convertTo12Hour(time24) {
    const [hour, minute] = time24.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;
    if (h === 0) h = 12;

    return `${h}:${minute} ${ampm}`;
}

function convertTo24Hour(timeStr) {
    if (!timeStr) return "";

    const [time, modifier] = timeStr.split(" "); // "7:00", "PM"
    let [hours, minutes] = time.split(":");

    hours = parseInt(hours);

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
        hours = 0;
    }

    // format to HH:MM
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateWithYear(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateWithYearNoDOW(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}
//#endregion