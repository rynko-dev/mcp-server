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

// Get configuration from environment
const RYNKO_USER_TOKEN = process.env.RYNKO_USER_TOKEN;
const RYNKO_API_URL = process.env.RYNKO_API_URL;

// Validate token
if (!RYNKO_USER_TOKEN) {
  console.error('Error: RYNKO_USER_TOKEN environment variable is required');
  console.error('');
  console.error('Get a Personal Access Token from your Rynko dashboard:');
  console.error('  Settings → Personal Access Tokens → Create Token');
  console.error('');
  console.error('Then set it in your environment or Claude Desktop config.');
  process.exit(1);
}

if (!RYNKO_USER_TOKEN.startsWith('pat_')) {
  console.error('Error: Invalid token format. Token must start with "pat_"');
  process.exit(1);
}

// Initialize API client
const client = new RynkoClient(RYNKO_USER_TOKEN, RYNKO_API_URL);

// Create MCP server
const server = new Server(
  {
    name: 'rynko-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle list tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    const { tools } = await client.listTools();

    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${message}`);
  }
});

/**
 * Handle tool call request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await client.callTool(name, args || {});

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
  // Verify connection to Rynko API
  try {
    await client.getServerInfo();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to connect to Rynko API: ${message}`);
    console.error('');
    console.error('Please check:');
    console.error('  1. Your token is valid and not expired');
    console.error('  2. You have network connectivity');
    console.error('  3. The Rynko API is accessible');
    process.exit(1);
  }

  // Start the server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
