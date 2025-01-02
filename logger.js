const axios = require('axios');

class DiscordErrorLogger {
  constructor(webhookUrl) {
    if (!webhookUrl) {
      throw new Error('webhookUrl is undefined. Please set DISCORD_INVITE_WEBHOOK_URL.');
    }
    this.webhookUrl = webhookUrl;
    this.logError = this.logError.bind(this);
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

class DiscordInviteLogger {
  constructor(webhookUrl) {
    if (!webhookUrl) {
      throw new Error('webhookUrl is undefined. Please set DISCORD_INVITE_WEBHOOK_URL.');
    }
    this.webhookUrl = webhookUrl;
    this.logInvite = this.logInvite.bind(this);
  }

  async logInvite(inviterName, inviteeName) {
    try {
      const inviteData = {
        content: `${inviterName} has invited ${inviteeName} to join! 🎉`,
        embeds: [{
          title: 'Invitation Alert',
          color: 3066993,
          fields: [
            {
              name: 'Inviter',
              value: inviterName || 'Unknown'
            },
            {
              name: 'Invitee',
              value: inviteeName || 'Unknown'
            },
            {
              name: 'Timestamp',
              value: new Date().toISOString()
            }
          ]
        }]
      };

      await axios.post(this.webhookUrl, inviteData);
    } catch (err) {
      console.error('Failed to send invite to Discord:', err);
    }
  }
}

const inviteLogger = new DiscordInviteLogger(process.env.DISCORD_INVITE_WEBHOOK_URL);

const logger = new DiscordErrorLogger(process.env.DISCORD_WEBHOOK_URL);

module.exports = { logError: logger.logError, logInvite: inviteLogger.logInvite };