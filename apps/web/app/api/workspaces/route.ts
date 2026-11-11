import { NextResponse } from "next/server";
import {
  InMemoryWorkspaceStore,
  MembershipRole,
  EmailProvider,
} from "@/utils/workspaces/workspace-service";

const defaultStore = new InMemoryWorkspaceStore();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;

    if (action === "create_workspace") {
      const result = defaultStore.createWorkspace({
        name: body.name,
        ownerUserId: body.ownerUserId,
        image: body.image,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "invite_member") {
      const membership = defaultStore.inviteTeamMember({
        organizationId: body.organizationId,
        actorUserId: body.actorUserId,
        invitedEmail: body.invitedEmail,
        invitedName: body.invitedName,
        role: (body.role as MembershipRole) || "USER",
      });
      return NextResponse.json({ membership }, { status: 201 });
    }

    if (action === "accept_invitation") {
      const membership = defaultStore.acceptInvitation({
        organizationId: body.organizationId,
        invitedEmail: body.invitedEmail,
        userId: body.userId,
      });
      return NextResponse.json({ membership }, { status: 200 });
    }

    if (action === "add_email_account") {
      const emailAccount = defaultStore.addEmailAccountToWorkspace({
        organizationId: body.organizationId,
        actorUserId: body.actorUserId,
        name: body.name,
        email: body.email,
        provider: (body.provider as EmailProvider) || "GMAIL",
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
      });
      return NextResponse.json({ emailAccount }, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported workspace action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Workspace error" }, { status: 400 });
  }
}
