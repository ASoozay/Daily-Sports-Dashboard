const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { gameId } = JSON.parse(event.body); // Get the game ID from the request body
        
        // Step 2: Update the available column in the Games table
        const updateGameQuery = `
            UPDATE "Games"
            SET available = TRUE
            WHERE game_id = $1
            RETURNING *;
        `;
        await client.query(updateGameQuery, [gameId]);

        const removeAssignedQuery = `
        DELETE 
        FROM "Assignments"
        WHERE game_id = $1`;
        await client.query(removeAssignedQuery, [gameId]);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Game added to assignments!" }),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: "Error processing the request." }),
        };
    } finally {
        await client.end();
    }
}