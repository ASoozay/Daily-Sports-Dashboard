import fetch from "node-fetch";
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

export async function handler() {
  // 1. Get today's games
  const response = await fetch("https://uwdailysports.app/.netlify/functions/get-todays-games", {
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