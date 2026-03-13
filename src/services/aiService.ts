const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL ?? 'qwen3.5-plus';

export interface AIResponse {
  action: 'create_document' | 'create_whiteboard' | 'create_database' | 'chat';
  reply: string;
  title?: string;
  documentContent?: string;
  databaseContent?: {
    columns: { name: string; type: 'text' | 'status'; options?: string[] }[];
    rows: Record<string, any>[];
  };
  whiteboardContent?: {
    nodes: { id: string; text: string; type: 'rectangle' | 'ellipse'; x: number; y: number }[];
    edges: { from: string; to: string; text?: string }[];
  };
}

interface RawAIResponse extends Record<string, any> {
  action?: string;
  reply?: string;
  title?: string;
  documentContent?: string;
  content?: string;
  payload?: Record<string, any>;
  databaseContent?: AIResponse['databaseContent'];
  whiteboardContent?: AIResponse['whiteboardContent'];
  nodes?: Array<Record<string, any>>;
  edges?: Array<Record<string, any>>;
  columns?: Array<Record<string, any>>;
  rows?: Array<Record<string, any>>;
}

type IntentAction = AIResponse['action'];

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    action: {
      type: 'string',
      enum: ['create_document', 'create_whiteboard', 'create_database', 'chat'],
    },
    reply: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    documentContent: {
      type: 'string',
    },
    databaseContent: {
      type: 'object',
      additionalProperties: false,
      properties: {
        columns: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['text', 'status'] },
              options: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['name', 'type'],
          },
        },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      required: ['columns', 'rows'],
    },
    whiteboardContent: {
      type: 'object',
      additionalProperties: false,
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              type: { type: 'string', enum: ['rectangle', 'ellipse'] },
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['id', 'text', 'type', 'x', 'y'],
          },
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              text: { type: 'string' },
            },
            required: ['from', 'to'],
          },
        },
      },
      required: ['nodes', 'edges'],
    },
  },
  required: ['action', 'reply'],
};

function normalizeAIResponse(raw: RawAIResponse): AIResponse {
  const payload = raw.payload && typeof raw.payload === 'object' ? raw.payload : undefined;
  const action =
    raw.action === 'create_document' ||
    raw.action === 'create_whiteboard' ||
    raw.action === 'create_database' ||
    raw.action === 'chat'
      ? raw.action
      : 'chat';

  const whiteboardSource = (payload?.whiteboardContent as RawAIResponse['whiteboardContent']) ?? raw.whiteboardContent;
  const whiteboardNodes = (payload?.nodes as Array<Record<string, any>> | undefined) ?? raw.nodes;
  const whiteboardEdges = (payload?.edges as Array<Record<string, any>> | undefined) ?? raw.edges;
  const whiteboardContent =
    whiteboardSource ??
    (Array.isArray(whiteboardNodes) || Array.isArray(whiteboardEdges)
      ? {
          nodes: (whiteboardNodes ?? []).map((node, index) => ({
            id: String(node.id ?? index + 1),
            text: String(node.text ?? node.label ?? ''),
            type: node.type === 'ellipse' ? 'ellipse' : 'rectangle',
            x: Number(node.x ?? 0),
            y: Number(node.y ?? 0),
          })),
          edges: (whiteboardEdges ?? []).map((edge) => ({
            from: String(edge.from ?? ''),
            to: String(edge.to ?? ''),
            text:
              edge.text != null || edge.label != null
                ? String(edge.text ?? edge.label)
                : undefined,
          })),
        }
      : undefined);

  const databaseSource = (payload?.databaseContent as AIResponse['databaseContent']) ?? raw.databaseContent;
  const databaseColumns = (payload?.columns as Array<Record<string, any>> | undefined) ?? raw.columns;
  const databaseRows = (payload?.rows as Array<Record<string, any>> | undefined) ?? raw.rows;
  const databaseContent =
    databaseSource ??
    (Array.isArray(databaseColumns) && Array.isArray(databaseRows)
      ? {
          columns: databaseColumns.map((column) => ({
            name: String(column.name ?? column.label ?? 'Column'),
            type: column.type === 'status' ? 'status' : 'text',
            options: Array.isArray(column.options) ? column.options.map(String) : undefined,
          })),
          rows: databaseRows as Record<string, any>[],
        }
      : undefined);

  const documentContent =
    typeof payload?.documentContent === 'string'
      ? payload.documentContent
      : typeof payload?.content === 'string'
        ? payload.content
        : typeof raw.documentContent === 'string'
          ? raw.documentContent
          : typeof raw.content === 'string'
            ? raw.content
            : undefined;

  let reply = typeof raw.reply === 'string' && raw.reply.trim() ? raw.reply.trim() : '';

  if (!reply) {
    if (action === 'create_whiteboard') reply = 'I created a whiteboard for you.';
    else if (action === 'create_document') reply = 'I created a document for you.';
    else if (action === 'create_database') reply = 'I created a database for you.';
    else reply = typeof raw.message === 'string' ? raw.message : 'Done.';
  }

  return {
    action,
    reply,
    title:
      typeof payload?.title === 'string'
        ? payload.title
        : typeof raw.title === 'string'
          ? raw.title
          : undefined,
    documentContent,
    databaseContent,
    whiteboardContent,
  };
}

