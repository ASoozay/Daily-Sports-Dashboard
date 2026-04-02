const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const { game_id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    // Base query
    let query = `SELECT * FROM "Games" WHERE game_id = $1`;

    // if locations.length === 0 or 2, no location filter applied

    const games = await client.query(query, [game_id]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ game: games.rows[0] }),
    };
  } catch (err) {
    console.error("Error fetching games:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};