
        let currWriter = null;

        // Initialize Netlify Identity
        netlifyIdentity.on("init", user => {
            console.log('Netlify Identity Initialized:', user); // Debugging log
            if (!user) {
                window.location.href = "/"; // Redirect to login page if not logged in
            }
        });

            netlifyIdentity.on("init", user => {
        if (!user) {
            window.location.href = "/";
        } else {
            fetchWriterData(user);
        }
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

        let activeFilters = {
            sports: [],
            locations: []
        };

        let scheduleFilters = { sports: [], locations: [] };
        let availableFilters = { sports: [], locations: [] };

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

        async function fetchScheduledGames(writerId, filters = { sports: [], locations: [] }) {
            // Ensure the writerId is being passed correctly
            if (!writerId) {
                console.log("Writer ID is missing!");
                return;  // Exit if writerId is missing
            }
            
            const response = await fetch("/.netlify/functions/editor-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ writerId, filters }) 
            });

            if (!response.ok) {
                console.log("Failed to fetch scheduled games. Status:", response.status);
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
                let date = new Date(game.date);
                date = date.toLocaleDateString('en-US', {
                timeZone: 'UTC',  
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                });
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
                <img class = "washington-icon" src = "./schools/Washington.webp" alt = "UW">
                <div class = "where">${where}</div>
                <img class="opp-icon" src="./schools/${opp}.webp" alt="${opp}">
                <div class = "recap-container">
                    <div class="${recap_css}"></div>
                    <p class="recap-location">${location}</p>
                </div>
                <div class = "when-container>
                    <div class = "date">${date}</div>
                    <div class = "time">${time}</div>
                </div>
                <div class = "writer">${name}</div>
                <div class = "option-container"> 
                    <button class = "submit"></div>  
                    <button class = "remove" data-game-id = "${gameId}"></div>
                </div>    
            `;

            container.appendChild(gameBox);

                const removeButton = gameBox.querySelector(".remove");
                removeButton.addEventListener("click", async (e) => {
                    const gameId = e.target.getAttribute("data-game-id");
                    await remove(gameId);
                    fetchScheduledGames(currWriter.writer_id, { sports: [], locations: [] });
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
                let date = new Date(game.date);
                date = date.toLocaleDateString('en-US', {
                timeZone: 'UTC',  
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                });
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
                <img class = "washington-icon" src = "./schools/Washington.webp" alt = "UW">
                <div class = "where">${where}</div>
                <img class="opp-icon" src="./schools/${opp}.webp" alt="${opp}">
                <div class = "recap-container">
                    <div class="${recap_css}"></div>
                    <p class="recap-location">${location}</p>
                </div>
                <div class = "date">${date}</div>
                <div class = "time">${time}</div>
                <button class = "add" data-game-id = "${gameId}"></div>
            `;

            container.appendChild(gameBox);

                const addButton = gameBox.querySelector(".add");
                addButton.addEventListener("click", async (e) => {
                    const gameId = e.target.getAttribute("data-game-id");
                    await signup(gameId, currWriter.writer_id);
                });
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

    document.getElementById("logout").onclick = function () {
        console.log("Attempting to log out...");

        // Logout from Netlify Identity
        netlifyIdentity.logout();

        // Clear localStorage and cookies (force logout)
        localStorage.removeItem("netlify_identity"); // Clear Netlify Identity session from localStorage
        document.cookie = "netlify_identity=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC"; // Expire the session cookie


        // After logout, redirect to the login page
        window.location.reload();
    };

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

            if(tabId == "scheduled-games") {
                const filterContainer = document.getElementById("scheduled-games-filter-container");

                // Only create filters once
                if (!filterContainer.hasChildNodes()) {
                    createGamesFilter("scheduled-games-filter-container", filters => {
                        scheduleFilters = filters;
                        fetchScheduledGames(currWriter.writer_id, scheduleFilters);
                    });
                }

                // Fetch all games initially
                fetchScheduledGames(currWriter.writer_id, scheduleFilters); 
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

        }

        window.onload = async function() {
            const user = netlifyIdentity.currentUser();
            if (!user) return;

            await fetchWriterData(user); // wait until currWriter is ready

            const scheduledTabId = "scheduled-games";
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
            const filterContainer = document.getElementById("scheduled-games-filter-container");
            if (!filterContainer.hasChildNodes()) {
                createGamesFilter("scheduled-games-filter-container", filters => {
                    fetchScheduledGames(currWriter.writer_id, filters);
                });
            }

            // Fetch games now that currWriter is ready
            await fetchScheduledGames(currWriter.writer_id, { sports: [], locations: [] });
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