function extractJson(text: string): AIResponse {
  try {
    return normalizeAIResponse(JSON.parse(text) as RawAIResponse);
  } catch {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i) ?? text.match(/(\{[\s\S]*\})/);
    if (!match) {
      throw new Error('Model returned non-JSON content');
    }
    return normalizeAIResponse(JSON.parse(match[1]) as RawAIResponse);
  }
}

function detectIntent(prompt: string): IntentAction {
  const normalized = prompt.toLowerCase();

  const documentPatterns = [
    '文档',
    '文章',
    'write a document',
    'create a document',
    'markdown',
    'doc',
    'report',
    '总结',
    '说明书',
  ];
  const whiteboardPatterns = [
    '白板',
    '架构图',
    '流程图',
    'diagram',
    'whiteboard',
    'mind map',
    '脑图',
  ];
  const databasePatterns = [
    '表格',
    '数据库',
    '表',
    'table',
    'database',
    'kanban',
    '看板',
  ];

  if (documentPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'create_document';
  }
  if (whiteboardPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'create_whiteboard';
  }
  if (databasePatterns.some((pattern) => normalized.includes(pattern))) {
    return 'create_database';
  }
  return 'chat';
}

function hasPayloadForAction(response: AIResponse): boolean {
  if (response.action === 'create_document') return Boolean(response.documentContent?.trim());
  if (response.action === 'create_whiteboard') return Boolean(response.whiteboardContent?.nodes?.length);
  if (response.action === 'create_database') return Boolean(response.databaseContent?.columns?.length);
  return true;
}

async function requestAI(prompt: string, forcedAction?: IntentAction): Promise<AIResponse> {
  const intentInstruction =
    forcedAction && forcedAction !== 'chat'
      ? `The user explicitly wants ${forcedAction}. You must return action="${forcedAction}" and include the corresponding payload. Do not choose another action.`
      : 'Choose the action strictly based on the user request.';

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DASHSCOPE_MODEL,
      temperature: 0.2,
      enable_thinking: false,
      messages: [
        {
          role: 'system',
          content:
            `You are an AI assistant in a workspace app. Return JSON only. If the user asks to write a document, use action "create_document". If they ask to draw a diagram, architecture, or whiteboard, use action "create_whiteboard" and provide nodes and edges. If they ask to create a table or database, use action "create_database" and provide columns and rows. Otherwise use action "chat". ${intentInstruction}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'workspace_response',
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('DashScope returned an unexpected response shape');
  }

  return extractJson(content);
}

export const processAIRequest = async (prompt: string): Promise<AIResponse> => {
  const detectedIntent = detectIntent(prompt);
  const firstResponse = await requestAI(prompt, detectedIntent);

  if (
    detectedIntent !== 'chat' &&
    (firstResponse.action !== detectedIntent || !hasPayloadForAction(firstResponse))
  ) {
    const retryResponse = await requestAI(
      `${prompt}\n\nImportant: the requested output type is ${detectedIntent}. Return that action only.`,
      detectedIntent
    );

    if (retryResponse.action === detectedIntent && hasPayloadForAction(retryResponse)) {
      return retryResponse;
    }
  }

  return firstResponse;
};
