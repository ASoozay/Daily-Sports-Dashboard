const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    const now = new Date();

    // subtract 1 day (in milliseconds)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const formattedYesterday = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    console.log(formattedYesterday); // 

    // Base query
    let query = `SELECT * FROM "Assignments"
    JOIN "Games" ON "Games".game_id = "Assignments".game_id
    JOIN "Writers" ON "Writers".writer_id = "Assignments".writer_id
    WHERE "Games".date = $1 
    AND ("Games".location = 'Seattle, Wash.' OR "Games".location = 'Seattle, Wash')`;

    const todaysGames = await client.query(query, [formattedYesterday]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ games: todaysGames.rows }),
    };
  } catch (err) {
    console.error("Error fetching games:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};