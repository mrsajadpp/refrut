const axios = require('axios');

class DiscordErrorLogger {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async logError(error) {
    try {
      const errorData = {
        content: null,
        embeds: [{
          title: 'Server Error',
          color: 15158332, 
          fields: [
            {
              name: 'Error Message',
              value: error.message || 'No error message available'
            },
            {
              name: 'Stack Trace',
              value: error.stack ? `\`\`\`${error.stack.slice(0, 1000)}\`\`\`` : 'No stack trace available'
            },
            {
              name: 'Timestamp',
              value: new Date().toISOString()
            },
            {
                name: 'Admin',
                value: '<@895652387782549574>'
              }
          ]
        }]
      };

      await axios.post(this.webhookUrl, errorData);
      
    } catch (err) {
      console.error('Failed to send error to Discord:', err);
    }
  }
}

const logger = new DiscordErrorLogger(process.env.DISCORD_WEBHOOK_URL);

module.exports = logger;