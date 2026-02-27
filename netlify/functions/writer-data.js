const { Client } = require("pg");
const jwt = require("jsonwebtoken");

exports.handler = async function(event) {

  // Extract token from header
  const token = event.headers.authorization?.split(" ")[1];
  if (!token) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.NETLIFY_JWT_SECRET);
  } catch (err) {
    return { statusCode: 401, body: "Invalid token" };
  }

  const email = decoded.email;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Query Writers table
    const writerResult = await client.query(
      "SELECT * FROM Writers WHERE email = $1",
      [email]
    );

    // Query second table (example: assignments)
    /*const assignmentResult = await client.query(
      "SELECT * FROM Assignments WHERE writer_email = $1",
      [email]
    );*/

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        writer: writerResult.rows[0],
        /*assignments: assignmentResult.rows8*/
      })
    };

  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};