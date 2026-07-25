const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { sportId, writerId } = JSON.parse(event.body); 
        
        // Step 1: Add the game to the Assignments table
        const assignmentQuery = `INSERT INTO "Assignments" (game_id, writer_id)
                                SELECT game_id, $2
                                FROM "Games"
                                WHERE sport_id = $1
                                AND date >= CURRENT_DATE
                                ON CONFLICT (game_id, writer_id) DO NOTHING;`
        const result = await client.query(assignmentQuery [sportId, writerId]);

        const addGameWriterInfo = `
            `

        // Step 2: Update the available column in the Games table
        const updateGameQuery = `
                                UPDATE "Games"
                                SET available = FALSE
                                WHERE sport_id = $1
                                AND date >= CURRENT_DATE
                                RETURNING *;
        `;
        await client.query(updateGameQuery, [sportId]);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Beat Assigned!" }),
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