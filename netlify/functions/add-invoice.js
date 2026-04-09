const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { writerId, date, total, link } = JSON.parse(event.body); 
        
        const query = `
            INSERT INTO "Invoices" (writer_id, date, total, link)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await client.query(query, [writerId, date, total, link]);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Invoice added successfully!" }),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: "Error processing the request." }),
        };
    } finally {
        await client.end();
    }
}