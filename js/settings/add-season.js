async function openAddSeasonModal() {
    const addSeasonModal = document.getElementById("add-season-modal");
    addSeasonModal.style.display = "flex";

} 

const dropZone = document.getElementById("season-drop-zone");
const fileInput = document.getElementById("season-file-input");

let selectedFile = null;

dropZone.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    showFileName();
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    selectedFile = e.dataTransfer.files[0];
    showFileName();
});

function showFileName() {
    if (selectedFile) {
        dropZone.innerHTML = `<p>${selectedFile.name}</p>`;
    }
}

document.getElementById("add-season-confirm").addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please upload a file");
        return;
    }

    const fileData = await selectedFile.arrayBuffer();

    const workbook = XLSX.read(fileData, {
        type: "array"
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {defval: ""});
    console.log(Object.keys(rows[0]));

    rows.forEach(row => {
        if (!row['Event']) {
            console.warn("Skipping bad row:", row);
            return;
        }
        let date = row['Start Date'];

        console.log(date);
        console.log(date.toString());
        console.log(date.toISOString());
        console.log(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

        if (!date) return;

        if (date instanceof Date) {
        }

        else if (typeof date === "number") {
            date = XLSX.SSF.parse_date_code(date);
            date = new Date(date.y, date.m - 1, date.d);
        }

        else if (typeof date === "string") {
            const [month, day, year] = date.split("/");
            date = new Date(year, month - 1, day);
        }

        if (date && !isNaN(date)) {
            const yyyy = date.getUTCFullYear();
            const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(date.getUTCDate().padStart(2, "0");

            row['Start Date'] = `${yyyy}-${mm}-${dd}`;
        }

        let time = row['Start Time'];
        if(time != "TBD" && time != "TBA" && time != "All Day"){
            time = time.replace(/(\d)(\s?)(am|pm)/i, "$1 $3");
        }

        row['Start Time'] = time;
    });

    console.log(rows);


    const response = await fetch("/.netlify/functions/upload-season", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(rows)
    });

    const data = await response.json();

    console.log(data);

    if (data.success) {
        showToast("Season data uploaded successfully!", "success");
    } else {
        showToast("Failed to upload season data", "error");
    }
});
