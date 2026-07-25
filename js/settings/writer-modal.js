/* All Functions relating to the Writers Setting Option */


// Function: openWritersModal
// Purpose: Opens the modal for writer info 
// Returns: None
// Parameters: None
// #region openWritersModal() //

async function openWritersModal() {
    await fetchWriterInfo();

    document.getElementById("writers-modal").style.display = "flex"; 
};

const writersModal = document.getElementById("writers-modal");

document.addEventListener("click", () => {
    document.querySelectorAll(".list-options").forEach(options => {
        options.style.display = "none";
    });
});
// #endregion //


// Function: fetchWriterInfo
// Purpose: Fecthes writer information from DB and inserts info into modal
// Returns: None
// Parameters: None
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region fecthWriterInfo() //

async function fetchWriterInfo() {
    let writers;

    if(state.cache.settings.writers != null){
        writers = state.cache.settings.writers;
    } else {
        const response = await fetch("/.netlify/functions/get-writer-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        if(!response.ok) {
            console.log("Failed to fetch writer info:", response.status);
            return;
        }

        const data = await response.json();
        writers = data.writers;
    }

    const container = document.getElementById("writer-table-container");

    writers.forEach(writer => {
        const first_name = writer.first_name;
        const last_name = writer.last_name;
        const position = writer.position;
        const email = writer.email;

        let phone = writer.phone;
        if(phone === null) {
            phone = "";
        }

        let x = writer.x;
        let x_short = "";
        if(x === null) {
            x = "";
        } else {
            x_short = x.replace("https://x.com/", "@");
        }
            
        let headshot = writer.headshot;
        if(headshot === null){
            headshot = "";
        }

        let hire_date = writer.hire_date;
        let hire_date_formatted = ""; 
        if(hire_date === null) {
            hire_date_formatted = "NA";
        } else {
            hire_date_formatted = new Date(hire_date).toLocaleDateString("en-US");
        }

        let end_date = writer.end_date;
        let end_date_formatted = "";
        if(end_date === null) {
            end_date_formatted = "Current";
        } else {
            end_date_formatted = new Date(end_date).toLocaleDateString("en-US");
        }

        const writerBox = document.createElement("div");
        writerBox.classList.add("writer-table-entry");

        writerBox.innerHTML = `
        <div class = "writer-table-entry-section writer-table-first-name">${first_name}</div>
        <div class = "writer-table-entry-section writer-table-last-name">${last_name}</div>
        <div class = "writer-table-entry-section writer-table-position">${position}</div>
        <div class = "writer-table-entry-section writer-table-email">${email}</div>      
        <div class = "writer-table-entry-section writer-table-phone">${phone}</div>
        ${x
            ? `<a class = "writer-table-entry-section writer-table-x" href="${x}" target="_blank">${x_short}</a>`
            : `<div class = "writer-table-entry-section writer-table-x"></div>`
        }
        ${headshot
            ? `<a class = "writer-table-entry-section writer-table-headshot" href="${headshot}" target="_blank">Link</a>`
            : `<div class = "writer-table-entry-section writer-table-headshot"></div>`
        }
        <div class = "writer-table-entry-section writer-table-hire-date">${hire_date_formatted}</div>
        <div class = "writer-table-entry-section writer-table-end-date">${end_date_formatted}</div>
        <div class = "writer-table-entry-section writer-table-options list-options-button">&hellip;
            <div class="list-options">
                <div class = "list-option edit-writer-option">Edit</div>
                <div class = "list-option delete-writer-option">Delete</div>
            </div>
        </div>
        `;

        writerBox.querySelector(".edit-writer-option").addEventListener("click", () => openEditWriterModal(writer)); 
        writerBox.querySelector(".delete-writer-option").addEventListener("click", () => deleteWriter(writer.writer_id));

        const optionsBtn = writerBox.querySelector(".list-options-button");
        const options = writerBox.querySelector(".list-options");

        if (!optionsBtn) console.log("button not found");
        if (!options) console.log("menu not found");

        options.addEventListener("click", e => e.stopPropagation());

        optionsBtn.addEventListener("click", (e) => {
            console.log("clicked");
            e.stopPropagation();

            document.querySelectorAll(".list-options").forEach(m => {
                if (m !== options) m.style.display = "none";
            });

            options.style.display =
                options.style.display === "flex" ? "none" : "flex";
        });

        container.append(writerBox);    

    });

    const searchWriterInput = document.getElementById("search-writers-input");

    searchWriterInput.oninput = () => {
        const term = searchWriterInput.value.toLowerCase();

        document.querySelectorAll(".writer-table-entry").forEach(writer => {
            writer.style.display =
                writer.textContent.toLowerCase().includes(term)
                    ? "flex"
                    : "none";
        });
    };
}
// #endregion //


// Function: addWriterModal
// Purpose: Opens the modal for adding a writer
// Returns: None
// Parameters: None
// #region addWriterModal() //

async function openAddWriterModal() {
    document.getElementById("add-writer-modal").style.display = "flex";
}    

const addWriterModal = document.getElementById("add-writer-modal");

