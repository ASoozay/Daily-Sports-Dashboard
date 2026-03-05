// /.netlify/functions/get-writers.js
const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    // Log the request for debugging
    console.log("Event:", event);

    // Make sure DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable not set");
    }

    // Create Postgres client
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { require: true, rejectUnauthorized: false }, // adjust if needed
    });

    await client.connect();
    console.log("Connected to DB");

    // Query all writers
    const query = `SELECT * FROM "Writers" ORDER BY first_name, last_name`;
    const result = await client.query(query);

    await client.end();
    console.log("DB connection closed");

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