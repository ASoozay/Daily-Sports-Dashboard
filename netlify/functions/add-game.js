const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { sport, opponent, date, time, location, notes } = JSON.parse(event.body); 
        
        // Step 1: Add the game to the Games table
        const insertGameQuery = `
            INSERT INTO "Games" (sport, opponent, date, time, location, notes, available)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING *;
        `;
        const result = await client.query(insertGameQuery, [sport, opponent, date, time, location, notes]);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Game added to available games!" }),
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