/**
 * GitLab API Client
 * 封装 GitLab API 调用的客户端类
 */

const axios = require('axios');

class GitLabClient {
    constructor(gitlabUrl, privateToken, options = {}) {
        this.gitlabUrl = gitlabUrl;
        this.privateToken = privateToken;
        this.timeout = options.timeout || 10000;
        this.waitInterval = options.waitInterval || 2000;

        this.client = axios.create({
            baseURL: this.gitlabUrl,
            headers: {
                'PRIVATE-TOKEN': this.privateToken,
                'Content-Type': 'application/json'
            },
            timeout: this.timeout
        });

        this.client.interceptors.response.use(
            response => response,
            error => {
                const message = error.response?.data?.message || error.message;
                console.error(`[GitLab API 错误] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`);
                throw error;
            }
        );
    }

    async getCurrentUser() {
        const response = await this.client.get('/api/v4/user');
        return response.data;
    }

    async getProjectIds(projectName) {
        const url = `/api/v4/projects?search=${encodeURIComponent(projectName)}`;
        const response = await this.client.get(url);
        const projects = response.data;

        const projectMap = {};
        for (const project of projects) {
            const namespace = project.namespace?.path;
            if (namespace) {
                projectMap[namespace] = project.id;
            }
        }
        return projectMap;
    }

    async createMergeRequest(sourceProjectId, targetProjectId, sourceBranch, targetBranch, options = {}) {
        const url = `/api/v4/projects/${sourceProjectId}/merge_requests`;
        const data = {
            source_branch: sourceBranch,
            target_branch: targetBranch,
            target_project_id: targetProjectId,
            title: options.title || `Merge ${sourceBranch} to ${targetBranch}`,
            description: options.description || 'Merged via MCP Server'
        };

        const response = await this.client.post(url, data);
        return response.data;
    }
    
    async createMergeRequestToPublic(projectName, sourceBranch, targetBranch, options = {}) {
        const user = await this.getCurrentUser();
        const projectIds = await this.getProjectIds(projectName);

        if (Object.keys(projectIds).length < 2) {
            throw new Error(`项目 '${projectName}' 的 ID 映射不完整，无法确定个人仓库和公共仓库。`);
        }

        const sourceProjectId = projectIds[user.username];
        if (!sourceProjectId) {
            throw new Error(`在项目 '${projectName}' 中未找到用户 '${user.username}' 的个人仓库。`);
        }

        const targetProjectId = Object.values(projectIds).find(id => id !== sourceProjectId);
        if (!targetProjectId) {
            throw new Error(`在项目 '${projectName}' 中未找到公共仓库。`);
        }

        return this.createMergeRequest(sourceProjectId, targetProjectId, sourceBranch, targetBranch, options);
    }

    async mergeBranch(targetProjectId, mergeRequestIid) {
        const url = `/api/v4/projects/${targetProjectId}/merge_requests/${mergeRequestIid}/merge`;
        const response = await this.client.put(url);
        return response.data;
    }

    async getMergeRequestStatus(targetProjectId, mergeRequestIid) {
        const url = `/api/v4/projects/${targetProjectId}/merge_requests/${mergeRequestIid}`;
        const response = await this.client.get(url);
        return {
            merge_status: response.data.merge_status,
            has_conflicts: response.data.has_conflicts,
            ...response.data
        };
    }

    async closeMergeRequest(targetProjectId, mergeRequestIid) {
        const url = `/api/v4/projects/${targetProjectId}/merge_requests/${mergeRequestIid}`;
        const response = await this.client.put(url, {state_event: 'close'});
        return response.data;
    }

    async getProject(projectId) {
        const url = `/api/v4/projects/${projectId}`;
        const response = await this.client.get(url);
        return response.data;
    }

    async getRepositoryBranches(projectId) {
        const url = `/api/v4/projects/${projectId}/repository/branches`;
        const response = await this.client.get(url);
        return response.data;
    }

    async createBranch(projectId, branchName, ref) {
        const url = `/api/v4/projects/${projectId}/repository/branches`;
        const response = await this.client.post(url, {
            branch: branchName,
            ref: ref || 'master'
        });
        return response.data;
    }

    async deleteBranch(projectId, branchName) {
        const url = `/api/v4/projects/${projectId}/repository/branches/${encodeURIComponent(branchName)}`;
        const response = await this.client.delete(url);
        return response.data;
    }

    async waitForMergeableStatus(targetProjectId, mergeRequestIid, timeout = 300000) {
        const startTime = Date.now();
        const interval = this.waitInterval;

        while (Date.now() - startTime < timeout) {
            const stat = await this.getMergeRequestStatus(targetProjectId, mergeRequestIid);

            if (stat.merge_status === 'cannot_be_merged') {
                return {canMerge: false, hasConflicts: true, status: stat.merge_status};
            }

            if (stat.merge_status === 'can_be_merged') {
                return {canMerge: true, hasConflicts: false, status: stat.merge_status};
            }

            await new Promise(resolve => setTimeout(resolve, interval));
        }

        return {canMerge: false, hasConflicts: false, status: 'timeout'};
    }
}

module.exports = GitLabClient;
