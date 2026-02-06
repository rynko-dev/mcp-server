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

### Asset Tools

| Tool | Description |
|------|-------------|
| `list_assets` | List image assets in your library |
| `upload_asset` | Upload an image (base64 or URL) to your asset library |

### Generation Tools

| Tool | Description |
|------|-------------|
| `preview_template` | Generate a preview document (free, no credits used) |
| `generate_document` | Generate a production document (uses credits) |
| `get_job_status` | Check document generation status |

#### generate_document Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `workspace_id` | Yes | The workspace ID |
| `template_id` | Yes | The template ID to generate from |
| `variables` | Yes | Variable values for the document |
| `format` | No | Output format: `pdf` (default) or `excel` |
| `filename` | No | Custom filename (without extension) |
| `use_draft` | No | Use draft version instead of published (default: false) |
| `use_credits` | No | Use premium credits to generate without watermark (default: false) |
| `metadata` | No | Custom key-value metadata for the document job |

**Note on Watermarks:** Free tier documents include a watermark. Set `use_credits: true` to generate watermark-free documents using your purchased premium credits.

## Example Usage

Once configured, you can have natural conversations with Claude. Here are detailed examples of how to use each tool:

### Example 1: List Templates and Generate a Document

**User Prompt:**
> "Show me all the templates in my workspace and generate an invoice for Acme Corp"

**Expected Behavior:**
1. Claude calls `list_workspaces` to find your workspaces
2. Claude calls `list_templates` with your workspace ID
3. Claude displays available templates
4. Claude calls `get_template` to get the invoice template's variable schema
5. Claude calls `generate_document` with the template ID and variables:
   ```json
   {
     "workspace_id": "ws_xxx",
     "template_id": "invoice-template",
     "variables": {
       "customerName": "Acme Corp",
       "invoiceNumber": "INV-2024-001",
       "items": [{"name": "Consulting", "quantity": 10, "price": 150}],
       "total": 1500
     },
     "format": "pdf"
   }
   ```
6. Claude returns the download URL for the generated PDF

### Example 2: Preview Before Generating (Free)

**User Prompt:**
> "I want to test my new report template before using credits. Preview it with sample data."

**Expected Behavior:**
1. Claude calls `list_templates` to find the report template
2. Claude calls `get_template` to understand required variables
3. Claude calls `preview_template` with sample data:
   ```json
   {
     "workspace_id": "ws_xxx",
     "template_id": "monthly-report",
     "variables": {
       "reportTitle": "Q4 Sales Report",
       "reportDate": "2024-12-31",
       "metrics": [{"name": "Revenue", "value": "$125,000"}]
     },
     "format": "pdf",
     "version": "draft"
   }
   ```
4. Claude provides a preview URL (valid for 5 minutes, no credits used)
5. User reviews the preview and confirms it looks correct

### Example 3: Create a New Template from Scratch

**User Prompt:**
> "Create a professional certificate template with recipient name, course title, completion date, and a signature line"

**Expected Behavior:**
1. Claude calls `get_schema_reference` to understand the template schema format
2. Claude calls `list_workspaces` to find where to create the template
3. Claude calls `create_draft_template` with the full schema:
   ```json
   {
     "workspace_id": "ws_xxx",
     "name": "Course Certificate",
     "description": "Professional certificate for course completion",
     "format": "pdf",
     "schema": {
       "pages": [{
         "id": "page-1",
         "components": [
           {"id": "title", "type": "heading", "props": {"level": 1, "text": "Certificate of Completion"}},
           {"id": "recipient", "type": "rich-text", "props": {}, "content": "This certifies that <strong>{{recipientName}}</strong>..."}
         ]
       }]
     },
     "variables": [
       {"name": "recipientName", "type": "string", "label": "Recipient Name"},
       {"name": "courseTitle", "type": "string", "label": "Course Title"},
       {"name": "completionDate", "type": "date", "label": "Completion Date"}
     ]
   }
   ```
4. Claude confirms the draft was created and provides a link to the visual designer for final adjustments

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

## Privacy Policy

This extension connects to Rynko's API to manage templates and generate documents. By using this extension, you agree to Rynko's Privacy Policy.

**Data Collection & Usage:**
- **Authentication**: Your Personal Access Token is stored securely using the operating system's credential manager (Keychain on macOS, Credential Manager on Windows)
- **Template Data**: Template schemas and variables are transmitted to Rynko's servers for document generation
- **Document Variables**: Data you provide for document generation is processed on Rynko's servers to render documents
- **Generated Documents**: Documents are stored temporarily (configurable retention period) and accessible via secure, time-limited URLs

**Data Sharing:**
- We do not sell or share your data with third parties
- Data is processed solely for the purpose of generating your documents

**Data Retention:**
- Generated documents are retained based on your subscription tier's retention policy
- You can delete documents at any time from your Rynko dashboard

**Full Privacy Policy:** [https://www.rynko.dev/privacy](https://www.rynko.dev/privacy)

**Contact:** For privacy-related inquiries, contact privacy@rynko.dev

## License

MIT
