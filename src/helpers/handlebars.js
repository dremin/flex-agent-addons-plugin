import { queueHoops }  from './index';

export const registerHelpers = () => {
  // Handlebars escapes all variable text by default, causing line feeds
  // in a variable to be lost. This helper converts the line feeds to 
  // HTML breaks in a way that will be honored by Handlebars
  window.Handlebars.registerHelper('breakLines', function(text) {
    let newText = window.Handlebars.Utils.escapeExpression(text);
    newText = newText.replace(/\n/g, '<br>');

    return new window.Handlebars.SafeString(newText);
  });

  // See Handlebars documentation here for details on conditional helpers
  // https://handlebarsjs.com/guide/block-helpers.html#conditionals
  window.Handlebars.registerHelper('IsWorkerDirectoryQueueClosed', function (payload, options) {
    const queueSid = payload?.sid
    const fnTrue = options?.fn;
    const fnFalse = options?.inverse;

    if (!queueSid) {
      return fnFalse(this);
    }

    const queueHoopToday = queueHoops.getQueueHoopForToday(queueSid);

    if (!queueHoopToday) {
      return fnFalse(this);
    }

    const { isQueueClosed, isTodayHoliday, queueHours } = queueHoopToday;

    const response = {
      ...this,
      queueHours,
      isQueueClosed,
      isTodayHoliday
    };

    return isQueueClosed ? fnTrue(response) : fnFalse(response);
  });
};
