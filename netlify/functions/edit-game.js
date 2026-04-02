const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { gameId, sport, opponent, date, time, location, notes } = JSON.parse(event.body); 

        const query = `
            UPDATE "Games"
            SET sport = $2, opponent = $3, date = $4, time = $5, location = $6, notes = $7
            WHERE game_id = $1
            RETURNING *;
        `;
        await client.query(query, [gameId, sport, opponent, date, time, location, notes]);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Game updated successfully!" }),
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