import ApiService from './ApiService';

let workflows = null

class TaskRouterService extends ApiService {
	
	// does a one time fetch for workflows per session
	// since workflow configuration seldom changes
	
	async getWorkflows() {
		if(workflows) return workflows

		workflows = await this.#getWorkflows();
		return workflows
	}

	async updateTaskAttributes(taskSid, attributesUpdate) {

		const result = await this.#updateTaskAttributes(taskSid, JSON.stringify(attributesUpdate))

		return result.success;
	}


	#updateTaskAttributes = (taskSid, attributesUpdate) => {

		const encodedParams = {
			Token: encodeURIComponent(this.manager.store.getState().flex.session.ssoTokenPayload.token),
			taskSid: encodeURIComponent(taskSid),
			attributesUpdate: encodeURIComponent(attributesUpdate)
		};

		return this.fetchJsonWithReject(
			`https://${this.serverlessDomain}/common/update-task-attributes`,
			{
				method: 'post',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: this.buildBody(encodedParams)
			}
		).then((response) => {
			return {
				...response,
			};
		});
	};
	
	#getWorkflows = () => {
		const encodedParams = {
			Token: encodeURIComponent(this.manager.store.getState().flex.session.ssoTokenPayload.token)
		};
		
		return this.fetchJsonWithReject(
		`https://${this.serverlessDomain}/internal-transfer-addons/list-workflows`,
			{
				method: 'post',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: this.buildBody(encodedParams)
			})
			.then((response) => {
				const { workflows } = response;
				return workflows;
			});
	};
}


export default new TaskRouterService();
