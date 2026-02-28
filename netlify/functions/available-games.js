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

    const availableGames = await client.query(
      'SELECT * FROM "Games" WHERE TO_DATE(date, "MM/DD/YYYY") >= CURRENT_DATE AND available = TRUE ORDER BY date, time'
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ games: availableGames.rows })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};