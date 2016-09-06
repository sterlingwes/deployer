const request = require('request')

module.exports = function slackNotify (message) {
  request({
    uri: process.env.SLACK_URL,
    method: 'POST',
    json: true,
    body: {
      attachments: [
        {
          text: message,
          mrkdwn_in: ['text']
        }
      ]
    }
  }, function (err, response, body) {
    if (err) return console.error('Slack send error', err)
    console.log('Sent event to slack, response:', body)
  })
}
