/**
 * GitLab MCP Server 配置
 * 集中管理所有配置项
 */

const env = process.env;

// 默认配置
const DEFAULT_CONFIG = {
    // GitLab API 配置
    gitlab: {
        url: env.GITLAB_URL || env.gitlab_url,
        privateToken: env.GITLAB_PRIVATE_TOKEN || env.gitlab_private_token,
    },
    
    // 客户端选项
    client: {
        timeout: parseInt(env.TIMEOUT) || 10000,
        waitInterval: parseInt(env.WAIT_INTERVAL) || 2000,
    },
    
    // MCP Server 配置
    server: {
        name: 'gitlab-mcp-server',
        version: '1.0.0',
    },
};

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

module.exports = {
    DEFAULT_CONFIG,
    TOOLS,
};
