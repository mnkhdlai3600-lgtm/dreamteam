export type CheckTextMessage = {
  type: "CHECK_TEXT";
  payload?: {
    text?: string;
  };
};

export type PingMessage = {
  type: "PING";
};

export type DocsReplaceMessage = {
  type: "DOCS_DEBUGGER_REPLACE";
  payload?: {
    text?: string;
  };
};

export type DocsDetachMessage = {
  type: "DOCS_DEBUGGER_DETACH";
};

export type IncomingMessage =
  | CheckTextMessage
  | PingMessage
  | DocsReplaceMessage
  | DocsDetachMessage;
