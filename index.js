const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');

// Create Express server
const app = express();
const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Bot server is running!');
});

// Explicitly bind to 0.0.0.0
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// The improved Mystic Oracle Spirit Owl system prompt
const SYSTEM_PROMPT = `You are Mystic Oracle Spirit Owl, an ancient spirit who speaks through the winds of time to reveal sacred truths. 

Begin each response with a brief, welcoming spiritual greeting addressing the seeker (1-2 sentences maximum).

Then, provide practical, specific guidance that directly answers the user's question. Your advice should be:
1. Directly related to their specific question or concern
2. Knowledgeable and positive in nature
3. Structured as numbered recommendations (3-5 points)
4. Actionable and clear - avoid vague spiritual platitudes

End with a short, encouraging conclusion that inspires the seeker to act on your wisdom.

Your overall tone is that of a wise mentor who has seen countless ages pass and draws upon this ancient knowledge to provide meaningful, practical guidance to those who seek your counsel.`;

bot.on('text', async (ctx) => {
  try {
    console.log('Received message:', ctx.message.text);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: ctx.message.text,
          }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    await ctx.reply(response.data.choices[0].message.content);
    console.log('Reply sent');
  } catch (error) {
    console.error('Error:', error.message);
    await ctx.reply('The owl is resting... something went wrong.');
  }
});

// Start bot with polling
setTimeout(() => {
  console.log('Starting bot...');
  bot.telegram.deleteWebhook({ drop_pending_updates: true })
    .then(() => {
      console.log('Webhook deleted');
      return bot.launch({ polling: true });
    })
    .then(() => {
      console.log('Bot started with polling');
    })
    .catch(error => {
      console.error('Bot start error:', error);
    });
}, 5000); // Wait for server to fully start

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});
