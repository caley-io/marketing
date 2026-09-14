/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { WorkspaceProvider, useWorkspace } from '../providers/WorkspaceProvider';

describe('WorkspaceProvider', () => {
  it('initializes with default workspace and active id', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider>{children}</WorkspaceProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    expect(result.current.activeWorkspaceId).toBe('default');
    expect(result.current.workspaces).toHaveLength(1);
    expect(result.current.workspaces[0].name).toBe('Personal Workspace');
  });

  it('allows adding workspaces and switching active workspace', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider>{children}</WorkspaceProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    act(() => {
      result.current.addWorkspace({
        id: 'team-marketing',
        name: 'Marketing Team',
        accounts: [],
      });
      result.current.setActiveWorkspaceId('team-marketing');
    });

    expect(result.current.activeWorkspaceId).toBe('team-marketing');
    expect(result.current.workspaces).toHaveLength(2);
    expect(result.current.workspaces[1].name).toBe('Marketing Team');
  });

  it('allows adding accounts to a specific workspace', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider>{children}</WorkspaceProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    act(() => {
      result.current.addAccountToWorkspace('default', {
        id: 'acc-1',
        email: 'dev@company.com',
        provider: 'gmail',
      });
    });

    expect(result.current.workspaces[0].accounts).toHaveLength(1);
    expect(result.current.workspaces[0].accounts[0].email).toBe('dev@company.com');
  });

  it('throws error when useWorkspace is used outside WorkspaceProvider', () => {
    expect(() => {
      renderHook(() => useWorkspace());
    }).toThrow('useWorkspace must be used within a WorkspaceProvider');
  });
});
