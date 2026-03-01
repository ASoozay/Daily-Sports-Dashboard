const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { gameId, writerId } = JSON.parse(event.body); // Get the game ID from the request body
        
        // Step 1: Add the game to the Assignments table
        const insertAssignmentQuery = `
            INSERT INTO "Assignments" (game_id, writer_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await client.query(insertAssignmentQuery, [gameId, writerId]);

        const addGameWriterInfo = `
            `

        // Step 2: Update the available column in the Games table
        const updateGameQuery = `
            UPDATE "Games"
            SET available = FALSE
            WHERE game_id = $1
            RETURNING *;
        `;
        await client.query(updateGameQuery, [gameId]);

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