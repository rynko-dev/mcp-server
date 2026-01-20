# Claude Desktop Extensions Directory Submission Guide

This guide covers how to submit the Renderbase MCP server to the Claude Desktop Extensions directory for one-click installation.

## Prerequisites

1. **Built and tested MCPB bundle**: Run `npm run build:mcpb`
2. **Privacy Policy**: Published at https://www.renderbase.dev/privacy
3. **Terms of Service**: Published at https://www.renderbase.dev/terms
4. **Extension icon**: 512x512 PNG at `mcpb/icon.png`

## Submission Checklist

### Required Information

| Field | Value |
|-------|-------|
| Extension Name | Renderbase - Document Generation |
| Short Description | Generate PDFs and Excel documents with AI |
| Publisher | Renderbase |
| Category | Productivity, Developer Tools, Business |
| Website | https://www.renderbase.dev |
| Documentation | https://docs.renderbase.dev/integrations/mcp-integration |
| Support Email | support@renderbase.dev |
| GitHub Repository | https://github.com/renderbase/renderbase |

### Safety Annotations

- **Data Access**: `user_data` - Accesses user's templates and documents
- **Network Access**: `true` - Connects to Renderbase API
- **Filesystem Access**: `false` - Does not access local files
- **Credentials**: Requires user-provided Personal Access Token (PAT)

### Required Examples (minimum 3)

#### Example 1: List Templates

```
User: "What templates do I have in Renderbase?"

Claude: I'll check your Renderbase templates for you.

[Uses list_templates tool]

You have 5 templates:
1. **Invoice Template** (PDF) - For billing customers
2. **Monthly Report** (Excel) - Financial reporting
3. **Contract Template** (PDF) - Service agreements
4. **Quote Template** (PDF) - Sales quotes
5. **Timesheet** (Excel) - Employee time tracking
```

#### Example 2: Generate a Document

```
User: "Generate an invoice for Acme Corp for $2,500 for consulting services"

Claude: I'll generate that invoice for you using your Invoice Template.

[Uses generate_document tool with:
  - template: "Invoice Template"
  - variables: {
      clientName: "Acme Corp",
      amount: 2500,
      description: "Consulting services"
    }
]

Done! Your invoice has been generated. Here's the download link:
https://app.renderbase.dev/documents/doc_abc123
```

#### Example 3: Create a Template

```
User: "Create a simple receipt template with date, items, and total"

Claude: I'll create a receipt template for you.

[Uses create_draft_template tool with schema for:
  - Header with "Receipt" title
  - Date field
  - Items table with description and amount columns
  - Total row
]

I've created a draft template called "Receipt Template". You can:
1. Preview it in your Renderbase dashboard
2. Make adjustments using the visual editor
3. Publish it when ready

Would you like me to generate a test document with sample data?
```

## Submission Process

### Step 1: Prepare the Bundle

```bash
cd integrations/mcp-server
npm install
npm run build:mcpb
```

Verify the bundle:
- Check `dist-mcpb/renderbase-mcp-{version}.mcpb` exists
- Test locally in Claude Desktop

### Step 2: Create Extension Listing Assets

Prepare these files for the directory listing:

1. **Icon** (512x512 PNG): `mcpb/icon.png`
2. **Screenshots** (1280x800 recommended):
   - Screenshot showing template listing
   - Screenshot showing document generation
   - Screenshot showing template creation
3. **Feature banner** (1200x630): For directory card

### Step 3: Submit to Directory

1. Go to the [MCP Extensions Directory Submission Form](https://forms.gle/...)
   - *Note: URL will be provided by Anthropic when available*

2. Fill in the form with:
   - Publisher details
   - Extension metadata from manifest.json
   - Privacy policy and terms URLs
   - Usage examples (copy from above)
   - Safety annotations

3. Upload the MCPB bundle and assets

4. Submit for review

### Step 4: Review Process

- **Initial review**: 2-3 business days
- **Security review**: Automated + manual check
- **Testing**: Functionality verification

You'll receive email updates on the review status.

## Post-Submission

### Monitoring

After approval:
- Monitor installation counts in the developer dashboard
- Track error reports and user feedback
- Respond to user support requests promptly

### Updates

To update the extension:
1. Bump version in `package.json`
2. Update `mcpb/manifest.json` version
3. Rebuild: `npm run build:mcpb`
4. Submit updated bundle through the developer dashboard

### Version Guidelines

- **Patch** (1.0.x): Bug fixes, documentation updates
- **Minor** (1.x.0): New tools, non-breaking features
- **Major** (x.0.0): Breaking changes, major rewrites

## Marketing

### Directory Listing Copy

**Title**: Renderbase - Document Generation

**Tagline**: Generate PDFs and Excel documents with AI

**Full Description**:
Transform your document workflows with Renderbase. Generate professional PDFs, Excel spreadsheets, and reports through natural conversation with Claude.

**Key Features**:
- Generate invoices, contracts, reports instantly
- Use your existing templates or create new ones with AI
- Support for PDF and Excel formats
- Secure API with Personal Access Tokens
- Draft-only mode for safe experimentation

**Who is it for?**
- Developers automating document generation
- Business users creating reports and invoices
- Teams needing consistent document formatting

### Social Announcement Template

```
Renderbase is now on Claude Desktop!

Generate PDFs and Excel documents through conversation:
- "Create an invoice for $1,500"
- "Generate my monthly report"
- "Draft a new contract template"

Install in one click from the Extensions directory.
https://www.renderbase.dev/mcp
```

## Support

For submission questions:
- Email: support@renderbase.dev
- GitHub: https://github.com/renderbase/renderbase/issues
