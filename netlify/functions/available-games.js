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

    const query =  `SELECT * FROM "Games" WHERE TO_DATE(date, 'FM9/FM9/FMMM') >= CURRENT_DATE AND available = TRUE ORDER BY date, time`;
    console.log("Query: ", query);

    const availableGames = await client.query(query);

    await client.end();

    console.log(availableGames.rows); // Log the returned rows to inspect the data.

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