
        let currWriter = null;
        let currGameId = null;

        // Initialize Netlify Identity
        netlifyIdentity.on("init", async user => {
            console.log("Netlify Identity Initialized:", user);

            if (!user) {
                window.location.href = "/";
                return;
            }

            await fetchWriterData(user);
        });

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

            return currWriter; // <- return so we can await
        };

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

        let activeFilters = {
            sports: [],
            locations: []
        };

        let allScheduledFilters = { sports: [], locations: [] };
        let scheduleFilters = { sports: [], locations: [] };
        let availableFilters = { sports: [], locations: [] };
        let historyFilters = { sports: [], locations: [], months: [] };

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

    function loadHistoryFilters() {
        const template = document.getElementById("history-filter-template");
        const container = document.getElementById("history-filter-container");

        container.innerHTML = "";
        const clone = template.content.cloneNode(true);
        container.appendChild(clone);
    }

        function toggleFilterValue(array, value) {
            const index = array.indexOf(value);
            if (index > -1) {
                array.splice(index, 1);
            } else {
                array.push(value);
            }
        }        

        async function fetchAllScheduledGames(writerId, filters = { sports: [], locations: [] }) {
            // Ensure the writerId is being passed correctly
            if (!writerId) {
                console.log("Writer ID is missing!");
                return;  // Exit if writerId is missing
            }
            
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

            if (!games || games.length === 0) {
                console.log("No scheduled games found.");
            }

            const container = document.getElementById("all-games-container");
            container.innerHTML = "";

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
                <img class = "washington-icon" src = "/images/schools/Washington.webp" alt = "UW">
                <div class = "where">${where}</div>
                <img class="opp-icon" src="/images/schools/${opp}.webp" alt="${opp}">
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
                    fetchAllScheduledGames(currWriter.writer_id, { sports: [], locations: [] });
                });
            });
        }

        async function fetchMyScheduledGames(writerId, filters = { sports: [], locations: [] }) {
            // Ensure the writerId is being passed correctly
            if (!writerId) {
                console.log("Writer ID is missing!");
                return;  // Exit if writerId is missing
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
                    fetchMyScheduledGames(currWriter.writer_id, { sports: [], locations: [] });
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
                <div class = "where">${where}</div>
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

    async function signup(gameId, writerId) {
        console.log("Game ID: ", gameId, "  Writer ID: ", writerId);
        try {
            // Send a POST request to add the game to the Assignments table and update the Games table
            const response = await fetch("/.netlify/functions/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ gameId: gameId, writerId: writerId })
            });

            const data = await response.json();
            if (data.success) {
                alert("Game successfully added to assignments!");
                // Optionally update the UI to reflect the changes
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
            // Send a POST request to add the game to the Assignments table and update the Games table
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
                // Optionally update the UI to reflect the changes
            } else {
                alert("Failed to remove game to schedule.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error removing game from assignments.");
        }
    }     

    async function openAssignModal(gameId) {
        currGameId = gameId;
        await loadWriters();
        document.getElementById("assign-modal").style.display = "flex";
    }   

    const assModal = document.getElementById("assign-modal");

    document.getElementById("confirm-assign").onclick = async () => {

    const writerId = document.getElementById("writer-select").value;

    if (!writerId) {
        alert("Please select a writer");
        return;
    }

    await signup(currGameId, writerId);

    assModal.style.display = "none";
    };

    async function openAddGameModal() {
        await loadSports("sport-input");
        document.getElementById("add-modal").style.display = "flex";
    }    

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
    }

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
        }    

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
    }

    document.getElementById("delete-game").onclick = async () => {
        if (!confirm("Are you sure you want to delete this game?")) return;

        await deleteGame(currGameId);

        document.getElementById("edit-modal").style.display = "none";
    };

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
    }

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
    } 
    
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

    document.getElementById("logout").onclick = function () {
        console.log("Attempting to log out...");

            netlifyIdentity.logout();
        };

        // Listen for logout event
        netlifyIdentity.on("logout", () => {
            console.log("Logged out successfully");

            // Optional cleanup (honestly not even needed)
            localStorage.removeItem("netlify_identity");

            // Redirect AFTER logout finishes
            window.location.href = "/";
        });

        // Show tab content function
        window.showTab = function(event, tabId) {
            const tabs = document.getElementsByClassName("tab-content");
            const buttons = document.getElementsByClassName("tab-button");

            for (let i = 0; i < tabs.length; i++) {
                tabs[i].style.display = "none";
            }

            for (let i = 0; i < buttons.length; i++) {
                buttons[i].classList.remove("active-tab");
            }

            document.getElementById(tabId).style.display = "flex";
            event.currentTarget.classList.add("active-tab");

            if(tabId == "all-games") {
                const filterContainer = document.getElementById("all-games-filter-container");

                // Only create filters once
                if (!filterContainer.hasChildNodes()) {
                    createGamesFilter("all-games-filter-container", filters => {
                        scheduleFilters = filters;
                        fetchAllScheduledGames(currWriter.writer_id, scheduleFilters);
                    });
                }

                // Fetch all games initially
                fetchAllScheduledGames(currWriter.writer_id, scheduleFilters); 
            }

            if(tabId == "scheduled-games") {
                const filterContainer = document.getElementById("scheduled-games-filter-container");

                // Only create filters once
                if (!filterContainer.hasChildNodes()) {
                    createGamesFilter("scheduled-games-filter-container", filters => {
                        scheduleFilters = filters;
                        fetchMyScheduledGames(currWriter.writer_id, scheduleFilters);
                    });
                }

                // Fetch all games initially
                fetchMyScheduledGames(currWriter.writer_id, scheduleFilters); 
            }

            if (tabId == "available-games") {
                const filterContainer = document.getElementById("available-games-filter-container");

                // Only create filters once
                if (!filterContainer.hasChildNodes()) {
                    createGamesFilter("available-games-filter-container", filters => {
                        availableFilters = filters;
                        fetchAvailableGames(availableFilters); // update games on filter click
                    });
                }

                // Fetch all games initially
                fetchAvailableGames(availableFilters); 
            }

            if (tabId == "history") {
                const filterContainer = document.getElementById("history-filter-container");

                if (!filterContainer.hasChildNodes()) {
                    loadHistoryFilters(); 

                    const container = document.getElementById("history-filter-container");
                    const boxes = container.querySelectorAll(".filter-box, .history-month-box, .history-location-box");

                    boxes.forEach(box => {
                        box.addEventListener("click", () => {
                            box.classList.toggle("active");

                            const value = box.dataset.value;

                            if (box.closest(".sport-options")) {
                                toggleFilterValue(historyFilters.sports, value);
                            }

                            if (box.closest(".location-options")) {
                                toggleFilterValue(historyFilters.locations, value);
                            }

                            if (box.closest(".month-options")) {
                                toggleFilterValue(historyFilters.months, value);
                            }

                            fetchHistoryGames(currWriter.writer_id, historyFilters);
                        });
                    });
                }

                fetchHistoryGames(currWriter.writer_id, historyFilters);
            }   
        }

        window.onload = async function() {
            const user = netlifyIdentity.currentUser();
            if (!user) return;

            await fetchWriterData(user); // wait until currWriter is ready
            
            const scheduledTabId = "all-games";
            const scheduledButton = document.querySelector(`button[onclick="showTab(event, '${scheduledTabId}')"]`);
            const scheduledTab = document.getElementById(scheduledTabId);

            // Activate tab
            const allTabs = document.getElementsByClassName("tab-content");
            const allButtons = document.getElementsByClassName("tab-button");
            for (let tab of allTabs) tab.style.display = "none";
            for (let btn of allButtons) btn.classList.remove("active-tab");

            scheduledTab.style.display = "flex";
            scheduledButton.classList.add("active-tab");

            // Create filters once
            const filterContainer = document.getElementById("all-games-filter-container");
            if (!filterContainer.hasChildNodes()) {
                createGamesFilter("all-games-filter-container", filters => {
                    fetchAllScheduledGames(currWriter.writer_id, filters);
                });
            }

            // Fetch games now that currWriter is ready
            await fetchAllScheduledGames(currWriter.writer_id, { sports: [], locations: [] });
        };

    window.twttr = (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
        if (d.getElementById(id)) return t;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://platform.x.com/widgets.js";
        fjs.parentNode.insertBefore(js, fjs);

        t._e = [];
        t.ready = function(f) {
            t._e.push(f);
        };

        return t;
        }(document, "script", "twitter-wjs"));

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
