console.log("FILE LOADED");

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const config = {
  schedule: "0 17 * * *",
};

async function sendEmail(game) {
  const msg = {
    to: "sports@dailyuw.com",
    from: "sports@dailyuw.com",
    subject: `Credential Reminder: ${game.first_name} ${game.last_name} for ${game.sport} vs ${game.opponent}`,
    text: `Reminder: Please submit a credential request for tomorrow! 

    Name: ${game.first_name} ${game.last_name}
    Sport: ${game.sport} 
    SID: ${game.sid} 
    SID Email: ${game.sid_email}`,
  };

  await sgMail.send(msg);
}

export default async function handler() {
  // 1. Get today's games
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