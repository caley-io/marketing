export type TeamMemberRole = "OWNER" | "ADMIN" | "USER";

export interface TeamContext {
  userId: string;
  userEmail: string;
  role: TeamMemberRole;
  teamMemberCount: number;
  organizationId?: string;
}

export type EmailPullRequestStatus =
  | "draft"
  | "open"
  | "changes_requested"
  | "approved"
  | "dispatched"
  | "closed";

export type EmailPrReviewDecision = "APPROVE" | "REQUEST_CHANGES" | "COMMENT";

export interface EmailPrComment {
  id: string;
  authorId: string;
  authorEmail: string;
  body: string;
  lineNumber?: number;
  createdAt: string;
}

export interface EmailPrReview {
  id: string;
  reviewerId: string;
  reviewerEmail: string;
  decision: EmailPrReviewDecision;
  body?: string;
  createdAt: string;
}

export interface EmailPullRequest {
  id: string;
  authorId: string;
  authorEmail: string;
  organizationId?: string;
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  subject: string;
  messageText: string;
  messageHtml?: string;
  status: EmailPullRequestStatus;
  labels: string[];
  reviewers: string[];
  comments: EmailPrComment[];
  reviews: EmailPrReview[];
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string;
}

export interface CreateEmailPrInput {
  id?: string;
  authorId: string;
  authorEmail: string;
  organizationId?: string;
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  subject: string;
  messageText: string;
  messageHtml?: string;
  isDraft?: boolean;
  labels?: string[];
  reviewers?: string[];
}

function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

/**
 * Determines whether a user can send emails directly without creating an Email PR.
 * Direct sending is allowed if the user is an ADMIN/OWNER or the only member of their team.
 */
export function canSendEmailDirectly(context: TeamContext): boolean {
  if (context.role === "OWNER" || context.role === "ADMIN") {
    return true;
  }
  return context.teamMemberCount <= 1;
}

/**
 * Determines whether a user can submit an approval or change request on an Email PR.
 * Admins/Owners can review any PR; regular team members can review PRs authored by others.
 */
export function canReviewEmailPr(
  pr: EmailPullRequest,
  reviewer: TeamContext,
): boolean {
  if (pr.status === "dispatched" || pr.status === "closed") {
    return false;
  }
  if (reviewer.role === "OWNER" || reviewer.role === "ADMIN") {
    return true;
  }
  return (
    reviewer.userId !== pr.authorId &&
    reviewer.userEmail.toLowerCase() !== pr.authorEmail.toLowerCase()
  );
}

/**
 * Determines whether an Email PR can be dispatched (sent) by the given actor.
 * An Email PR can be dispatched once approved (by its author, a reviewer, or an admin),
 * or bypassed directly by an ADMIN/OWNER while open.
 */
export function canDispatchEmailPr(
  pr: EmailPullRequest,
  actor: TeamContext,
): boolean {
  if (pr.status === "dispatched" || pr.status === "closed") {
    return false;
  }
  if (pr.status === "approved") {
    return true;
  }
  return actor.role === "OWNER" || actor.role === "ADMIN";
}

/**
 * Creates a new Email Pull Request.
 */
