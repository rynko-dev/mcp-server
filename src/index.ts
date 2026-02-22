#!/usr/bin/env node

/**
 * Rynko MCP Server
 *
 * Model Context Protocol server for Claude Desktop integration.
 * Enables AI assistants to manage templates and generate documents
 * through natural conversation.
 *
 * Usage:
 *   RYNKO_USER_TOKEN=pat_xxx npx @rynko/mcp-server
 *
 * Or configure in Claude Desktop's config file:
 *   {
 *     "mcpServers": {
 *       "rynko": {
 *         "command": "npx",
 *         "args": ["-y", "@rynko/mcp-server"],
 *         "env": {
 *           "RYNKO_USER_TOKEN": "pat_xxxxxxxxxxxxxxxx"
 *         }
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { RynkoClient } from './client.js';

// Log to stderr so it appears in Claude Desktop logs
function log(message: string) {
  console.error(`[rynko-mcp] ${message}`);
}

// Get configuration from environment
const RYNKO_USER_TOKEN = process.env.RYNKO_USER_TOKEN;
const RYNKO_API_URL = process.env.RYNKO_API_URL;

log(`Starting Rynko MCP Server...`);
log(`Token present: ${!!RYNKO_USER_TOKEN}`);
log(`API URL: ${RYNKO_API_URL || 'https://api.rynko.dev/api (default)'}`);

// Validate token
if (!RYNKO_USER_TOKEN) {
  log('ERROR: RYNKO_USER_TOKEN environment variable is required');
  log('Get a Personal Access Token from your Rynko dashboard:');
  log('  Settings → Personal Access Tokens → Create Token');
  process.exit(1);
}

if (!RYNKO_USER_TOKEN.startsWith('pat_')) {
  log('ERROR: Invalid token format. Token must start with "pat_"');
  process.exit(1);
}

// Initialize API client
const client = new RynkoClient(RYNKO_USER_TOKEN, RYNKO_API_URL);

// ── Session state: environment selection ──
// Per-session (per-process) environment tracking. The AI must call
// list_workspaces, confirm the choice with the user, then call
// select_environment before any environment-scoped tool will execute.
let selectedEnvironmentId: string | null = null;

// Tools that do NOT require an environment to be selected first.
const ENVIRONMENT_FREE_TOOLS = new Set([
  'list_workspaces',
  'select_environment',
  'get_sdk_examples',
  'parse_data_file',
  'validate_schema',
  'get_schema_reference',
  'get_job_status',
]);

// The select_environment tool definition — injected client-side, not from the backend.
const SELECT_ENVIRONMENT_TOOL = {
  name: 'select_environment',
  description:
    'Select the environment for this session. You MUST call list_workspaces first, present the options to the user, and let them choose before calling this tool. All subsequent environment-scoped operations (templates, documents, assets) will require the workspace_id to match the selected environment. Call this again to switch environments.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workspace_id: {
        type: 'string',
        description: 'The environment ID chosen by the user from the list_workspaces results.',
      },
    },
    required: ['workspace_id'],
  },
};

// Create MCP server
const server = new Server(
  {
    name: 'rynko-mcp',
    version: '1.0.17',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

log('Server instance created');

/**
 * Handle list tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log('Handling ListTools request');
  try {
    const { tools } = await client.listTools();

    // Inject the select_environment tool at the start
    const allTools = [
      SELECT_ENVIRONMENT_TOOL,
      ...tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    ];

    log(`Returning ${allTools.length} tools (${tools.length} from backend + select_environment)`);
    return { tools: allTools };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log(`ERROR in ListTools: ${message}`);
    throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${message}`);
  }
});

/**
 * Handle tool call request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  log(`Handling CallTool request: ${name}`);

  // ── Handle select_environment locally ──
  if (name === 'select_environment') {
    const workspaceId = (args as Record<string, unknown>)?.workspace_id as string | undefined;
    if (!workspaceId) {
      return {
        content: [{ type: 'text' as const, text: 'Error: workspace_id is required.' }],
        isError: true,
      };
    }
    selectedEnvironmentId = workspaceId;
    log(`Environment selected: ${workspaceId}`);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Environment ${workspaceId} selected for this session. You can now use template, document, and asset tools with this environment.`,
        },
      ],
      isError: false,
    };
  }

  // ── Enforce environment selection for environment-scoped tools ──
  if (!ENVIRONMENT_FREE_TOOLS.has(name)) {
    if (!selectedEnvironmentId) {
      log(`BLOCKED ${name}: no environment selected`);
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: No environment selected. Before using this tool you must:\n\n'
              + '1. Call list_workspaces to see available environments\n'
              + '2. Ask the user which environment to use\n'
              + '3. Call select_environment with the chosen workspace_id\n\n'
              + 'Then retry this operation.',
          },
        ],
        isError: true,
      };
    }

    // Validate that workspace_id in args matches the selected environment
    const passedWorkspaceId = (args as Record<string, unknown>)?.workspace_id as string | undefined;
    if (passedWorkspaceId && passedWorkspaceId !== selectedEnvironmentId) {
      log(`BLOCKED ${name}: environment_id mismatch (passed=${passedWorkspaceId}, selected=${selectedEnvironmentId})`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: environment_id "${passedWorkspaceId}" does not match the selected environment "${selectedEnvironmentId}". `
              + 'Call select_environment with the new workspace_id first if you want to switch environments.',
          },
        ],
        isError: true,
      };
    }
  }

  // ── Forward to backend ──
  try {
    const result = await client.callTool(name, args || {});
    log(`Tool ${name} completed successfully`);

    // Convert response to MCP format
    return {
      content: result.content.map((item) => {
        if (item.type === 'text') {
          return {
            type: 'text' as const,
            text: item.text || '',
          };
        }
        if (item.type === 'image' && item.data) {
          return {
            type: 'image' as const,
            data: item.data,
            mimeType: item.mimeType || 'image/png',
          };
        }
        // Default to text
        return {
          type: 'text' as const,
          text: JSON.stringify(item),
        };
      }),
      isError: result.isError,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log(`ERROR in CallTool ${name}: ${message}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Main entry point
 */
async function main() {
  log('Starting main()...');

  try {
    // Start the server with stdio transport immediately
    // Don't verify API connection upfront - let it fail gracefully when tools are called
    const transport = new StdioServerTransport();
    log('Transport created, connecting...');

    await server.connect(transport);
    log('Server connected to transport successfully');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      log('Received SIGINT, shutting down...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      log('Received SIGTERM, shutting down...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log(`FATAL ERROR in main(): ${message}`);
    if (error instanceof Error && error.stack) {
      log(error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  log(`FATAL: Unhandled error: ${error}`);
  process.exit(1);
});
