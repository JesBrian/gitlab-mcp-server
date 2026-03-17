#!/usr/bin/env node

/**
 * GitLab MCP Server
 * 基于 Model Context Protocol 的 GitLab API 服务
 */

const {Server} = require('@modelcontextprotocol/sdk/server/index.js');
const {StdioServerTransport} = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const GitLabClient = require('./lib/GitLabClient');
const { DEFAULT_CONFIG, TOOLS } = require('./config/Config');

// 初始化 GitLab Client
const gitlabClient = new GitLabClient(
    DEFAULT_CONFIG.gitlab.url,
    DEFAULT_CONFIG.gitlab.privateToken,
    DEFAULT_CONFIG.client
);

// 创建 MCP Server
const server = new Server(
    DEFAULT_CONFIG.server,
    {
        capabilities: {
            tools: {},
        },
    }
);

// 处理 ListTools 请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {tools: TOOLS};
});

// 处理 CallTool 请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {name, arguments: args} = request.params;

    try {
        let result;

        switch (name) {
            case 'get_current_user':
                result = await gitlabClient.getCurrentUser();
                break;

            case 'get_project_ids':
                result = await gitlabClient.getProjectIds(args.projectName);
                break;

            case 'create_merge_request':
                result = await gitlabClient.createMergeRequest(
                    args.sourceProjectId,
                    args.targetProjectId,
                    args.sourceBranch,
                    args.targetBranch,
                    {title: args.title, description: args.description}
                );
                break;
            
            case 'create_merge_request_to_public':
                result = await gitlabClient.createMergeRequestToPublic(
                    args.projectName,
                    args.sourceBranch,
                    args.targetBranch,
                    {title: args.title, description: args.description}
                );
                break;

            case 'merge_branch':
                result = await gitlabClient.mergeBranch(args.targetProjectId, args.mergeRequestIid);
                break;

            case 'get_merge_request_status':
                result = await gitlabClient.getMergeRequestStatus(args.targetProjectId, args.mergeRequestIid);
                break;

            case 'close_merge_request':
                result = await gitlabClient.closeMergeRequest(args.targetProjectId, args.mergeRequestIid);
                break;

            case 'wait_for_mergeable_status':
                result = await gitlabClient.waitForMergeableStatus(
                    args.targetProjectId,
                    args.mergeRequestIid,
                    args.timeout
                );
                break;

            case 'get_project':
                result = await gitlabClient.getProject(args.projectId);
                break;

            case 'get_repository_branches':
                result = await gitlabClient.getRepositoryBranches(args.projectId);
                break;

            case 'create_branch':
                result = await gitlabClient.createBranch(args.projectId, args.branchName, args.ref);
                break;

            case 'delete_branch':
                result = await gitlabClient.deleteBranch(args.projectId, args.branchName);
                break;

            default:
                throw new Error(`未知的工具：${name}`);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `错误：${error.message}`
                }
            ],
            isError: true
        };
    }
});

// 启动服务器
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.info('GitLab MCP Server 已启动');
}

main().catch(error => {
    console.error('服务器启动失败:', error);
    process.exit(1);
});
