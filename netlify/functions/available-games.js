const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { filters = {} } = body;   // default to empty object
    const { sports = [], locations = [] } = filters;  // default to empty arrays

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    // Base query
    let query = `SELECT * FROM "Games" WHERE date >= CURRENT_DATE AND available = TRUE`;
    let values = [];

    // Filter by sports if any
    if (sports.length > 0) {
      values.push(sports);
      query += ` AND sport = ANY($${values.length})`;  // $1, $2, etc.
    }

    // Filter by locations
    if (locations.length === 1) {
      if (locations[0] === "Home") {
        query += ` AND location = 'Seattle, Wash.'`;
      } else if (locations[0] === "Away") {
        query += ` AND location != 'Seattle, Wash.'`;
      }
    }
    // if locations.length === 0 or 2, no location filter applied

    // Ordering
    query += ` ORDER BY date, time`;

    console.log("Query:", query);
    console.log("Values:", values);

    const availableGames = await client.query(query, values);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ games: availableGames.rows }),
    };
  } catch (err) {
    console.error("Error fetching games:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};