import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  EmailPrStore,
  type TeamContext,
  addEmailPrComment,
  addEmailPrLabel,
  assignEmailPrReviewers,
  canDispatchEmailPr,
  canReviewEmailPr,
  canSendEmailDirectly,
  closeEmailPr,
  createEmailPr,
  markEmailPrDispatched,
  removeEmailPrLabel,
  requestEmailPrReview,
  submitEmailPrReview,
  updateEmailPrContent,
} from "../utils/emailPr.ts";

describe("Email Pull Request Workflow (Issue #13)", () => {
  const adminMember: TeamContext = {
    userId: "user_admin",
    userEmail: "admin@caley.io",
    role: "ADMIN",
    teamMemberCount: 4,
    organizationId: "org_1",
  };

  const soloMember: TeamContext = {
    userId: "user_solo",
    userEmail: "solo@caley.io",
    role: "USER",
    teamMemberCount: 1,
    organizationId: "org_solo",
  };

  const authorMember: TeamContext = {
    userId: "user_author",
    userEmail: "writer@caley.io",
    role: "USER",
    teamMemberCount: 4,
    organizationId: "org_1",
  };

  const peerReviewer: TeamContext = {
    userId: "user_reviewer",
    userEmail: "reviewer@caley.io",
    role: "USER",
    teamMemberCount: 4,
    organizationId: "org_1",
  };

  it("allows admins, owners, and single-member teams to send emails directly", () => {
    assert.equal(canSendEmailDirectly(adminMember), true);
    assert.equal(
      canSendEmailDirectly({ ...adminMember, role: "OWNER" }),
      true,
    );
    assert.equal(canSendEmailDirectly(soloMember), true);
  });

  it("requires non-admin members in multi-member teams to create an Email PR", () => {
    assert.equal(canSendEmailDirectly(authorMember), false);
  });

  it("creates an Email PR with deduplicated labels and reviewers", () => {
    const pr = createEmailPr({
      authorId: authorMember.userId,
      authorEmail: authorMember.userEmail,
      organizationId: authorMember.organizationId,
      to: "customer@example.com",
      subject: "Q4 Product Launch",
      messageText: "Hi there, check out our Q4 launch!",
      labels: ["launch", "marketing", "launch"],
      reviewers: ["reviewer@caley.io", "admin@caley.io", "reviewer@caley.io"],
    });

    assert.equal(pr.status, "open");
    assert.deepEqual(pr.labels, ["launch", "marketing"]);
    assert.deepEqual(pr.reviewers, ["reviewer@caley.io", "admin@caley.io"]);
  });

  it("supports adding/removing labels, assigning reviewers, and adding inline comments", () => {
    let pr = createEmailPr({
      authorId: authorMember.userId,
      authorEmail: authorMember.userEmail,
      to: "client@example.com",
      subject: "Partnership Proposal",
      messageText: "Line 1\nLine 2",
      isDraft: true,
    });

    assert.equal(pr.status, "draft");

    pr = addEmailPrLabel(pr, "needs-copy-review");
    pr = addEmailPrLabel(pr, "urgent");
    assert.deepEqual(pr.labels, ["needs-copy-review", "urgent"]);

    pr = removeEmailPrLabel(pr, "urgent");
    assert.deepEqual(pr.labels, ["needs-copy-review"]);

    pr = assignEmailPrReviewers(pr, ["reviewer@caley.io"]);
    pr = requestEmailPrReview(pr, ["admin@caley.io"]);
    assert.equal(pr.status, "open");
    assert.deepEqual(pr.reviewers, ["reviewer@caley.io", "admin@caley.io"]);

    pr = addEmailPrComment(pr, {
      authorId: peerReviewer.userId,
      authorEmail: peerReviewer.userEmail,
      body: "Can we tighten the opening paragraph?",
      lineNumber: 1,
    });

    assert.equal(pr.comments.length, 1);
    assert.equal(pr.comments[0].lineNumber, 1);
    assert.equal(
      pr.comments[0].body,
      "Can we tighten the opening paragraph?",
    );
  });

  it("enforces review permissions and transitions through changes_requested -> approved -> dispatched", () => {
    let pr = createEmailPr({
      authorId: authorMember.userId,
      authorEmail: authorMember.userEmail,
      organizationId: "org_1",
      to: "lead@example.com",
      subject: "Follow up on demo",
      messageText: "Initial draft text",
    });

    // Non-admin author cannot self-approve or dispatch while unapproved
    assert.equal(canReviewEmailPr(pr, authorMember), false);
    assert.equal(canDispatchEmailPr(pr, authorMember), false);
    assert.throws(
      () => submitEmailPrReview(pr, authorMember, "APPROVE"),
      /not authorized/,
    );

    // Peer collaborator requests changes
    assert.equal(canReviewEmailPr(pr, peerReviewer), true);
    pr = submitEmailPrReview(
      pr,
      peerReviewer,
      "REQUEST_CHANGES",
      "Please include pricing link",
    );
    assert.equal(pr.status, "changes_requested");
    assert.equal(pr.comments.length, 1);
    assert.equal(canDispatchEmailPr(pr, authorMember), false);

    // Author updates content and re-requests review
    pr = updateEmailPrContent(pr, {
      messageText: "Updated text with pricing link: https://caley.io/pricing",
    });
    pr = requestEmailPrReview(pr);
    assert.equal(pr.status, "open");

    // Peer collaborator approves the Email PR
    pr = submitEmailPrReview(pr, peerReviewer, "APPROVE", "LGTM!");
    assert.equal(pr.status, "approved");
    assert.equal(pr.reviews.length, 2);

    // Once approved, author can dispatch the Email PR
    assert.equal(canDispatchEmailPr(pr, authorMember), true);
    pr = markEmailPrDispatched(pr, authorMember);
    assert.equal(pr.status, "dispatched");
    assert.ok(pr.dispatchedAt);

    // Dispatched PR cannot be dispatched or closed again
    assert.equal(canDispatchEmailPr(pr, adminMember), false);
    assert.throws(() => closeEmailPr(pr), /already dispatched/);
  });

  it("filters stored Email PRs by organization in EmailPrStore", () => {
    const store = new EmailPrStore();
    const pr1 = createEmailPr({
      id: "pr_org_1",
      authorId: authorMember.userId,
      authorEmail: authorMember.userEmail,
      organizationId: "org_1",
      to: "a@example.com",
      subject: "Org 1 Email",
      messageText: "Hello from Org 1",
    });
    const pr2 = createEmailPr({
      id: "pr_org_2",
      authorId: soloMember.userId,
      authorEmail: soloMember.userEmail,
      organizationId: "org_2",
      to: "b@example.com",
      subject: "Org 2 Email",
      messageText: "Hello from Org 2",
    });

    store.save(pr1);
    store.save(pr2);

    assert.equal(store.list().length, 2);
    assert.equal(store.list("org_1").length, 1);
    assert.equal(store.list("org_1")[0].id, "pr_org_1");
  });
});
