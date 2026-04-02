const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { gameId } = JSON.parse(event.body); // Get the game ID from the request body

        const delAssQuery = `
            DELETE 
            FROM "Assignments"
            WHERE game_id = $1`;
        await client.query(delAssQuery, [gameId]);  

        const query = `
            DELETE 
            FROM "Games"
            WHERE game_id = $1`;
        await client.query(query, [gameId]);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Game removed from assignments!" }),
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