console.log("Invite function hit");

exports.handler = async (event) => {
    console.log("RAW BODY:", event.body);
    console.log("TYPE:", typeof event.body);

    const { first_name, last_name, email } = JSON.parse(event.body);
    console.log("Received data:", { first_name, last_name, email });

    const NETLIFY_TOKEN = process.env.NETLIFY_ADMIN_TOKEN;
    const SITE_ID = process.env.SITE_ID;

    console.log("NETLIFY_TOKEN:", NETLIFY_TOKEN);
    console.log("SITE_ID:", SITE_ID);

    if (!NETLIFY_TOKEN || !SITE_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Missing env vars" })
        };
    }

    try {
        const response = await fetch(
            `https://api.netlify.com/api/v1/sites/${SITE_ID}/invites`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${NETLIFY_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    role: "member", 
                    metadata: {
                        full_name: `${first_name} ${last_name}`,
                        role: "Writer"   
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: data.message })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};