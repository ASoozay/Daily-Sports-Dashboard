const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const writerId = body.writerId;
    const { filters = {} } = body;
    const { sports = [], locations = [], months = [] } = filters;

    console.log("Request body:", body);

    if (!writerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "writerId missing" }),
      };
    }

    const now = new Date();

    const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    let query = `SELECT * FROM "Assignments" 
                JOIN "Games" ON "Games".game_id = "Assignments".game_id 
                WHERE writer_id = $1
                AND date < $2`;
    let values = [writerId, today];

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

    if (months.length > 0) {
        values.push(months);
        query += ` AND SUBSTRING(date, 6, 2) = ANY($${values.length})`;
    }
    query += ` ORDER BY SUBSTRING(date, 1, 4) DESC, SUBSTRING(date, 6, 2) DESC, SUBSTRING(date, 9, 2) DESC, time`;

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
