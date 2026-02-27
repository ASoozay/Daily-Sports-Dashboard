const { Client } = require("pg");

exports.handler = async function(event) {
  const payload = JSON.parse(event.body);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      "INSERT INTO users (id, email) VALUES ($1, $2)",
      [payload.user.id, payload.user.email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: "User synced"
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: error.message
    };
  }
};