const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    try {
        console.log("Attempting to connect to the database...");

        // Attempt to connect to the database
        await client.connect();
        console.log("Database connection successful");

        // Log the incoming request body to ensure writerId is being passed correctly
        const { writerId } = JSON.parse(event.body);
        console.log("Parsed writerId: ", writerId);  // Check if writerId is correct

        if (!writerId) {
            console.log("Error: writerId not found in the request body");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "writerId is required" }),
            };
        }

        // The query to fetch scheduled games for the writer
        const query = `
            SELECT * 
            FROM "Assignments"
            JOIN "Games" ON "Games".game_id = "Assignments".game_id
            WHERE "Assignments".writer_id = $1
            ORDER BY date, time;
        `;
        
        console.log("Query: ", query);  // Log the query to confirm it's correct

        // Execute the query
        const scheduledGames = await client.query(query, [writerId]);
        console.log("Scheduled games: ", scheduledGames.rows); // Log the result

        return {
            statusCode: 200,
            body: JSON.stringify({ games: scheduledGames.rows }),  // Return games in response
        };
    } catch (err) {
        // Log the error for debugging
        console.error("Error: ", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    } finally {
        // Ensure client.disconnect() happens even in case of an error
        await client.end();
    }
};