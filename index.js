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

const env = process.env;

// 初始化 GitLab Client
const gitlabClient = new GitLabClient(
    env.GITLAB_URL || env.gitlab_url,
    env.GITLAB_PRIVATE_TOKEN || env.gitlab_private_token,
    {
        timeout: parseInt(env.TIMEOUT) || 10000,
        waitInterval: parseInt(env.WAIT_INTERVAL) || 2000
    }
);

// MCP Tools 定义
const TOOLS = [
    {
        name: 'get_current_user',
        description: '获取当前 GitLab 用户信息',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'get_project_ids',
        description: '搜索项目并获取项目 ID 映射',
        inputSchema: {
            type: 'object',
            properties: {
                projectName: {
                    type: 'string',
                    description: '项目名称'
                }
            },
            required: ['projectName']
        }
    },
    {
        name: 'create_merge_request',
        description: '创建合并请求 (MR)',
        inputSchema: {
            type: 'object',
            properties: {
                sourceProjectId: {type: 'number', description: '源项目 ID'},
                targetProjectId: {type: 'number', description: '目标项目 ID'},
                sourceBranch: {type: 'string', description: '源分支名'},
                targetBranch: {type: 'string', description: '目标分支名'},
                title: {type: 'string', description: 'MR 标题'},
                description: {type: 'string', description: 'MR 描述'}
            },
            required: ['sourceProjectId', 'targetProjectId', 'sourceBranch', 'targetBranch']
        }
    },
    {
        name: 'create_merge_request_to_public',
        description: '创建从个人仓库到公共仓库的合并请求',
        inputSchema: {
            type: 'object',
            properties: {
                projectName: {type: 'string', description: '项目名称'},
                sourceBranch: {type: 'string', description: '源分支名'},
                targetBranch: {type: 'string', description: '目标分支名'},
                title: {type: 'string', description: 'MR 标题'},
                description: {type: 'string', description: 'MR 描述'}
            },
            required: ['projectName', 'sourceBranch', 'targetBranch']
        }
    },
    {
        name: 'merge_branch',
        description: '执行分支合并',
        inputSchema: {
            type: 'object',
            properties: {
                targetProjectId: {type: 'number', description: '目标项目 ID'},
                mergeRequestIid: {type: 'string', description: 'MR 内部 ID'}
            },
            required: ['targetProjectId', 'mergeRequestIid']
        }
    },
    {
        name: 'get_merge_request_status',
        description: '获取合并请求状态',
        inputSchema: {
            type: 'object',
            properties: {
                targetProjectId: {type: 'number', description: '目标项目 ID'},
                mergeRequestIid: {type: 'string', description: 'MR 内部 ID'}
            },
            required: ['targetProjectId', 'mergeRequestIid']
        }
    },
    {
        name: 'close_merge_request',
        description: '关闭合并请求',
        inputSchema: {
            type: 'object',
            properties: {
                targetProjectId: {type: 'number', description: '目标项目 ID'},
                mergeRequestIid: {type: 'string', description: 'MR 内部 ID'}
            },
            required: ['targetProjectId', 'mergeRequestIid']
        }
    },
    {
        name: 'wait_for_mergeable_status',
        description: '等待 MR 状态变为可合并',
        inputSchema: {
            type: 'object',
            properties: {
                targetProjectId: {type: 'number', description: '目标项目 ID'},
                mergeRequestIid: {type: 'string', description: 'MR 内部 ID'},
                timeout: {type: 'number', description: '超时时间 (毫秒)', default: 300000}
            },
            required: ['targetProjectId', 'mergeRequestIid']
        }
    },
    {
        name: 'get_project',
        description: '获取项目详情',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: {type: 'number', description: '项目 ID'}
            },
            required: ['projectId']
        }
    },
    {
        name: 'get_repository_branches',
        description: '获取仓库所有分支',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: {type: 'number', description: '项目 ID'}
            },
            required: ['projectId']
        }
    },
    {
        name: 'create_branch',
        description: '创建新分支',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: {type: 'number', description: '项目 ID'},
                branchName: {type: 'string', description: '新分支名'},
                ref: {type: 'string', description: '源分支/标签', default: 'master'}
            },
            required: ['projectId', 'branchName']
        }
    },
    {
        name: 'delete_branch',
        description: '删除分支',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: {type: 'number', description: '项目 ID'},
                branchName: {type: 'string', description: '分支名'}
            },
            required: ['projectId', 'branchName']
        }
    }
];

// 创建 MCP Server
const server = new Server(
    {
        name: 'gitlab-mcp-server',
        version: '1.0.0',
    },
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
