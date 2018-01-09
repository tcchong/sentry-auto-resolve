const rp = require('request-promise')
const lodash = require('lodash')

module.exports = robot => {
  robot.on('issues.closed', async context => {
    const sentryMatched = lodash.find(context.payload.issue.labels, { name: 'sentry' })
    if (sentryMatched) {
      const prefix = context.payload.issue.title.match(/\[(.*?)\]/)[1] // Ex. [foo-123] blablabla
      const sentryIssueId = prefix.split('-')[1]
      
      if (sentryIssueId) {
        const body = await rp({
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.SENTRY_API_TOKEN}`,
            'Referer': `${process.env.SENTRY_REFERER}`
          },
          uri: `${process.env.SENTRY_API_URL}/issues/${sentryIssueId}/`,
          body: { status: 'resolved' },
          json: true
        })
        
        if (body.status === 'resolved') {
          context.github.issues.createComment(
            context.issue({ body: `Issue ${sentryIssueId} has been resolved` })
          )
        }
      } 
    }
  })
}

