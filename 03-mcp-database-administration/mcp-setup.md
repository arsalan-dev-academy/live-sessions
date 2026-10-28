# MCP Setup for Supabase (First-Time User)

Follow these steps in order.

## 1. Create a Supabase Project

1. Sign in to Supabase.
2. Select your organization.
3. Click New project.
4. Enter:
   - Project name
   - Database password (save this securely)
   - Region
5. Wait until project status is healthy.

## 2. Load the Chinook Dataset in SQL Editor

1. Open your project dashboard.
2. Go to SQL Editor.
3. Create a new query.
4. Open the Chinook SQL dump file at `data/chinook-postgres.sql`.
5. Paste the SQL into the editor.
6. Run the query.
7. Confirm tables were created by checking Table Editor or running:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

## 3. Add the Supabase MCP Server from Command Palette (Ctrl+Shift+P)

1. In VS Code, press Ctrl+Shift+P.
2. Search for MCP commands, then run the add-server command.
3. Choose HTTP as the server method/type.
4. For the server URL, enter:
   - https://mcp.supabase.com/mcp
5. Use a clear server name, for example: supabase-mcp.
6. Save when prompted.

## 4. Confirm and Start the Server from Command Palette

1. Open your MCP config and confirm the entry exists.
2. Confirm it matches this shape:

```json
{
  "servers": {
    "supabase-mcp": {
      "url": "https://mcp.supabase.com/mcp",
      "type": "http"
    }
  },
  "inputs": []
}
```

3. Press Ctrl+Shift+P and run the command that lists MCP servers.
4. Select supabase-mcp from the list. This starts the server.
5. Complete Supabase authentication in the browser if prompted.
6. If tools still do not appear, reload or restart VS Code.

## 5. Verify the MCP Connection

Use this test prompt in your AI chat:

"List the tables in my Supabase public schema using MCP tools."

Expected result:
- The assistant calls Supabase MCP tools (not just a text-only answer).
- You get a table list that includes Chinook tables (for example: artist, album, track, customer, invoice, employee).

## 6. Troubleshooting

### MCP tools do not appear

- Restart VS Code.
- Re-open MCP settings and confirm the Supabase server entry is valid JSON.
- Re-authenticate with Supabase if token access expired.

### Authentication window did not open

- Trigger any Supabase MCP action again to force auth.
- Check browser popup blocking.
- Sign out and sign back in to Supabase.

### Connection works but no Chinook tables are returned

- Confirm SQL import completed without errors.
- Re-run a quick table check in SQL Editor.
- Make sure you loaded tables into the `public` schema.

### Permission or access errors

- Confirm you selected the correct Supabase organization and project during auth.
- Verify your account has access to that project.
