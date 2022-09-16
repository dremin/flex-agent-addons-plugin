const { random } = require("lodash");
const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(async function (context, event, callback) {

 
  const response = new Twilio.Response();
  // const client = context.getTwilioClient();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

  const getWorkflows = async function (context, attempts) {
    try {
      const client = context.getTwilioClient();
      const workflows = await client.taskrouter
            .workspaces(context.TWILIO_WORKSPACE_SID)
            .workflows
            .list({limit: 1000})
      
      return { 
              success: true, 
              status: 200, 
              workflows
          }

    }
    catch (error){
      if(error && error.response && error.response.stats == 429 && attempts < context.TWILIO_SERVICE_RETRY_LIMIT ){
        const waitTime = random(context.TWILIO_SERVICE_MIN_BACKOFF, context.TWILIO_SERVICE_MAX_BACKOFF);
        await snooze(waitTime);
        return getWorkflows(context, attempts + 1);
      }
      else {
        return { success: false, message: error, status: error.response.status };
      }
    }
  }

  try {
    const result = await getWorkflows(context, 0);
    const { success, workflows: workflowData, message, status } = result;
    const workflows = workflowData? workflowData.map(workflow => {
      const { sid, configuration } = workflow ;
      return { sid, configuration };
    }):null;
    response.setStatusCode(status);
    response.setBody({ success, workflows, message });
    callback(null, response);
  }
  catch (error){
    console.log(error);
    response.setStatusCode(500);
    response.setBody({ data: null, message: error.message });
    callback(null, response);
  }


  return callback(null, response);
});
