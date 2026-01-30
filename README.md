# @rynko/mcp-server

Rynko MCP server for Claude Desktop - manage templates and generate documents through natural conversation.

## Installation

### Option 1: One-Click Install (Recommended)

**Coming Soon**: Install directly from the Claude Desktop Extensions directory.

Or install from the `.mcpb` bundle:

1. Download `rynko-mcp-{version}.mcpb` from the [releases page](https://github.com/rynko-dev/mcp-server/releases)
2. In Claude Desktop, go to **Settings** → **Extensions**
3. Click **Install from file** and select the downloaded `.mcpb` file
4. Enter your Personal Access Token when prompted
5. Done! Start chatting with Claude about your documents.

### Option 2: NPX (Manual Setup)

Install globally:

```bash
npm install -g @rynko/mcp-server
```

Or use directly with npx (recommended):

```bash
npx @rynko/mcp-server
```

## Manual Setup

### 1. Get a Personal Access Token (PAT)

1. Log in to your [Rynko Dashboard](https://app.rynko.dev)
2. Go to **Settings** → **Personal Access Tokens**
3. Click **Create Token**
4. Enter a label (e.g., "Claude Desktop")
5. Select expiry (max 30 days)
6. Copy the token - it won't be shown again!

### 2. Configure Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rynko": {
      "command": "npx",
      "args": ["-y", "@rynko/mcp-server"],
      "env": {
        "RYNKO_USER_TOKEN": "pat_xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Close and reopen Claude Desktop. You should see "rynko" in your available MCP servers.

## Available Tools

### Workspace Tools

| Tool | Description |
|------|-------------|
| `list_workspaces` | List all workspaces you have access to |
| `get_workspace` | Get details of a specific workspace |

### Template Tools

| Tool | Description |
|------|-------------|
| `list_templates` | List templates in a workspace |
| `get_template` | Get template details and schema |
| `create_draft_template` | Create a new draft template |
| `update_draft_template` | Update a draft template |
| `validate_schema` | Validate template schema |
| `get_schema_reference` | Get template schema documentation |

### Data Tools

| Tool | Description |
|------|-------------|
| `parse_data_file` | Parse Excel or CSV data to JSON |
| `map_variables` | Auto-map data columns to template variables |

### Generation Tools

| Tool | Description |
|------|-------------|
| `preview_template` | Generate a preview document |
| `generate_document` | Generate a production document |
| `get_job_status` | Check document generation status |

## Example Usage

Once configured, you can have natural conversations with Claude:

> **You:** Create an invoice template with company logo, client details, and line items table.
>
> **Claude:** I'll create that for you. Let me check your workspaces first...
>
> *[Creates template using Rynko tools]*

> **You:** Generate an invoice for Acme Corp with 3 line items totaling $1,500.
>
> **Claude:** I'll generate that invoice now...
>
> *[Generates PDF using your template]*

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RYNKO_USER_TOKEN` | Yes | Your Personal Access Token (starts with `pat_`) |
| `RYNKO_API_URL` | No | Custom API URL (default: `https://api.rynko.dev/api`) |

## Security

- **Token Expiry**: PATs expire after max 30 days
- **Draft-Only**: Templates created via MCP are drafts until manually published
- **Audit Logging**: All operations are logged in your team's activity feed
- **Revocable**: Instantly revoke tokens from your dashboard

## Troubleshooting

### "Invalid token" error

- Verify your token starts with `pat_`
- Check if the token has expired
- Generate a new token from your dashboard

### "Failed to connect" error

- Check your internet connection
- Verify the Rynko API is accessible
- Try regenerating your PAT

### Claude Desktop not finding the server

- Check your config file JSON syntax
- Ensure `npx` is in your PATH
- Restart Claude Desktop completely

## Documentation

- [Full Integration Guide](https://docs.rynko.dev/integrations/mcp-integration)
- [Template Schema Reference](https://docs.rynko.dev/developer-guide/template-schema)
- [API Documentation](https://docs.rynko.dev/api/)

## Support

- **Email**: support@rynko.dev
- **Issues**: [GitHub Issues](https://github.com/rynko-dev/mcp-server/issues)

## Building from Source

### Build the MCPB Bundle

To build the Claude Desktop extension bundle:

```bash
cd integrations/mcp-server
npm install
npm run build:mcpb
```

This creates:
- `dist-mcpb/rynko-mcp-{version}.mcpb` - The extension bundle
- `dist-mcpb/rynko-mcp-{version}.mcpb.sha256` - Checksum file

### Bundle Contents

```
rynko-mcp-{version}.mcpb
├── manifest.json     # Extension metadata and configuration
├── server/           # Compiled server code
│   ├── index.js
│   └── client.js
└── icon.png          # Extension icon (optional)
```

## Directory Submission

To submit to the Claude Desktop Extensions directory:

1. Build the MCPB bundle: `npm run build:mcpb`
2. Test locally by installing via "Install from file"
3. Submit via [Anthropic's Extension Submission Form](https://forms.gle/...)
4. Include:
   - Extension name and description
   - Privacy policy URL
   - Terms of service URL
   - 3+ usage examples
   - Safety annotations (data access, network access)

## License

MIT
