# GitLab MCP Server

> [!NOTE]
> This documentation is available in [简体中文](./README.zh.md).

A GitLab API server built on the Model Context Protocol (MCP). This server provides a set of tools that allow AI models to interact with GitLab instances, with a focus on branch management and merge request (MR) operations.

## Project Info

- **Package**: @jesbrian/gitlab-mcp-server
- **Version**: 0.2.4
- **Type**: CommonJS
- **Main Entry**: index.js
- **Executable**: gitlab-mcp-server
- **Config Module**: config/Config.js

## Project Structure

```
gitlab-mcp-server/
├── index.js                          # Main entry file
├── config/                           # Config directory
│   └── Config.js                     # Centralized config file
├── lib/                              # Library directory
│   └── GitLabClient.js               # GitLab API client
├── package.json
└── README.md
```

### Modular Design

- **GitLabClient.js**: Client class encapsulating GitLab API calls (root directory)
- **config/Config.js**: Centralized management for all configuration items (GitLab connection, client options, MCP Server config, Tools definitions)
- **index.js**: MCP Server main logic, handles tool invocations and request processing

## Features

*   **User Management**: Get current GitLab user information.
*   **Project Management**: Search projects, get project ID mappings, and retrieve project details.
*   **Branch Management**:
    *   List repository branches.
    *   Create new branches (supports specifying source branch/tag).
    *   Delete branches.
*   **Merge Request (MR) Management**:
    *   Create MRs (supports standard creation and quick creation for public repositories).
    *   Get MR status (including merge status, conflict detection).
    *   Execute merge operations.
    *   Close MRs.
    *   Poll and wait for MR to become mergeable (supports timeout settings).

## Configuration

All configuration items are centralized in `lib/config/Config.js`, customizable via environment variables:

Configure the following environment variables:

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `GITLAB_URL` | GitLab instance URL (e.g., `https://gitlab.example.com`) | Yes | - |
| `GITLAB_PRIVATE_TOKEN` | GitLab personal access token (Private Token) | Yes | - |
| `TIMEOUT` | Request timeout in milliseconds | No | 10000 |
| `WAIT_INTERVAL` | Polling interval in milliseconds | No | 2000 |

## Usage

### As an MCP Server

Add to Claude Desktop configuration file:

#### Option 1: Using npx (Recommended)

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["@jesbrian/gitlab-mcp-server"],
      "env": {
        "GITLAB_URL": "https://your-gitlab-url.com",
        "GITLAB_PRIVATE_TOKEN": "your-private-token"
      }
    }
  }
}
```

#### Option 2: Local Path

Start the project locally first, then configure Claude Code:

```bash
# After cloning the project, enter the directory and install dependencies
cd gitlab-mcp-server
npm install

# Start the service locally (choose one method)
npm start              # Option 1: Use npm scripts
node index.js          # Option 2: Run directly
gitlab-mcp-server      # Option 3: Install globally and use command
```

Add to Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["/path/to/gitlab-mcp-server/index.js"],
      "env": {
        "GITLAB_URL": "https://your-gitlab-url.com",
        "GITLAB_PRIVATE_TOKEN": "your-private-token"
      }
    }
  }
}
```

## Available Tools

### User & Project Management
*   `get_current_user`: Get current GitLab user information.
*   `get_project_ids`: Search projects by name and get project ID mappings (returns IDs across different namespaces).
*   `get_project`: Get detailed information for a specified project.

### Branch Operations
*   `get_repository_branches`: List branches of a project.
*   `create_branch`: Create a new branch (can specify source branch/tag, defaults to master).
*   `delete_branch`: Delete a branch.

### Merge Request (MR)
*   `create_merge_request`: Create a merge request (supports custom title and description).
*   `create_merge_request_to_public`: Quick tool that auto-detects personal and public repositories, creates MR from personal branch to public repository.
*   `merge_branch`: Execute merge operation.
*   `get_merge_request_status`: Get current MR status (including merge status, conflicts, etc.).
*   `close_merge_request`: Close a merge request.
*   `wait_for_mergeable_status`: Poll and wait for MR to become mergeable (supports timeout, default 5 minutes).
