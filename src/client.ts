/**
 * Renderbase API Client
 *
 * HTTP client for communicating with the Renderbase MCP Documents API.
 */

export interface McpToolCallResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface ServerInfo {
  name: string;
  version: string;
  description: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
}

export class RenderbaseClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    this.baseUrl = baseUrl || 'https://api.renderbase.dev/api';
  }

  /**
   * Get server info
   */
  async getServerInfo(): Promise<ServerInfo> {
    const response = await this.request<ServerInfo>('GET', '/mcp-documents');
    return response;
  }

  /**
   * List available tools
   */
  async listTools(): Promise<{ tools: McpToolDefinition[] }> {
    const response = await this.request<{ tools: McpToolDefinition[] }>(
      'GET',
      '/mcp-documents/tools'
    );
    return response;
  }

  /**
   * Execute a tool call
   */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<McpToolCallResponse> {
    const response = await this.request<McpToolCallResponse>(
      'POST',
      '/mcp-documents/tools/call',
      { name, arguments: args }
    );
    return response;
  }

  /**
   * Make an HTTP request to the Renderbase API
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
      'User-Agent': '@renderbase/mcp-server/1.0.0',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }

      throw new Error(`Renderbase API error: ${errorMessage}`);
    }

    return response.json() as Promise<T>;
  }
}
