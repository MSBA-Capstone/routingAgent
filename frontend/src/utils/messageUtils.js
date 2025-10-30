// Message utility functions
export const createMessage = (role, text, extra = {}) => ({
  id: `${role[0]}-${Date.now()}-${Math.random()}`,
  role,
  text,
  ...extra,
});

export const updateMessage = (messages, messageId, updates) =>
  messages.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg);

export const addMessage = (messages, message) => [...messages, message];

export const replaceMessage = (messages, oldId, newMessage) =>
  messages.map(msg => msg.id === oldId ? newMessage : msg);