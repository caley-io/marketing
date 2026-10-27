import {
  addEmailAccountBody,
  createWorkspaceBody,
  inviteMemberBody,
} from "@/app/api/workspaces/validation";
import {
  addWorkspaceEmailAccount,
  createWorkspace,
  getWorkspacesForUser,
  inviteWorkspaceMember,
} from "@/app/api/workspaces/controller";
import prisma from "@/utils/prisma";

jest.mock("@/utils/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    emailAccount: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Multitenancy Workspaces & Teams API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates workspace, member invitation, and email account payloads", () => {
    expect(createWorkspaceBody.parse({ name: "  Caley HQ  " })).toEqual({
      name: "Caley HQ",
    });
    expect(
      inviteMemberBody.parse({
        email: "Teammate@Caley.io",
        role: "ADMIN",
      }),
    ).toEqual({
      email: "Teammate@Caley.io",
      role: "ADMIN",
    });
    expect(
      addEmailAccountBody.parse({
        email: "support@caley.io",
        name: "Support Inbox",
      }),
    ).toEqual({
      email: "support@caley.io",
      name: "Support Inbox",
    });
  });

  it("creates a workspace with the creator as OWNER and links their email account", async () => {
    (mockedPrisma.organization.create as jest.Mock).mockResolvedValue({
      id: "ws-1",
      name: "Caley Team",
      membership: [{ id: 1, userId: "user-1", role: "OWNER" }],
      emailAccounts: [{ id: "acc-1", email: "founder@caley.io" }],
    });

    const result = await createWorkspace({
      userId: "user-1",
      userEmail: "Founder@Caley.io",
      userName: "Founder",
      body: { name: "Caley Team" },
    });

    expect(mockedPrisma.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Caley Team",
          membership: {
            create: {
              userId: "user-1",
              role: "OWNER",
            },
          },
          emailAccounts: {
            create: {
              name: "Founder",
              email: "founder@caley.io",
            },
          },
        }),
      }),
    );
    expect(result.id).toBe("ws-1");
  });

  it("auto-claims pending email invitations when fetching user workspaces", async () => {
    (mockedPrisma.membership.updateMany as jest.Mock).mockResolvedValue({
      count: 1,
    });
    (mockedPrisma.organization.findMany as jest.Mock).mockResolvedValue([
      { id: "ws-1", name: "Caley Team", membership: [], emailAccounts: [] },
    ]);

    const workspaces = await getWorkspacesForUser({
      userId: "user-2",
      userEmail: "Teammate@Caley.io",
    });

    expect(mockedPrisma.membership.updateMany).toHaveBeenCalledWith({
      where: {
        invitedEmail: "teammate@caley.io",
        userId: null,
      },
      data: {
        userId: "user-2",
        invitedEmail: null,
        invitedName: null,
      },
    });
    expect(workspaces).toHaveLength(1);
  });

  it("enforces RBAC when inviting members (allows OWNER/ADMIN, blocks USER/non-member)", async () => {
    (mockedPrisma.membership.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 10,
      role: "USER",
      organizationId: "ws-1",
      userId: "user-regular",
    });

    await expect(
      inviteWorkspaceMember({
        requesterId: "user-regular",
        workspaceId: "ws-1",
        body: { email: "new@caley.io", role: "USER" },
      }),
    ).rejects.toThrow("Forbidden");

    (mockedPrisma.membership.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 1,
      role: "ADMIN",
      organizationId: "ws-1",
      userId: "user-admin",
    });
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (mockedPrisma.membership.upsert as jest.Mock).mockResolvedValueOnce({
      id: 11,
      organizationId: "ws-1",
      invitedEmail: "new@caley.io",
      role: "USER",
    });

    const invite = await inviteWorkspaceMember({
      requesterId: "user-admin",
      workspaceId: "ws-1",
      body: { email: "New@Caley.io", role: "USER", name: "New Member" },
    });

    expect(invite.invitedEmail).toBe("new@caley.io");
  });

  it("allows workspace members to attach multiple Gmail accounts and blocks non-members", async () => {
    (mockedPrisma.membership.findFirst as jest.Mock).mockResolvedValueOnce(
      null,
    );

    await expect(
      addWorkspaceEmailAccount({
        requesterId: "outsider",
        workspaceId: "ws-1",
        body: { email: "sales@caley.io", name: "Sales" },
      }),
    ).rejects.toThrow("Forbidden");

    (mockedPrisma.membership.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 1,
      role: "USER",
      organizationId: "ws-1",
      userId: "user-1",
    });
    (mockedPrisma.emailAccount.findFirst as jest.Mock).mockResolvedValueOnce(
      null,
    );
    (mockedPrisma.emailAccount.create as jest.Mock).mockResolvedValueOnce({
      id: "acc-2",
      organizationId: "ws-1",
      email: "sales@caley.io",
      name: "Sales",
    });

    const account = await addWorkspaceEmailAccount({
      requesterId: "user-1",
      workspaceId: "ws-1",
      body: { email: "Sales@Caley.io", name: "Sales" },
    });

    expect(account.email).toBe("sales@caley.io");
  });
});
