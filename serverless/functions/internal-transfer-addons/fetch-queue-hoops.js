const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(function(context, event, callback) {
  // Create a custom Twilio Response
  // Set the CORS headers to allow Flex to make an HTTP request to the Twilio Function
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Use FileSystem library to read the json.
  const fs = require('fs');
  const file = Runtime.getAssets()['/queue-hoops.json'].path;
  const text = fs.readFileSync(file).toString('utf-8');


  let basicHoops = JSON.parse(text);

  let newData = {
    timezone: basicHoops.timezone,
  };

  const queueFetchTimer = 'Queues fetched in';
  console.time(queueFetchTimer)
  // Pull all queues
  const client = context.getTwilioClient();
  client.taskrouter.workspaces(context.TWILIO_WORKSPACE_SID)
    .taskQueues
    .list()
    .then(taskQueues => {
      console.timeEnd(queueFetchTimer);
      console.log(`Fetched ${taskQueues.length} TaskQueues`);

      const hoopCalcTimer = 'HOOPs calculated in';
      console.time(hoopCalcTimer);

      for (const queue of taskQueues) {
        const daysHours = findFor(queue.friendlyName, basicHoops);
        newData[queue.sid] = {
          ...daysHours,
          friendlyName: queue.friendlyName
        };
      }
      // taskQueues.forEach(t => {
      //   console.log('Processing', t.sid);
      //   const daysHours = findFor(t.friendlyName, basicHoops);
      //   newData[t.friendlyName] = daysHours;
      //   newData[t.friendlyName].sid = t.sid;
      // });
      
      // Update the rest of the response.
      response.appendHeader('Content-Type', 'application/json');
      response.setBody(newData);

      console.timeEnd(hoopCalcTimer);
      console.log(`HOOPs calculated for ${Object.keys(newData).filter(k => k !== 'timezone').length} TaskQueues`);

      callback(null, response);
    })
    .catch(error => {
      console.error('Error fetching TaskQueues.', error);
      callback(error && error.message, null);
    });
});


const findFor = (rawQueueName = String, theHoops = {}) => {
  // Use .toLowerCase() for comparison purposes
  const queueName = rawQueueName.toLowerCase();
  
  for(const [rawKey,value] of Object.entries(theHoops)) {
    let key = rawKey.toLowerCase();

    // Want to match queueName like "baas gbr lost stolen t1 en"
    // to a key like "baas gbr" to get started
    if(queueName.startsWith(`${key} `)) {
      for(const[rawSubKey, subValue] of Object.entries(value)) {
        let subKey = rawSubKey.toLowerCase();
        
        // Want to match a subKey like "lost stolen"
        // to anything inside queueName like "baas gbr lost stolen t1 en"
        // Adding space before/after key to avoid partial match in a longer word
        if(queueName.includes(` ${subKey} `) ||
          queueName.endsWith(` ${subKey}`)) {
          return {
            ...subValue,
            matchedHoop: `${rawKey}.${rawSubKey}`
          };
        }
      }
    }
  }

  // If we haven't found a set of hours to return yet, check the global category
  for(const[rawKey, value] of Object.entries(theHoops.global)) {
    let key = rawKey.toLowerCase();
    
    // Want to match a key like "lost stolen"
    // to anything inside queueName like "baas gbr lost stolen t1 en"
    // Adding space before/after key to avoid partial match in a longer word
    if(queueName.startsWith(`${key} `) ||
      queueName.includes(` ${key} `) ||
      queueName.endsWith(` ${key}`) || 
      queueName === key) {
      return {
        ...value,
        matchedHoop: `global.${rawKey}`
      }
    }
  }

  // Have to return SOMETHING, so we use the global global values
  return {
    ...theHoops.global.global,
    matchedHoop: 'global.global'
  }
}
