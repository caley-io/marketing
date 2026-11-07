"use client";

import React, { useState } from "react";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import {
  EmailPullRequest,
  TeamContext,
  canDispatchEmailPr,
  canReviewEmailPr,
} from "@/utils/emailPr";

interface EmailPrReviewPanelProps {
  pullRequests: EmailPullRequest[];
  teamContext: TeamContext;
  onRefresh: () => void;
}

export const EmailPrReviewPanel: React.FC<EmailPrReviewPanelProps> = ({
  pullRequests,
  teamContext,
  onRefresh,
}) => {
  const [commentByPr, setCommentByPr] = useState<Record<string, string>>({});
  const [labelByPr, setLabelByPr] = useState<Record<string, string>>({});
  const [reviewerByPr, setReviewerByPr] = useState<Record<string, string>>({});
  const [busyPrId, setBusyPrId] = useState<string | null>(null);

  if (!pullRequests || pullRequests.length === 0) {
    return null;
  }

  const runAction = async (payload: Record<string, unknown>) => {
    const id = String(payload.id || "");
    setBusyPrId(id);
    try {
      await fetch("/api/mail/pr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onRefresh();
    } finally {
      setBusyPrId(null);
    }
  };

  const getBadgeColor = (status: EmailPullRequest["status"]) => {
    switch (status) {
      case "approved":
        return "green" as const;
      case "changes_requested":
        return "red" as const;
      case "dispatched":
        return "purple" as const;
      case "open":
        return "blue" as const;
      default:
        return "gray" as const;
    }
  };

  return (
    <div className="mt-6 space-y-4 border-t pt-4">
      <h3 className="text-sm font-semibold text-foreground">
        Email Pull Requests ({pullRequests.length})
      </h3>

      {pullRequests.map((pr) => {
        const canReview = canReviewEmailPr(pr, teamContext);
        const canDispatch = canDispatchEmailPr(pr, teamContext);
        const isBusy = busyPrId === pr.id;

        return (
          <div
            key={pr.id}
            className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{pr.subject}</div>
                <div className="text-xs text-muted-foreground">
                  To: {pr.to} • Author: {pr.authorEmail}
                </div>
              </div>
              <Badge color={getBadgeColor(pr.status)}>
                {pr.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            <pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">
              {pr.messageText}
            </pre>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">Labels:</span>
              {pr.labels.length === 0 ? (
                <span className="text-muted-foreground">None</span>
              ) : (
                pr.labels.map((label) => (
                  <Badge key={label} color="gray">
                    {label}
                  </Badge>
                ))
              )}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="text"
                  placeholder="Add label..."
                  className="rounded border px-2 py-1 text-xs bg-background"
                  value={labelByPr[pr.id] || ""}
                  onChange={(e) =>
                    setLabelByPr((prev) => ({
                      ...prev,
                      [pr.id]: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  size="xs"
                  color="white"
                  loading={isBusy}
                  onClick={() => {
                    const label = labelByPr[pr.id];
                    if (!label?.trim()) return;
                    setLabelByPr((prev) => ({ ...prev, [pr.id]: "" }));
                    runAction({ id: pr.id, action: "add_label", label });
                  }}
                >
                  + Label
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">Reviewers:</span>
              {pr.reviewers.length === 0 ? (
                <span className="text-muted-foreground">Unassigned</span>
              ) : (
                pr.reviewers.map((reviewer) => (
                  <Badge key={reviewer} color="blue">
                    {reviewer}
                  </Badge>
                ))
              )}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="text"
                  placeholder="Reviewer email..."
                  className="rounded border px-2 py-1 text-xs bg-background"
                  value={reviewerByPr[pr.id] || ""}
                  onChange={(e) =>
                    setReviewerByPr((prev) => ({
                      ...prev,
                      [pr.id]: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  size="xs"
                  color="white"
                  loading={isBusy}
                  onClick={() => {
                    const reviewer = reviewerByPr[pr.id];
                    if (!reviewer?.trim()) return;
                    setReviewerByPr((prev) => ({ ...prev, [pr.id]: "" }));
                    runAction({
                      id: pr.id,
                      action: "assign_reviewers",
                      reviewers: [reviewer],
                    });
                  }}
                >
                  + Reviewer
                </Button>
              </div>
            </div>

            {pr.comments.length > 0 && (
              <div className="space-y-1 border-t pt-2">
                <div className="text-xs font-medium">Review Comments</div>
                {pr.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded bg-muted/50 px-2 py-1 text-xs"
                  >
                    <span className="font-semibold">{comment.authorEmail}</span>
                    {comment.lineNumber ? ` (Line ${comment.lineNumber})` : ""}:{" "}
                    {comment.body}
                  </div>
                ))}
              </div>
            )}

            {pr.status !== "dispatched" && pr.status !== "closed" && (
              <div className="space-y-2 border-t pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave review feedback or a comment..."
                    className="flex-1 rounded border px-2 py-1 text-xs bg-background"
                    value={commentByPr[pr.id] || ""}
                    onChange={(e) =>
                      setCommentByPr((prev) => ({
                        ...prev,
                        [pr.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    size="xs"
                    color="white"
                    loading={isBusy}
                    onClick={() => {
                      const body = commentByPr[pr.id];
                      if (!body?.trim()) return;
                      setCommentByPr((prev) => ({ ...prev, [pr.id]: "" }));
                      runAction({ id: pr.id, action: "comment", body });
                    }}
                  >
                    Comment
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canReview && (
                    <>
                      <Button
                        type="button"
                        size="xs"
                        loading={isBusy}
                        onClick={() => {
                          const body = commentByPr[pr.id];
                          setCommentByPr((prev) => ({ ...prev, [pr.id]: "" }));
                          runAction({
                            id: pr.id,
                            action: "review",
                            decision: "APPROVE",
                            body,
                          });
                        }}
                      >
                        Approve Email PR
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        color="red"
                        loading={isBusy}
                        onClick={() => {
                          const body = commentByPr[pr.id];
                          setCommentByPr((prev) => ({ ...prev, [pr.id]: "" }));
                          runAction({
                            id: pr.id,
                            action: "review",
                            decision: "REQUEST_CHANGES",
                            body,
                          });
                        }}
                      >
                        Request Changes
                      </Button>
                    </>
                  )}

                  {canDispatch && (
                    <Button
                      type="button"
                      size="xs"
                      loading={isBusy}
                      onClick={() =>
                        runAction({ id: pr.id, action: "dispatch" })
                      }
                    >
                      Merge & Send Email
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
