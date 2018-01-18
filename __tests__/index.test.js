// TODO: mock request-promise
const nock = require("nock");

const { sentryAutoResolve } = require("../index");

describe("sentryAutoResolve", () => {
  let fakeProjectName, fakeMessage;

  beforeAll(() => {
    fakeProjectName = "foo";
    fakeMessage = "blablabla";
  });

  afterEach(() => nock.cleanAll());

  test("labels matched", async () => {
    const fakeId = "12345";
    const fakeProbotContext = buildFakeContext({
      payload: {
        issue: {
          title: `[${fakeProjectName}-${fakeId}] ${fakeMessage}`,
          labels: [{ name: "sentry" }]
        }
      }
    });

    nock("https://sentry.io/api/0")
      .put(`/issues/${fakeId}/`, {
        status: "resolved"
      })
      .reply(200, { status: "resolved" });

    await sentryAutoResolve(fakeProbotContext);

    expect(fakeProbotContext.github.issues.createComment).toHaveBeenCalled();

    expect(fakeProbotContext.issue).toHaveBeenCalled();
    expect(fakeProbotContext.issue).toHaveBeenCalledWith({
      body: `Issue ${fakeId} has been resolved`
    });
  });

  test("no labels matched", async () => {
    const fakeId = "12345";
    const fakeProbotContext = buildFakeContext({
      payload: {
        issue: {
          title: `[${fakeProjectName}-${fakeId}] ${fakeMessage}`,
          labels: [{ name: "foo" }]
        }
      }
    });

    await sentryAutoResolve(fakeProbotContext);

    expect(
      fakeProbotContext.github.issues.createComment
    ).not.toHaveBeenCalled();
  });

  test("title not matched with given pattern", async () => {
    const fakeProbotContext = buildFakeContext({
      payload: {
        issue: {
          title: `[${fakeProjectName}] ${fakeMessage}`,
          labels: [{ name: "sentry" }]
        }
      }
    });

    await sentryAutoResolve(fakeProbotContext);

    expect(
      fakeProbotContext.github.issues.createComment
    ).not.toHaveBeenCalled();
  });
});

function buildFakeContext(context) {
  const defaultContext = {
    github: {
      issues: {
        createComment: jest.fn()
      }
    },
    issue: jest.fn()
  };

  return Object.assign({}, defaultContext, context);
}
