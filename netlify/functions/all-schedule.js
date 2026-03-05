const { Client } = require("pg");

exports.handler = async function(event, context) {
  console.log("Received request:", event.httpMethod, "body:", event.body);

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing request body" })
    };
  }

  let writerId, filters;
  try {
    ({ writerId, filters } = JSON.parse(event.body));
  } catch (err) {
    console.error("Invalid JSON:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" })
    };
  }

  if (!writerId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing writerId" })
    };
  }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    let query = `SELECT * FROM "Assignments" 
                JOIN "Games" ON "Games".game_id = "Assignments".game_id
                JOIN "Writers" ON "Writers".writer_id = "Assignments".writer_id 
                WHERE date >= CURRENT_DATE`;

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