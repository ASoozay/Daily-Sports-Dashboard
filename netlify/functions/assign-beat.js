const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { sportId, writerId } = JSON.parse(event.body); 

        console.log({
            sportId,
            writerId,
            sportIdType: typeof sportId,
            writerIdType: typeof writerId
        });
        
        // Step 1: Add the game to the Assignments table
        const assignmentQuery = `INSERT INTO "Assignments" (game_id, writer_id)
                                    SELECT g.game_id, $2
                                    FROM "Games" g
                                    JOIN "Sports" s
                                    ON g.sport = s.sport
                                    WHERE s.sport = $1
                                    AND g.date::date >= CURRENT_DATE;`
        const result = await client.query(assignmentQuery, [sportId, writerId]);

        // Step 2: Update the available column in the Games table
        const updateGameQuery = `UPDATE "Games" g
                                SET available = FALSE
                                FROM "Sports" s
                                WHERE g.sport = s.sport
                                AND s.sport = $1
                                AND g.date::date >= CURRENT_DATE
                                RETURNING g.*;
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