console.log("Add writer function hit");

const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false },
    });

    await client.connect();

    try {
        const { first_name, last_name, email, phone, hire_date, x, headshot } = JSON.parse(event.body);

        const insertWriterQuery = `
            INSERT INTO "Writers" (first_name, last_name, position, email, phone, hire_date, x, headshot, end_date)
            VALUES ($1, $2, 'Writer', $4, $5, $6, $7, $8, NULL)
            RETURNING *;
        `;
        const result = await client.query(insertWriterQuery, [first_name, last_name, email, phone, hire_date, x, headshot]);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Writer added successfully!" }),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: "Error adding writer." }),
        };
    } finally {
        await client.end();
    }
}
        
