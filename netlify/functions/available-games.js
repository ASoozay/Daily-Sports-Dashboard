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

    const query = `SELECT * FROM "Games" WHERE available = TRUE ORDER BY date, time`;
    console.log("Query: ", query); // Log the query to confirm it's correct

    const availableGames = await client.query(query);
    console.log("Available games:", availableGames.rows); // Log the result

    return {
    statusCode: 200,
    body: JSON.stringify({ games: availableGames.rows }),
    };

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