export function createEmailPr(input: CreateEmailPrInput): EmailPullRequest {
  if (!input.to?.trim()) {
    throw new Error("Recipient (to) is required to create an Email PR");
  }
  if (!input.subject?.trim()) {
    throw new Error("Subject is required to create an Email PR");
  }
  if (!input.messageText?.trim()) {
    throw new Error("Message body is required to create an Email PR");
  }

  const now = new Date().toISOString();
  const uniqueLabels = Array.from(
    new Set((input.labels ?? []).map((l) => l.trim()).filter(Boolean)),
  );
  const uniqueReviewers = Array.from(
    new Set((input.reviewers ?? []).map((r) => r.trim()).filter(Boolean)),
  );

  return {
    id: input.id || generateId("email_pr"),
    authorId: input.authorId,
    authorEmail: input.authorEmail,
    organizationId: input.organizationId,
    to: input.to.trim(),
    cc: input.cc?.trim(),
    bcc: input.bcc?.trim(),
    replyTo: input.replyTo?.trim(),
    subject: input.subject.trim(),
    messageText: input.messageText,
    messageHtml: input.messageHtml,
    status: input.isDraft ? "draft" : "open",
    labels: uniqueLabels,
    reviewers: uniqueReviewers,
    comments: [],
    reviews: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transitions a draft or changes-requested Email PR to open for review.
 */
export function requestEmailPrReview(
  pr: EmailPullRequest,
  reviewers?: string[],
): EmailPullRequest {
  if (pr.status === "dispatched" || pr.status === "closed") {
    throw new Error(`Cannot request review on a ${pr.status} Email PR`);
  }

  const mergedReviewers = reviewers
    ? Array.from(
        new Set(
          [...pr.reviewers, ...reviewers].map((r) => r.trim()).filter(Boolean),
        ),
      )
    : pr.reviewers;

  return {
    ...pr,
    status: "open",
    reviewers: mergedReviewers,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates the draft content (to, subject, messageText, etc.) of an Email PR.
 */
export function updateEmailPrContent(
  pr: EmailPullRequest,
  updates: Partial<
    Pick<
      EmailPullRequest,
      "to" | "cc" | "bcc" | "replyTo" | "subject" | "messageText" | "messageHtml"
    >
  >,
): EmailPullRequest {
  if (pr.status === "dispatched" || pr.status === "closed") {
    throw new Error(`Cannot edit content of a ${pr.status} Email PR`);
  }

  return {
    ...pr,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds a label to an Email PR (just like GitHub PR labels).
 */
export function addEmailPrLabel(
  pr: EmailPullRequest,
  label: string,
): EmailPullRequest {
  const normalized = label.trim();
  if (!normalized) return pr;
  if (pr.labels.includes(normalized)) return pr;

  return {
    ...pr,
    labels: [...pr.labels, normalized],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Removes a label from an Email PR.
 */
export function removeEmailPrLabel(
  pr: EmailPullRequest,
  label: string,
): EmailPullRequest {
  const normalized = label.trim();
  return {
    ...pr,
    labels: pr.labels.filter((l) => l !== normalized),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Assigns one or more reviewers to an Email PR.
 */
export function assignEmailPrReviewers(
  pr: EmailPullRequest,
  reviewers: string[],
): EmailPullRequest {
  const merged = Array.from(
    new Set(
      [...pr.reviewers, ...reviewers].map((r) => r.trim()).filter(Boolean),
    ),
  );
  return {
    ...pr,
    reviewers: merged,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds a general or inline comment to an Email PR conversation thread.
 */
export function addEmailPrComment(
  pr: EmailPullRequest,
  input: {
    authorId: string;
    authorEmail: string;
    body: string;
    lineNumber?: number;
  },
): EmailPullRequest {
  if (!input.body?.trim()) {
    throw new Error("Comment body cannot be empty");
  }

  const now = new Date().toISOString();
  const comment: EmailPrComment = {
    id: generateId("pr_comment"),
    authorId: input.authorId,
    authorEmail: input.authorEmail,
    body: input.body.trim(),
    lineNumber: input.lineNumber,
    createdAt: now,
  };

  return {
    ...pr,
    comments: [...pr.comments, comment],
    updatedAt: now,
  };
}

/**
 * Submits a formal review (APPROVE, REQUEST_CHANGES, or COMMENT) on an Email PR.
 */
export function submitEmailPrReview(
  pr: EmailPullRequest,
  reviewer: TeamContext,
  decision: EmailPrReviewDecision,
  body?: string,
): EmailPullRequest {
  if (!canReviewEmailPr(pr, reviewer)) {
    throw new Error("User is not authorized to review this Email PR");
  }

  const now = new Date().toISOString();
  const review: EmailPrReview = {
    id: generateId("pr_review"),
    reviewerId: reviewer.userId,
    reviewerEmail: reviewer.userEmail,
    decision,
    body: body?.trim(),
    createdAt: now,
  };

  let nextStatus = pr.status;
  if (decision === "APPROVE") {
    nextStatus = "approved";
  } else if (decision === "REQUEST_CHANGES") {
    nextStatus = "changes_requested";
  }

  const nextComments =
    body && body.trim()
      ? [
          ...pr.comments,
          {
            id: generateId("pr_comment"),
            authorId: reviewer.userId,
            authorEmail: reviewer.userEmail,
            body: body.trim(),
            createdAt: now,
          },
        ]
      : pr.comments;

  return {
    ...pr,
    status: nextStatus,
    reviews: [...pr.reviews, review],
    comments: nextComments,
    updatedAt: now,
  };
}

/**
 * Marks an approved Email PR as dispatched (merged & sent).
 */
export function markEmailPrDispatched(
  pr: EmailPullRequest,
  actor: TeamContext,
): EmailPullRequest {
  if (!canDispatchEmailPr(pr, actor)) {
    throw new Error(
      "Email PR must be approved before it can be dispatched by a non-admin",
    );
  }

  const now = new Date().toISOString();
  return {
    ...pr,
    status: "dispatched",
    dispatchedAt: now,
    updatedAt: now,
  };
}

/**
 * Closes an Email PR without sending the email.
 */
export function closeEmailPr(pr: EmailPullRequest): EmailPullRequest {
  if (pr.status === "dispatched") {
    throw new Error("Cannot close an already dispatched Email PR");
  }

  return {
    ...pr,
    status: "closed",
    updatedAt: new Date().toISOString(),
  };
}

export class EmailPrStore {
  private prs = new Map<string, EmailPullRequest>();

  list(organizationId?: string): EmailPullRequest[] {
    const all = Array.from(this.prs.values());
    if (!organizationId) return all;
    return all.filter((pr) => pr.organizationId === organizationId);
  }

  get(id: string): EmailPullRequest | undefined {
    return this.prs.get(id);
  }

  save(pr: EmailPullRequest): EmailPullRequest {
    this.prs.set(pr.id, pr);
    return pr;
  }

  clear(): void {
    this.prs.clear();
  }
}

export const emailPrStore = new EmailPrStore();
