const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const writerId = body.writerId;
    const { filters = {} } = body.filters;
    const { sports = [], locations = [] } = filters;

    console.log("Request body:", body);

    if (!writerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "writerId missing" }),
      };
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    let query = `SELECT * FROM "Assignments" WHERE date >= CURRENT_DATE AND writer_id = $1`;
    let values = [writerId];

    if (sports.length > 0) {
      values.push(sports);
      query += ` AND sport = ANY($${values.length})`;
    }

    if (locations.length === 1) {
      if (locations[0] === "Home") {
        query += ` AND location = 'Seattle, Wash.'`;
      } else if (locations[0] === "Away") {
        query += ` AND location != 'Seattle, Wash.'`;
      }
    }

    query += ` ORDER BY date, time`;

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