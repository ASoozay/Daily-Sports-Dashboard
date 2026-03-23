const { Client } = require("pg");

exports.handler = async (event) => {
  try {

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    const now = new Date();
    const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); 
    // 'YYYY-MM-DD'

    // Base query
    let query = `SELECT * FROM "Assignments" 
                JOIN "Games" ON "Games".game_id = "Assignments".game_id
                JOIN "Writers" ON "Writers".writer_id = "Assignments".writer_id
                WHERE "Games".date = $1`;

    const todaysGames = await client.query(query, [today]);

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