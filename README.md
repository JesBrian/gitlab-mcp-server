# GitLab MCP Server

基于 Model Context Protocol (MCP) 的 GitLab API 服务。该服务器提供了一组工具，允许 AI 模型与 GitLab 实例进行交互，主要专注于分支管理和合并请求（MR）操作。

## 项目信息

- **包名**: @jesbrian/gitlab-mcp-server
- **版本**: 0.2.2
- **类型**: CommonJS
- **主入口**: index.js
- **可执行文件**: gitlab-mcp-server
- **配置模块**: config/Config.js

## 项目结构

```
gitlab-mcp-server/
├── index.js                          # 主入口文件
├── config/                           # 配置目录
│   └── Config.js                     # 集中配置文件
├── lib/                              # 库目录
│   └── GitLabClient.js               # GitLab API 客户端
├── package.json
└── README.md
```

### 模块化设计

- **GitLabClient.js**: 封装 GitLab API 调用的客户端类（根目录）
- **config/Config.js**: 集中管理所有配置项（GitLab 连接、客户端选项、MCP Server 配置、Tools 定义）
- **index.js**: MCP Server 主逻辑，负责工具调用和请求处理

## 功能特性

*   **用户管理**：获取当前 GitLab 用户信息。
*   **项目管理**：搜索项目、获取项目 ID 映射和项目详细信息。
*   **分支管理**：
    *   获取仓库分支列表。
    *   创建新分支（支持指定源分支/标签）。
    *   删除分支。
*   **合并请求 (MR) 管理**：
    *   创建 MR（支持标准创建和自动识别公共仓库的快捷创建）。
    *   获取 MR 状态（包括合并状态、冲突检测）。
    *   执行合并操作。
    *   关闭 MR。
    *   轮询等待 MR 变为可合并状态（支持超时设置）。

## 配置管理

所有配置项已集中到 `lib/config/Config.js` 文件中，支持通过环境变量自定义：

需要配置以下环境变量：

| 变量名 | 描述 | 必填 | 默认值 |
| :--- | :--- | :--- | :--- |
| `GITLAB_URL` | GitLab 实例地址 (例如 `https://gitlab.example.com`) | 是 | - |
| `GITLAB_PRIVATE_TOKEN` | GitLab 个人访问令牌 (Private Token) | 是 | - |
| `TIMEOUT` | 请求超时时间 (毫秒) | 否 | 10000 |
| `WAIT_INTERVAL` | 轮询等待间隔 (毫秒) | 否 | 2000 |

## 运行方式

### 作为 MCP Server 使用

在 Claude Desktop 的配置文件中添加：

#### 方式一：使用 npx（推荐）

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

#### 方式二：本地路径运行

本地启动项目后再配置 Claude Code：

```bash
# 克隆项目后，进入目录并安装依赖
cd gitlab-mcp-server
npm install

# 本地启动服务（任选一种方式）
npm start              # 方式一：使用 npm scripts
node index.js          # 方式二：直接运行
gitlab-mcp-server      # 方式三：全局安装后使用命令
```

在 Claude Code 的 MCP 配置中添加：

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

### 用户与项目管理
*   `get_current_user`: 获取当前 GitLab 用户信息。
*   `get_project_ids`: 根据项目名称搜索并获取项目 ID 映射（返回不同命名空间下的项目 ID）。
*   `get_project`: 获取指定项目的详细信息。

### 分支操作
*   `get_repository_branches`: 获取项目的分支列表。
*   `create_branch`: 创建新分支（可指定源分支/标签，默认为 master）。
*   `delete_branch`: 删除分支。

### 合并请求 (MR)
*   `create_merge_request`: 创建合并请求（支持自定义标题和描述）。
*   `create_merge_request_to_public`: 快捷工具，自动识别个人仓库和公共仓库，创建从个人分支到公共仓库的 MR。
*   `merge_branch`: 执行合并操作。
*   `get_merge_request_status`: 获取 MR 的当前状态（包括合并状态、是否有冲突等）。
*   `close_merge_request`: 关闭合并请求。
*   `wait_for_mergeable_status`: 轮询等待 MR 变为可合并状态（支持超时设置，默认 5 分钟）。
