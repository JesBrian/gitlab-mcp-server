# GitLab MCP Server

基于 Model Context Protocol (MCP) 的 GitLab API 服务。该服务器提供了一组工具，允许 AI 模型与 GitLab 实例进行交互，主要专注于分支管理和合并请求（MR）操作。

## 功能特性

*   **项目管理**：获取项目信息，查找项目 ID。
*   **分支管理**：获取分支列表，创建和删除分支。
*   **合并请求 (MR) 管理**：
    *   创建 MR（支持标准创建和自动识别公共仓库的快捷创建）。
    *   获取 MR 状态。
    *   合并分支。
    *   关闭 MR。
    *   等待 MR 可合并状态。

## 安装

```bash
npm install
```

## 配置

需要配置以下环境变量：

| 变量名 | 描述 | 必填 | 默认值 |
| :--- | :--- | :--- | :--- |
| `GITLAB_URL` | GitLab 实例地址 (例如 `https://gitlab.example.com`) | 是 | - |
| `GITLAB_PRIVATE_TOKEN` | GitLab 个人访问令牌 (Private Token) | 是 | - |
| `TIMEOUT` | 请求超时时间 (毫秒) | 否 | 10000 |
| `WAIT_INTERVAL` | 轮询等待间隔 (毫秒) | 否 | 2000 |

## 运行

### 本地运行

```bash
node index.js
```

### 结合 Claude Desktop 使用

在 Claude Desktop 的配置文件中添加：

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

## 可用工具

### 用户与项目
*   `get_current_user`: 获取当前用户信息。
*   `get_project_ids`: 根据项目名称搜索并获取项目 ID 映射（用于区分个人 fork 和公共仓库）。
*   `get_project`: 获取指定项目的详细信息。

### 分支操作
*   `get_repository_branches`: 获取项目的分支列表。
*   `create_branch`: 创建新分支。
*   `delete_branch`: 删除分支。

### 合并请求 (MR)
*   `create_merge_request`: 创建合并请求。
*   `create_merge_request_to_public`: 快捷工具，自动识别个人仓库和公共仓库，创建从个人分支到公共仓库的 MR。
*   `merge_branch`: 执行合并操作。
*   `get_merge_request_status`: 获取 MR 的当前状态（是否可合并、是否有冲突等）。
*   `close_merge_request`: 关闭合并请求。
*   `wait_for_mergeable_status`: 轮询等待 MR 变为可合并状态。
