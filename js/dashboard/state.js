const state = {

    school: null,

    currWriter: null,

    currGame: null,
    
    currTab: null,

    filters: {
        active: { sports: [], locations: [], months: [] },
        myGames: { sports: [], locations: [] },
        availableGames: { sports: [], locations: [] },
        historyGames: { sports: [], locations: [], months: [] },
        allGames: { sports: [], locations: [], months: [] }
    },

    cache: {
        games: {
            myGames: null,
            availableGames: null,
            historyGames: null,
            allGames: null

        },

        settings: {
            games: null,
            writers: null,
            sports: null
        }
    }
};

async function fetchUserSchoolInfo() {
    const userSchoolResponse = await fetch("/.netlify/functions/get-user-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ }) 
    }); 

    const userSchooldata = await userSchoolResponse.json();
    const userSchool = userSchooldata.userSchoolInfo.rows[0];

    state.school = userSchool;

    document.documentElement.style.setProperty(
        "--primary_color",
        state.school.color_1
    ); 

    document.documentElement.style.setProperty(
        "--secondary_color",
        state.school.color_2
    );
}
