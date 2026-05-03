import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface ChatContextValue {
  agentId: string | null;
  open: (agentId: string) => void;
  close: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [agentId, setAgentId] = useState<string | null>(null);

  const open  = useCallback((id: string) => setAgentId(id), []);
  const close = useCallback(() => setAgentId(null), []);

  const value = useMemo<ChatContextValue>(() => ({ agentId, open, close }), [agentId, open, close]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
