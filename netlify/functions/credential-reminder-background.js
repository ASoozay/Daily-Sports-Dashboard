console.log("FILE LOADED");

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const config = {
  schedule: "0 11 * * *",
  timezone: "America/Los_Angeles"
};

async function sendEmail(game) {
  const msg = {
    to: "sports@dailyuw.com",
    from: "sports@dailyuw.com",
    subject: `Credential Reminder: ${game.first_name} ${game.last_name} for ${game.sport} vs ${game.opponent}`,
    text: `Reminder: Please submit a credential for ${game.first_name} ${game.last_name} ${game.sport} vs ${game.opponent} tomorrow at ${game.time}.`,
  };

  await sgMail.send(msg);
}

export async function handler() {
  // 1. Get today's games
  const response = await fetch("https://uwdailysports.netlify.app/.netlify/functions/get-home-games", {
    method: "POST",
    body: JSON.stringify({}) // send empty object
  });

  const { games } = await response.json();

  for (const game of games) {
    if (!game.email) continue;
    await sendEmail(game);
  }

  return {
    statusCode: 200,
    body: "Reminders sent"
  };
}