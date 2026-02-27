const { Client } = require("pg");

exports.handler = async function(event) {
    try {
        const body = JSON.parse(event.body);
        const email = body.email;

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing email" }) };
        }

        console.log("Fetching writer data for:", email); // <-- Log email

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        const writerResult = await client.query(
            'SELECT * FROM "Writers" WHERE email = $1',
            [email]
        );
        await client.end();

        console.log("Query result:", writerResult.rows); // <-- Log query result

        return {
            statusCode: 200,
            body: JSON.stringify({ writer: writerResult.rows[0] })
        };
    } catch (err) {
        console.error("Function error:", err); // <-- Log the full error
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};