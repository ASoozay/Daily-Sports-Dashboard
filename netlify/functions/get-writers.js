const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    console.log("Request body:", body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    let query = `SELECT * FROM "Writers"`; 


    console.log("Final query:", query);

    const result = await client.query(query);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ writers: result.rows }),
    };
  } catch (err) {
    console.error("Error fetching writers:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};