import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const config = {
  schedule: "0 7 * * *",
  timezone: "America/Los_Angeles"
};

async function sendEmail(game) {
  const msg = {
    to: game.email,
    from: "sports@dailyuw.com",
    subject: `Game Today: ${game.sport} vs ${game.opponent}`,
    text: `Reminder: You are covering ${game.sport} vs ${game.opponent} today at ${game.time}.`,
  };

  await sgMail.send(msg);
}

export default async function handler() {
    const response = await fetch("https://uwdailysports.netlify.app/.netlify/functions/get-home-games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

  const { games } = await response.json();

  for (const game of games) {
    if (!game.email) continue;
    console.log("SENDING EMAIL TO:", game.email);
    await sendEmail(game);
  }

}