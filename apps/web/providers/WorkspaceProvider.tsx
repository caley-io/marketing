import React, { createContext, useContext, useState, ReactNode } from 'react';

type Account = { id: string; email: string; provider: 'gmail' | 'outlook'; };
type Workspace = { id: string; name: string; accounts: Account[] };

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  addAccountToWorkspace: (workspaceId: string, account: Account) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'default', name: 'Personal Workspace', accounts: [] }
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>('default');

  const addWorkspace = (workspace: Workspace) => {
    setWorkspaces((prev) => [...prev, workspace]);
  };

  const addAccountToWorkspace = (workspaceId: string, account: Account) => {
    setWorkspaces((prev) => 
      prev.map((ws) => 
        ws.id === workspaceId 
          ? { ...ws, accounts: [...ws.accounts, account] } 
          : ws
      )
    );
  };

  const contextValue: WorkspaceContextType = {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    addWorkspace,
    addAccountToWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}
