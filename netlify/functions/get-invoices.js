const { Client } = require("pg");

exports.handler = async (event) => {
  try {
    const { writerId } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    // Base query
    let query = `SELECT * FROM "Invoices" WHERE writer_id = $1 ORDER BY date DESC`;

    const invoices = await client.query(query, [writerId]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ invoices: invoices.rows }),
    };
  } catch (err) {
    console.error("Error fetching invoices:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};