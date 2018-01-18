const rp = require("request-promise");
const lodash = require("lodash");

const SENTRY_API_URI = "https://sentry.io/api/0";

module.exports = robot => {
  console.log("Sentry probot is on!");

  robot.on("issues.closed", sentryAutoResolve);
};

async function sentryAutoResolve(context) {
  const sentryMatched = lodash.find(context.payload.issue.labels, {
    name: "sentry"
  });
  if (sentryMatched) {
    const prefix = context.payload.issue.title.match(/\[(.*?)\]/)[1]; // Ex. [foo-123] blablabla
    const sentryIssueId = prefix.split("-")[1];

    if (sentryIssueId) {
      const body = await rp({
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.SENTRY_API_TOKEN}`,
          Referer: `${process.env.SENTRY_REFERER}`
        },
        uri: `${SENTRY_API_URI}/issues/${sentryIssueId}/`,
        body: { status: "resolved" },
        json: true
      });

      if (body.status === "resolved") {
        context.github.issues.createComment(
          context.issue({ body: `Issue ${sentryIssueId} has been resolved` })
        );
      }
    }
  }
}

module.exports.sentryAutoResolve = sentryAutoResolve;
