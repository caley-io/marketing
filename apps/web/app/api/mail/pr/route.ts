import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { getGmailClient } from "@/utils/gmail/client";
import { sendEmail } from "@/utils/gmail/mail";
import { withError } from "@/utils/middleware";
import prisma from "@/utils/prisma";
import {
  TeamContext,
  TeamMemberRole,
  addEmailPrComment,
  addEmailPrLabel,
  assignEmailPrReviewers,
  canDispatchEmailPr,
  canSendEmailDirectly,
  closeEmailPr,
  createEmailPr,
  emailPrStore,
  markEmailPrDispatched,
  removeEmailPrLabel,
  requestEmailPrReview,
  submitEmailPrReview,
  updateEmailPrContent,
} from "@/utils/emailPr";

async function resolveTeamContext(
  userId: string,
  userEmail: string,
): Promise<TeamContext> {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            membership: true,
          },
        },
      },
    });

    if (memberships.length > 0) {
      const primary = memberships[0];
      const role = (primary.role as TeamMemberRole) || "USER";
      const teamMemberCount = primary.organization?.membership?.length ?? 1;
      return {
        userId,
        userEmail,
        role,
        teamMemberCount,
        organizationId: primary.organizationId,
      };
    }
  } catch {
    // Fallback if organization/membership tables are not populated yet
  }

  return {
    userId,
    userEmail,
    role: "ADMIN",
    teamMemberCount: 1,
  };
}

export const GET = withError(async () => {
  const session = await auth();
  if (!session?.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const teamContext = await resolveTeamContext(
    session.user.id,
    session.user.email,
  );
  const pullRequests = emailPrStore.list(teamContext.organizationId);

  return NextResponse.json({
    teamContext,
    canSendDirectly: canSendEmailDirectly(teamContext),
    pullRequests,
  });
});

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const teamContext = await resolveTeamContext(
    session.user.id,
    session.user.email,
  );

  const pr = createEmailPr({
    authorId: session.user.id,
    authorEmail: session.user.email,
    organizationId: teamContext.organizationId,
    to: json.to,
    cc: json.cc,
    bcc: json.bcc,
    replyTo: json.replyTo,
    subject: json.subject,
    messageText: json.messageText,
    messageHtml: json.messageHtml,
    isDraft: Boolean(json.isDraft),
    labels: Array.isArray(json.labels) ? json.labels : [],
    reviewers: Array.isArray(json.reviewers) ? json.reviewers : [],
  });

  emailPrStore.save(pr);

  return NextResponse.json({ pullRequest: pr }, { status: 201 });
});

export const PATCH = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const prId = String(json.id || "");
  const existing = emailPrStore.get(prId);

  if (!existing) {
    return NextResponse.json(
      { error: "Email PR not found" },
      { status: 404 },
    );
  }

  const teamContext: TeamContext = json.teamContextOverride ??
    (await resolveTeamContext(session.user.id, session.user.email));

  const action = String(json.action || "");
  let updated = existing;

  switch (action) {
    case "comment": {
      updated = addEmailPrComment(existing, {
        authorId: teamContext.userId,
        authorEmail: teamContext.userEmail,
        body: String(json.body || ""),
        lineNumber:
          typeof json.lineNumber === "number" ? json.lineNumber : undefined,
      });
      break;
    }
    case "review": {
      updated = submitEmailPrReview(
        existing,
        teamContext,
        json.decision,
        json.body,
      );
      break;
    }
    case "add_label": {
      updated = addEmailPrLabel(existing, String(json.label || ""));
      break;
    }
    case "remove_label": {
      updated = removeEmailPrLabel(existing, String(json.label || ""));
      break;
    }
    case "assign_reviewers": {
      updated = assignEmailPrReviewers(
        existing,
        Array.isArray(json.reviewers) ? json.reviewers : [],
      );
      break;
    }
    case "request_review": {
      updated = requestEmailPrReview(
        existing,
        Array.isArray(json.reviewers) ? json.reviewers : undefined,
      );
      break;
    }
    case "update_content": {
      updated = updateEmailPrContent(existing, {
        to: json.to,
        cc: json.cc,
        bcc: json.bcc,
        replyTo: json.replyTo,
        subject: json.subject,
        messageText: json.messageText,
        messageHtml: json.messageHtml,
      });
      break;
    }
    case "dispatch": {
      if (!canDispatchEmailPr(existing, teamContext)) {
        return NextResponse.json(
          { error: "Email PR must be approved before dispatch" },
          { status: 403 },
        );
      }

      const gmail = getGmailClient(session);
      await sendEmail(gmail, {
        to: existing.to,
        cc: existing.cc,
        bcc: existing.bcc,
        replyTo: existing.replyTo,
        subject: existing.subject,
        messageText: existing.messageText,
        messageHtml: existing.messageHtml,
      });

      updated = markEmailPrDispatched(existing, teamContext);
      break;
    }
    case "close": {
      updated = closeEmailPr(existing);
      break;
    }
    default:
      return NextResponse.json(
        { error: `Unsupported action: ${action}` },
        { status: 400 },
      );
  }

  emailPrStore.save(updated);
  return NextResponse.json({ pullRequest: updated });
});
