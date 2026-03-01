const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
    });

    await client.connect();

    const {writerId} = JSON.parse(event.body);

    const query = `SELECT * 
                    FROM "Assignments"
                    JOIN "Games" ON "Games".game_id = "Assignments".game_id 
                    WHERE "Assignments".writer_id = $1  
                    ORDER BY date, time`;
    console.log("Query: ", query); // Log the query to confirm it's correct

    const scheduledGames = await client.query(query, [writerId]);
    console.log("Available games:", scheduledGames.rows); // Log the result

    return {
    statusCode: 200,
    body: JSON.stringify({ games: scheduledGames.rows }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};