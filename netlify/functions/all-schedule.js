const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { writerId, filters = {} } = body;
    const { sports = [], locations = [] } = filters;

    console.log("Request body:", body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    let query = `
      SELECT * FROM "Assignments"
      JOIN "Games" ON "Games".game_id = "Assignments".game_id
      JOIN "Writers" ON "Writers".writer_id = "Assignments".writer_id
      WHERE date >= CURRENT_DATE
    `;
    const values = [];

    // Sports filter
    if (sports.length > 0) {
      values.push(sports);
      query += ` AND "Games".sport = ANY($${values.length})`;
    }

    // Location filter
    if (locations.length === 1) {
      if (locations[0] === "Home") {
        query += ` AND "Games".location = 'Seattle, Wash.'`;
      } else if (locations[0] === "Away") {
        query += ` AND "Games".location != 'Seattle, Wash.'`;
      }
    }

    query += ` ORDER BY "Games".date, "Games".time`;

    console.log("Final query:", query);
    console.log("Values:", values);

    const result = await client.query(query, values);
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ games: result.rows }),
    };
  } catch (err) {
    console.error("Error fetching scheduled games:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};