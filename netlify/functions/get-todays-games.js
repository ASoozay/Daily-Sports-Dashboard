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
    const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); 
    // 'YYYY-MM-DD'

    // Base query
    let query = `SELECT * FROM "Assignments" WHERE date = $1`;

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