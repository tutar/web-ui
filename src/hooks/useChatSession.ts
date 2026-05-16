import { useState, useCallback, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface MessageContentItem {
  type: 'text' | 'image' | 'video' | 'tool_call';
  text?: string;
  url?: string;
  toolCallId?: string;
  toolName?: string;
  status?: 'started' | 'completed' | 'error';
  arguments?: string;
  result?: string;
  error?: string;
}

export interface MessageEntry {
  id: string;
  parentId: string | null;
  createdAt: string;
  messageType: 'user' | 'process' | 'assistant';
  content: MessageContentItem[];
  // For UI state tracking:
  processSteps?: any[];
}

export interface SessionData {
  sessionId: string;
  sessionName: string;
  status: 'idle' | 'running' | 'error';
}

const API_BASE_URL = 'https://70ef-27-38-208-224.ngrok-free.app';

export function useChatSession(initialSessionId?: string, onSessionCreated?: (sessionId: string) => void) {
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeAssistantEntryId = useRef<string | null>(null);

  const fetchSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSession({
          sessionId: data.sessionId,
          sessionName: data.sessionName,
          status: data.status,
        });
        setMessages(data.entries || []);
      }
    } catch (e) {
      console.error('Failed to fetch session', e);
    }
  }, []);

  const handleSSEMessage = useCallback((event: string, data: any) => {
    console.log('[SSE]', event, data);
    switch (event) {
      case 'session.created':
        setSession({
          sessionId: data.sessionId,
          sessionName: data.sessionName,
          status: 'running',
        });
        if (onSessionCreated) onSessionCreated(data.sessionId);
        break;
      case 'message.accepted':
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.entry.id)) return prev;
          return [...prev, data.entry];
        });
        break;
      case 'process.delta':
        setMessages((prev) => {
          // Find assistant message, if not exists map to a new entry
          let exists = false;
          let newMessages = prev.map((m) => {
            if (m.id === data.entryId) {
              exists = true;
              return {
                ...m,
                processSteps: [...(m.processSteps || []), { type: 'reasoning', content: data.text, id: Math.random().toString() }]
              };
            }
            return m;
          });
          
          if (!exists) {
            newMessages.push({
              id: data.entryId,
              parentId: data.parentId,
              createdAt: new Date().toISOString(),
              messageType: 'assistant',
              content: [], // text comes in final.output.delta
              processSteps: [{ type: 'reasoning', content: data.text, id: Math.random().toString() }]
            });
          }
          return newMessages;
        });
        break;
      case 'action.started':
        setMessages((prev) => {
          let exists = false;
          let newMessages = prev.map((m) => {
            if (m.id === data.entryId) {
              exists = true;
              return {
                ...m,
                processSteps: [...(m.processSteps || []), { 
                  type: 'tool_call', 
                  title: `Tool: ${data.name}`, 
                  content: data.arguments || '{}',
                  id: data.toolCallId
                }]
              };
            }
            return m;
          });
          if (!exists) {
            newMessages.push({
              id: data.entryId,
              parentId: data.parentId,
              createdAt: new Date().toISOString(),
              messageType: 'assistant',
              content: [],
              processSteps: [{ 
                type: 'tool_call', 
                title: `Tool: ${data.name}`, 
                content: data.arguments || '{}',
                id: data.toolCallId
              }]
            });
          }
          return newMessages;
        });
        break;
      case 'action.completed':
        setMessages((prev) => {
          return prev.map((m) => {
            if (m.id === data.entryId) {
              return {
                ...m,
                processSteps: [...(m.processSteps || []), { 
                  type: 'tool_result', 
                  title: `Result: ${data.name}`, 
                  content: data.result || '',
                  id: data.toolCallId + '_result'
                }]
              };
            }
            return m;
          });
        });
        break;
      case 'action.failed':
        setMessages((prev) => {
          return prev.map((m) => {
            if (m.id === data.entryId) {
              return {
                ...m,
                processSteps: [...(m.processSteps || []), { 
                  type: 'tool_result', 
                  title: `Error: ${data.name}`, 
                  content: data.error || 'Failed',
                  id: data.toolCallId + '_error'
                }]
              };
            }
            return m;
          });
        });
        break;
      case 'final.output.delta':
        setMessages((prev) => {
          let exists = false;
          let newMessages = prev.map((m) => {
            if (m.id === data.entryId) {
              exists = true;
              const newContent = [...(m.content || [])];
              let textItem = newContent.find((c) => c.type === 'text');
              if (textItem) {
                textItem.text = (textItem.text || '') + data.text;
              } else {
                newContent.push({ type: 'text', text: data.text });
              }
              return { ...m, content: newContent };
            }
            return m;
          });
          if (!exists) {
            newMessages.push({
              id: data.entryId,
              parentId: data.parentId,
              createdAt: new Date().toISOString(),
              messageType: 'assistant',
              content: [{ type: 'text', text: data.text }],
            });
          }
          return newMessages;
        });
        break;
      case 'final.output.completed':
        setSession((prev) => (prev ? { ...prev, status: 'idle' } : null));
        setIsLoading(false);
        break;
      case 'run.failed':
      case 'run.cancelled':
        setSession((prev) => (prev ? { ...prev, status: event === 'run.failed' ? 'error' : 'idle' } : null));
        setIsLoading(false);
        break;
    }
  }, [onSessionCreated]);

  const sendMessage = useCallback(async (content: string, currentSessionId?: string | null) => {
    setIsLoading(true);
    
    // Create local user message optimistic
    const userMessageId = `temp_user_${Date.now()}`;
    const userMessage: MessageEntry = {
      id: userMessageId,
      parentId: messages.length > 0 ? messages[messages.length - 1].id : null,
      createdAt: new Date().toISOString(),
      messageType: 'user',
      content: [{ type: 'text', text: content }],
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setSession((prev) => (prev ? { ...prev, status: 'running' } : null));

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;

    const url = currentSessionId 
      ? `${API_BASE_URL}/sessions/${currentSessionId}/messages`
      : `${API_BASE_URL}/sessions`;

    try {
      await fetchEventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: currentSessionId ? undefined : 'deepseek/deepseek-v4-pro', 
          thinkingLevel: currentSessionId ? undefined : 'medium',
          input: {
            content: [{ type: 'text', text: content }]
          }
        }),
        signal: ctrl.signal,
        async onopen(response) {
          if (response.ok) {
            return; // everything's good
          } else {
            console.error('Server returned an error', response.status);
          }
        },
        onmessage(msg) {
          if (msg.event && msg.data) {
            try {
              const data = JSON.parse(msg.data);
              handleSSEMessage(msg.event, data);
            } catch (e) {
              console.error('Parse SSE data error', e);
            }
          }
        },
        onclose() {
          setIsLoading(false);
          setSession((prev) => (prev ? { ...prev, status: 'idle' } : null));
        },
        onerror(err) {
          console.error('SSE Error', err);
          setIsLoading(false);
          setSession((prev) => (prev ? { ...prev, status: 'error' } : null));
          throw err;
        }
      });
    } catch (e) {
      setIsLoading(false);
    }
  }, [messages, handleSSEMessage]);

  const cancelRun = useCallback(async () => {
    if (session?.sessionId && session.status === 'running') {
      try {
        await fetch(`${API_BASE_URL}/sessions/${session.sessionId}/cancel`, {
          method: 'POST'
        });
      } catch (e) {
        console.error('Failed to cancel session', e);
      }
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setSession((prev) => (prev ? { ...prev, status: 'idle' } : null));
  }, [session]);

  // Optionally clean up on unmount
  // useEffect(() => {
  //   return () => {
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //     }
  //   };
  // }, []);

  return {
    messages,
    session,
    isLoading,
    sendMessage,
    cancelRun,
    fetchSession,
  };
}
