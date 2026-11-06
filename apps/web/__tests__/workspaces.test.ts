import test from "node:test";
import assert from "node:assert/strict";
import {
  addWorkspaceEmailAccount,
  canManageWorkspaceMembers,
  createWorkspace,
  ensurePersonalWorkspace,
  getWorkspaceInitials,
  inviteWorkspaceMember,
  removeWorkspaceEmailAccount,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../utils/workspaces.ts";

function createInMemoryDb() {
  const users: any[] = [];
  const organizations: any[] = [];
  const memberships: any[] = [];
  const emailAccounts: any[] = [];
  let idCounter = 1;
  const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

  const hydrateOrg = (org: any) => ({
    ...org,
    membership: memberships
      .filter((m) => m.organizationId === org.id)
      .map((m) => ({
        ...m,
        user: users.find((u) => u.id === m.userId) || null,
      })),
    emailAccounts: emailAccounts.filter((e) => e.organizationId === org.id),
  });

  return {
    users,
    organizations,
    memberships,
    emailAccounts,
    user: {
      findUnique: async ({ where }: any) =>
        users.find((u) => u.email === where.email || u.id === where.id) || null,
    },
    organization: {
      create: async ({ data }: any) => {
        const org = {
          id: nextId("org"),
          name: data.name,
          image: data.image ?? null,
        };
        organizations.push(org);

        const membershipCreate = data.membership?.create;
        const mList = Array.isArray(membershipCreate)
          ? membershipCreate
          : membershipCreate
            ? [membershipCreate]
            : [];
        for (const item of mList) {
          memberships.push({
            id: nextId("mem"),
            organizationId: org.id,
            userId: item.userId ?? null,
            role: item.role ?? "USER",
            invitedEmail: item.invitedEmail ?? null,
            invitedName: item.invitedName ?? null,
          });
        }

        const accountsCreate = data.emailAccounts?.create;
        const aList = Array.isArray(accountsCreate)
          ? accountsCreate
          : accountsCreate
            ? [accountsCreate]
            : [];
        for (const acc of aList) {
          emailAccounts.push({
            id: nextId("acc"),
            organizationId: org.id,
            name: acc.name,
            email: acc.email,
            gmailAccessToken: acc.gmailAccessToken ?? null,
            gmailRefreshToken: acc.gmailRefreshToken ?? null,
            gmailExpiresAt: acc.gmailExpiresAt ?? null,
          });
        }

        return hydrateOrg(org);
      },
      findMany: async ({ where }: any) => {
        const userId = where?.membership?.some?.userId;
        return organizations
          .filter((org) =>
            memberships.some(
              (m) => m.organizationId === org.id && m.userId === userId,
            ),
          )
          .map(hydrateOrg);
      },
    },
    membership: {
      findMany: async ({ where }: any) => {
        return memberships
          .filter((m) => {
            if (
              where.invitedEmail !== undefined &&
              m.invitedEmail !== where.invitedEmail
            ) {
              return false;
            }
            if (where.userId !== undefined && m.userId !== where.userId) {
              return false;
            }
            if (
              where.organizationId !== undefined &&
              m.organizationId !== where.organizationId
            ) {
              return false;
            }
            return true;
          })
          .map((m) => ({
            ...m,
            organization: hydrateOrg(
              organizations.find((o) => o.id === m.organizationId),
            ),
          }));
      },
      findFirst: async ({ where }: any) => {
        return (
          memberships.find((m) => {
            if (where.id !== undefined && m.id !== where.id) return false;
            if (
              where.organizationId !== undefined &&
              m.organizationId !== where.organizationId
            ) {
              return false;
            }
            if (where.userId !== undefined && m.userId !== where.userId) {
              return false;
            }
            if (
              where.invitedEmail !== undefined &&
              m.invitedEmail !== where.invitedEmail
            ) {
              return false;
            }
            return true;
          }) || null
        );
      },
      create: async ({ data }: any) => {
        const record = {
          id: nextId("mem"),
          organizationId: data.organizationId,
          userId: data.userId ?? null,
          role: data.role ?? "USER",
          invitedEmail: data.invitedEmail ?? null,
          invitedName: data.invitedName ?? null,
        };
        memberships.push(record);
        return {
          ...record,
          user: users.find((u) => u.id === record.userId) || null,
        };
      },
      update: async ({ where, data }: any) => {
        const target = memberships.find((m) => m.id === where.id);
        if (!target) throw new Error("Not found");
        Object.assign(target, data);
        return {
          ...target,
          user: users.find((u) => u.id === target.userId) || null,
        };
      },
      count: async ({ where }: any) => {
        return memberships.filter(
          (m) =>
            m.organizationId === where.organizationId && m.role === where.role,
        ).length;
      },
      delete: async ({ where }: any) => {
        const idx = memberships.findIndex((m) => m.id === where.id);
        const [removed] = memberships.splice(idx, 1);
        return removed;
      },
    },
    emailAccount: {
      findFirst: async ({ where }: any) => {
        return (
          emailAccounts.find((a) => {
            if (where.id !== undefined && a.id !== where.id) return false;
            if (
              where.organizationId !== undefined &&
              a.organizationId !== where.organizationId
            ) {
              return false;
            }
            if (where.email !== undefined && a.email !== where.email) {
              return false;
            }
            return true;
          }) || null
        );
      },
      create: async ({ data }: any) => {
        const acc = {
          id: nextId("acc"),
          ...data,
        };
        emailAccounts.push(acc);
        return acc;
      },
      update: async ({ where, data }: any) => {
        const target = emailAccounts.find((a) => a.id === where.id);
        Object.assign(target, data);
        return target;
      },
      delete: async ({ where }: any) => {
        const idx = emailAccounts.findIndex((a) => a.id === where.id);
        const [removed] = emailAccounts.splice(idx, 1);
        return removed;
      },
    },
  };
}

test("getWorkspaceInitials and canManageWorkspaceMembers helpers", () => {
  assert.equal(getWorkspaceInitials("Acme Growth"), "AG");
  assert.equal(getWorkspaceInitials("Caley"), "CA");
  assert.equal(canManageWorkspaceMembers("OWNER"), true);
  assert.equal(canManageWorkspaceMembers("ADMIN"), true);
  assert.equal(canManageWorkspaceMembers("USER"), false);
});

test("ensurePersonalWorkspace provisions default workspace and claims pending invitations", async () => {
  const db = createInMemoryDb();
  const alice = {
    id: "user_alice",
    name: "Alice Smith",
    email: "alice@example.com",
  };
  db.users.push(alice);

  const workspaces = await ensurePersonalWorkspace(db, alice);
  assert.equal(workspaces.length, 1);
  assert.equal(workspaces[0].name, "Alice Smith's Workspace");
  assert.equal(workspaces[0].membership[0].role, "OWNER");
  assert.equal(workspaces[0].emailAccounts[0].email, "alice@example.com");

  await inviteWorkspaceMember(db, alice.id, workspaces[0].id, {
    email: "bob@example.com",
    name: "Bob Jones",
    role: "ADMIN",
  });

  const bob = {
    id: "user_bob",
    name: "Bob Jones",
    email: "bob@example.com",
  };
  db.users.push(bob);

  const bobWorkspaces = await ensurePersonalWorkspace(db, bob);
  assert.equal(bobWorkspaces.length, 1);
  assert.equal(bobWorkspaces[0].id, workspaces[0].id);
  const bobMembership = db.memberships.find((m) => m.userId === bob.id);
  assert.equal(bobMembership.role, "ADMIN");
  assert.equal(bobMembership.invitedEmail, null);
});

test("createWorkspace creates organization with initial team invites and RBAC enforcement", async () => {
  const db = createInMemoryDb();
  const owner = {
    id: "user_owner",
    name: "Owner User",
    email: "owner@company.com",
  };
  db.users.push(owner);

  const ws = await createWorkspace(db, owner, {
    name: "Marketing Team",
    invites: [
      { email: "admin@company.com", name: "Admin Member", role: "ADMIN" },
      { email: "viewer@company.com", role: "USER" },
    ],
  });

  assert.equal(ws.name, "Marketing Team");
  assert.equal(ws.membership.length, 3);
  assert.equal(ws.emailAccounts.length, 1);
  assert.equal(ws.emailAccounts[0].email, "owner@company.com");

  const ownerMem = ws.membership.find((m: any) => m.userId === owner.id);
  await assert.rejects(
    () =>
      updateWorkspaceMemberRole(db, owner.id, ws.id, ownerMem.id, "ADMIN"),
    /Workspace must have at least one owner/,
  );

  await assert.rejects(
    () => removeWorkspaceMember(db, owner.id, ws.id, ownerMem.id),
    /Cannot remove the last owner/,
  );
});

test("addWorkspaceEmailAccount and removeWorkspaceEmailAccount manage multi-Gmail workspace accounts", async () => {
  const db = createInMemoryDb();
  const owner = {
    id: "user_owner",
    name: "Owner User",
    email: "owner@company.com",
  };
  db.users.push(owner);

  const ws = await createWorkspace(db, owner, { name: "Outbound Ops" });
  const salesAcc = await addWorkspaceEmailAccount(db, owner.id, ws.id, {
    name: "Sales Inbox",
    email: "sales@company.com",
  });
  assert.equal(salesAcc.email, "sales@company.com");
  assert.equal(db.emailAccounts.length, 2);

  await removeWorkspaceEmailAccount(db, owner.id, ws.id, salesAcc.id);
  assert.equal(db.emailAccounts.length, 1);
});
