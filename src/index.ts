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

// Create MCP server
const server = new Server(
  {
    name: 'rynko-mcp',
    version: '1.0.7',
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
    log(`Returning ${tools.length} tools`);

    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
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
