import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export const processAIRequest = async (prompt: string): Promise<AIResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `You are an AI assistant in a workspace app. The user wants you to do something.
    If they ask to write a document, use action 'create_document'.
    If they ask to draw a diagram/architecture/whiteboard, use action 'create_whiteboard' and provide nodes and edges.
    If they ask to create a table/database, use action 'create_database' and provide columns and rows.
    If it's just a general question, use action 'chat'.

    User request: ${prompt}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: "The action to take based on the user's request.",
            enum: ["create_document", "create_whiteboard", "create_database", "chat"]
          },
          reply: {
            type: Type.STRING,
            description: "A friendly reply to the user explaining what you did or answering their question."
          },
          title: {
            type: Type.STRING,
            description: "The title for the new page being created."
          },
          documentContent: {
            type: Type.STRING,
            description: "Markdown content if action is create_document."
          },
          databaseContent: {
            type: Type.OBJECT,
            properties: {
              columns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, description: "Must be 'text' or 'status'" },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required if type is 'status'" }
                  }
                }
              },
              rows: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  description: "Key-value pairs matching column names to values"
                }
              }
            }
          },
          whiteboardContent: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Unique ID for the node, e.g., 'node1'" },
                    text: { type: Type.STRING, description: "Text to display inside the node" },
                    type: { type: Type.STRING, description: "Shape type", enum: ["rectangle", "ellipse"] },
                    x: { type: Type.NUMBER, description: "X coordinate (e.g., 0, 200, 400)" },
                    y: { type: Type.NUMBER, description: "Y coordinate (e.g., 0, 200, 400)" }
                  }
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    from: { type: Type.STRING, description: "ID of the source node" },
                    to: { type: Type.STRING, description: "ID of the target node" },
                    text: { type: Type.STRING, description: "Optional text on the edge" }
                  }
                }
              }
            }
          }
        },
        required: ["action", "reply"]
      },
      temperature: 0.2
    }
  });

  return JSON.parse(response.text || '{}');
};
