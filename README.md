# Cloudflare Notify Proxy

A complete, secure, and blazing-fast proxy service for sending notifications and messages from your applications to platforms like Telegram using **Cloudflare Workers**.

This service acts as an intermediary. It allows you to securely publish messages using only a custom API Key, ensuring that your sensitive bot tokens are never exposed in your application's source code or on unsecured servers.

## Features

- 🚀 **Blazing Fast**: Runs on Cloudflare's Edge Network for instant delivery worldwide.
- 🔒 **Secure**: Authenticated via a strong, randomly generated API Key (Bearer Token).
- 🔌 **Extensible**: Designed to easily support other platforms (Discord, Slack, etc.) in the future.
- 📱 **Flexible Formatting**: Supports both simple text messages and structured, formatted crash reports.

---

## Step-by-Step Guide

This guide will walk you through every step required to get this project up and running from scratch.

### Step 1: Create a Telegram Bot and Get Your Chat ID

Before deploying the code, you need a Telegram bot that will actually send the messages.

1. **Create the Bot**:
   - Open Telegram and search for **[@BotFather](https://t.me/botfather)**.
   - Send the `/newbot` command.
   - Follow the instructions to give your bot a name and a unique username (ending in `bot`).
   - BotFather will give you a **Bot Token** (e.g., `123456789:ABCDEF...`). **Keep this token secret!**

2. **Get Your Chat ID**:
   - You need to tell the bot *where* to send the messages. This can be your personal chat, a group, or a channel.
   - For a personal chat, search for **[@userinfobot](https://t.me/userinfobot)** in Telegram and click Start. It will reply with your numeric `Id` (e.g., `123456789`).
   - For a group/channel, add your newly created bot to the group/channel as an admin. Then send a test message in the group. You can use a bot like `@RawDataBot` in the group to find the group's ID (group IDs usually start with a minus sign, e.g., `-100123456789`).

### Step 2: Local Project Setup

Now, let's prepare the code on your computer.

1. **Install Dependencies**:
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Generate a Secure API Key**:
   You need a strong, random API Key to secure your worker. We have a built-in script for this:
   ```bash
   npm run generate-key
   ```
   *Copy the 64-character output provided by this script. You will need it in the next steps.*

3. **Configure Local Environment Variables**:
   Create a local configuration file so you can test the worker on your own system without affecting production:
   ```bash
   cp .env.example .dev.vars
   ```
   Open the `.dev.vars` file in your code editor and fill in the values:
   - `API_SECRET_KEY`: Paste the key you generated in the previous step.
   - `TELEGRAM_BOT_TOKEN`: Paste the token you got from BotFather.
   - `TELEGRAM_DEFAULT_CHAT_ID`: Paste your Chat ID.

### Step 3: Test Locally (Optional)

Before putting it on the internet, you can test it on your computer.
```bash
npm run dev
```
The worker will start locally on port `8787` (e.g., `http://127.0.0.1:8787`). You can use the cURL commands in the **API Usage** section below to test it.

---

### Step 4: Connect to Cloudflare and Deploy

Once you are ready, it's time to put your worker on the Cloudflare Edge network.

1. **Login to Cloudflare**:
   Run the following command. It will open a tab in your web browser asking you to authorize Wrangler (the Cloudflare CLI) to access your Cloudflare account. Click "Allow".
   ```bash
   npx wrangler login
   ```

2. **Send Environment Variables (Secrets) to Cloudflare**:
   For security reasons, Cloudflare does not upload your local `.dev.vars` file. Instead, you must inject your secret variables directly into Cloudflare's encrypted vault. Run these three commands one by one. After running each command, the terminal will prompt you to type or paste the value.
   
   ```bash
   npx wrangler secret put API_SECRET_KEY
   ```
   *(Paste your generated API key and press Enter)*

   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   ```
   *(Paste your Telegram Bot Token and press Enter)*

   ```bash
   npx wrangler secret put TELEGRAM_DEFAULT_CHAT_ID
   ```
   *(Paste your Chat ID and press Enter)*

3. **Deploy the Worker**:
   Now that Cloudflare has your secrets, push your code:
   ```bash
   npm run deploy
   ```

Your service is now live! 🎉 Cloudflare will provide you with a URL that looks like `https://cloudflare-notify.<YOUR_USERNAME>.workers.dev`.

---

## API Usage

To send a message, make an HTTP POST request to your worker URL (e.g., `https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram`).

You **must** include the header `Authorization: Bearer YOUR_API_SECRET_KEY`.

### Example 1: Send a Simple Text Message

```bash
curl -X POST https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello! This is a test message from the Cloudflare Worker."
  }'
```

### Example 2: Send a Structured Report (Crash Report / Logs)

If you are sending logs or error reports, you can send a neatly aligned, table-like log message by passing a `fields` object instead of raw text:

```bash
curl -X POST https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Crash Report 🚨",
    "fields": {
      "Environment": "Production",
      "Error Code": 500,
      "Message": "Database connection timeout",
      "Module": "Auth Service"
    }
  }'
```

### Example 3: Send to a Specific Chat ID

By default, messages go to `TELEGRAM_DEFAULT_CHAT_ID`. If you want to send a specific message to a different user or group, just add `chat_id` to your JSON payload:

```bash
curl -X POST https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "-100987654321",
    "text": "This message goes to a different group!"
  }'
```