document.getElementById("add-writer-confirm").onclick = async () => {
    const first_name = document.getElementById("new-writer-first-name").value;
    const last_name = document.getElementById("new-writer-last-name").value;
    const position = document.getElementById("new-writer-position").value;
    const email = document.getElementById("new-writer-email").value;
    const phone = document.getElementById("new-writer-phone").value || "";
    const x  = document.getElementById("new-writer-x").value || "";
    const headshot = document.getElementById("new-writer-headshot").value || "";
    const hire_date = document.getElementById("new-writer-hire-date").value || null;

    if(!first_name || !last_name || !position || !email) {
        alert("Please fill in all required fields");
        return;
    } ``

    await addWriter(first_name, last_name, position,email, phone, x, headshot, hire_date);
    state.cache.settings.writers = null;

    addWriterModal.style.display = "none";

    await fetchWriterInfo();
};

// #endregion //


// Function: addWriter
// Purpose: Adds a new writer to the DB
// Returns: None
// Parameters: (1) first_name: writer's first name
//             (2) last_name: writer's last name
//             (3) position: writer's position
//             (4) email: writer's email
//             (5) phone: writer's phone number
//             (6) hire_date: date that writer is hired
//             (7) x: link to writer's X account
//             (8) headshot: link to writer's headshot
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region addWriter() //

async function addWriter(first_name, last_name, position, email, phone, x, headshot, hire_date) {
    try {
        const response = await fetch("/.netlify/functions/add-writer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ first_name, last_name, position, email, phone, x, headshot, hire_date })
        });

        const text = await response.text();

        console.log("NETLIFY RAW RESPONSE:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }

        if (data.success) {
            showToast("New writer successfully added!", "success");
        } else {
            showToast("Failed to add new writer", "error");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error adding new writer.");
    }
}

// #endregion


// Function: openeditWriterModal
// Purpose: Opens the modal for editing a writer's info
// Returns: None
// Parameters: (1) writer: writer object to get/edit info for
// errors: (1) statusCode 500 if error sending edited info to DB
// #region openEditWriterModal() //

async function openEditWriterModal(writer) {
    const editWriterModal = document.getElementById("edit-writer-modal");

    document.getElementById("edit-writer-first-name").value = writer.first_name || "";
    document.getElementById("edit-writer-last-name").value = writer.last_name || "";
    document.getElementById("edit-writer-position").value = writer.position || "";
    document.getElementById("edit-writer-email").value = writer.email || "";
    document.getElementById("edit-writer-phone").value = writer.phone || "";
    document.getElementById("edit-writer-x").value = writer.x || "";
    document.getElementById("edit-writer-headshot").value = writer.headshot || "";
    document.getElementById("edit-writer-hire-date").value = writer.hire_date ? writer.hire_date.slice(0, 10) : "";
    document.getElementById("edit-writer-end-date").value = writer.end_date ? writer.end_date.slice(0, 10) : "";

    editWriterModal.style.display = "flex";

    document.getElementById("edit-writer-confirm").onclick = async () => {
        const first_name = document.getElementById("edit-writer-first-name").value;
        const last_name = document.getElementById("edit-writer-last-name").value;
        const position = document.getElementById("edit-writer-position").value;
        const email = document.getElementById("edit-writer-email").value;
        const phone = document.getElementById("edit-writer-phone").value || null;
        const x = document.getElementById("edit-writer-x").value || null;
        const headshot = document.getElementById("edit-writer-headshot").value || null;
        const hire_date = document.getElementById("edit-writer-hire-date").value || null;
        const end_date = document.getElementById("edit-writer-end-date").value || null;

        if(position === "SP"){
            alert("Please select a valid position");
            return;
        }

        if (!first_name || !last_name || !position || !email) {
            alert("Please fill in all required fields");
            return;
        }

        await editWriter(writer.writer_id, first_name, last_name, position, email, phone, x, headshot, hire_date, end_date);

        editWriterModal.style.display = "none";

        await fetchWriterInfo();
    };
}

// #endregion //


// Function: editWriter
// Purpose: edits the info for an existing writer in the DB
// Returns: None
// Parameters: (1) writer_id: id for the writer (not edited)
//             (2) first_name: new first name for the writer
//             (3) last_name: new last_name for the writer
//             (4) position: new position for the writer
//             (5) email: new email for the writer
//             (6) phone: new phone number for the writer
//             (7) x: new link to X account for the writer
//             (8) headshot: new link to headshot for the writer
//             (9) hire_date: new hire date for the writer
//             (10) end_date: end date for the writer (Automatically set to "Current" if left blank)
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query
// #region editWriter() //

 async function editWriter(writer_id, first_name, last_name, position, email, phone, x, headshot, hire_date, end_date) {
    try {
        const response = await fetch("/.netlify/functions/edit-writer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ writer_id, first_name, last_name, position, email, phone, x, headshot, hire_date, end_date })
        });

        const text = await response.text();

        console.log("NETLIFY RAW RESPONSE:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }

        if (data.success) {
            showToast("Writer successfully edited!", "success");
        } else {
            showToast("Failed to edit writer", "error");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error editing writer.");
    }   
}
// #endregion //


// Function: deleteWriter
// Purpose: deletes chosen writer from the DB
// Returns: None
// Parameters: (1) writer_id: id of writer to be deleted
// errors: (1) error if DB URL not set
//         (2) statusCode 500 if error in DB query 
// #region deleteWriter() //
 async function deleteWriter(writer_id) {
    if (!confirm("Are you sure you want to delete this writer?")) return;

    try {
        const response = await fetch("/.netlify/functions/delete-writer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ writer_id })
        });

        const text = await response.text();

        console.log("NETLIFY RAW RESPONSE:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }

        if (data.success) {
            showToast("Writer successfully deleted!", "success");
        } else {
            showToast("Failed to delete writer", "error");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error deleting writer.");
    }    
 }
// #endregion //























// end of functions //
