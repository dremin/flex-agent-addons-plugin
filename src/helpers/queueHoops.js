import { Manager } from '@twilio/flex-ui';
import { namespace } from '../states';
import { DaysOfWeek } from '../enums';

const manager = Manager.getInstance();

const getHoopsAsset = async (myTz) => {
  // Providing separate serverless domain option so queue hoops can be easily
  // made editable from the console for ease of admin management
  const serverlessDomain = manager.serviceConfiguration.ui_attributes.internalTransferAddonsPlugin.queueHoopsDomainName;
  const fetchUrl = `https://${serverlessDomain}/fetch-queue-hoops`;

  const fetchBody = {
    Token: manager.store.getState().flex.session.ssoTokenPayload.token,
    clientTz: myTz
  };
  const fetchOptions = {
    method: 'POST',
    body: new URLSearchParams(fetchBody),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
  };

  let resText;
  try {
    const response = await fetch(fetchUrl, fetchOptions);
    resText = await response.json();
    return resText;
  } catch (error) {
    console.error('Failed to get asset file');
  }
};

export const loadHoops = (storeHoopsAction) => {
  getHoopsAsset(Intl.DateTimeFormat().resolvedOptions().timeZone).then(response => {
    manager.store.dispatch(storeHoopsAction(response));
  });
};

export const getQueueHoopForToday = (queueSid) => {
  const hoops = manager.store.getState()[namespace]?.queueHoops;

  if (!hoops) {
    return;
  }

  const queueHoop = hoops[queueSid];

  if (!queueHoop) {
    return;
  }

  const dateFormatOptions = {
    timeZone: hoops.timezone,
    timeZoneName: 'short',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
    month: 'short',
    day: 'numeric'
  };
  const dateFormatter = new Intl.DateTimeFormat('en-US', dateFormatOptions);

  // Get the current date formatted for defined timezone and split into parts
  const formattedDateParts = dateFormatter.formatToParts(new Date());

  const weekday = formattedDateParts.find(d => d.type === 'weekday')?.value;;
  const month = formattedDateParts.find(d => d.type === 'month')?.value;
  const day = formattedDateParts.find(d => d.type === 'day')?.value;
  const monthDay = `${month} ${day}`;
  const hour = formattedDateParts.find(d => d.type === 'hour')?.value;
  const timezoneName = formattedDateParts.find(d => d.type === 'timeZoneName')?.value;

  // matchedHoop is only for debugging purposes, so it's easy to see which HOOP was
  // matched in the master JSON file
  const matchedHoop = queueHoop.matchedHoop;
  const queueName = queueHoop.friendlyName;
  const queueOpenHour = queueHoop[weekday]?.open;
  const queueCloseHour = queueHoop[weekday]?.close;
  const queueHolidays = queueHoop.holidays;

  const isTodayHoliday = Array.isArray(queueHolidays) && queueHolidays.includes(monthDay);

  // Including a check for undefined open or close hours and assuming closed if
  // either is missing to prevent calls from possibly being transferred to a closed
  // queue due to a missed configuration
  const isQueueClosed = (
    isTodayHoliday ||
    queueOpenHour === undefined ||
    queueCloseHour === undefined ||
    hour < queueOpenHour ||
    hour >= queueCloseHour
  );

  const getDayPeriodForHour = (hourToEvaluate) => {
    return hourToEvaluate === 24
      ? 'AM'
      : hourToEvaluate < 12
        ? 'AM'
        : 'PM';
  }

  const formatHour = (hourToFormat) => {
    const convertedHour = (hourToFormat === 0 || hourToFormat === 24)
    ? 12
    : hourToFormat > 12
      ? hourToFormat - 12
      : hourToFormat;

    return `${convertedHour} ${getDayPeriodForHour(hourToFormat)}`;
  };

  let queueHours = '';
  for (const day of DaysOfWeek) {
    const dayHoop = queueHoop[day];
    const dayOpenHour = dayHoop?.open;
    const dayCloseHour = dayHoop?.close;

    if (!dayHoop ||
      dayOpenHour === undefined ||
      dayCloseHour === undefined
    ) {
      queueHours += `${day}: CLOSED\n`;
      continue;
    }

    const dayHours = (dayOpenHour === 0 && dayCloseHour === 24)
      ? 'Open All Day'
      : `${formatHour(dayOpenHour)} - ${formatHour(dayCloseHour)} ${timezoneName}`;

    queueHours += `${day}: ${dayHours}\n`;
  }
  // Removing trailing line feed to avoid an extra empty line at end of string
  queueHours = queueHours.replace(/\n*$/, '');

  return {
    matchedHoop,
    queueName,
    queueSid,
    queueHours,
    isQueueClosed,
    isTodayHoliday
  };
}
