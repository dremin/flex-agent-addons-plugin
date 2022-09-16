import * as Flex from '@twilio/flex-ui';


export default (flex, manager) => {
	registerCustomNotifications(flex, manager);
}

export const CustomNotifications = {
	FailedHangupNotification: "PS_FailedHangupOnConferenceWithExternalParties",
	transferQueueClosed: 'TransferQueueClosed',
	transferQueueHoliday: 'TransferQueueHoliday'
}

function registerCustomNotifications(flex, manager) {
	flex.Notifications.registerNotification({
		id: CustomNotifications.FailedHangupNotification,
		type: Flex.NotificationType.error,
		content: "Hangup call abandoned: Failed to take all participants off hold while hanging up the call. If this issue persists, please try unholding participants manually before leaving the call"
	});
	
	// These notifications let the user know the queue they're trying to
	// transfer to is currently closed, along with the hours of operation
	// for the target queue
	manager.strings[CustomNotifications.transferQueueClosed] = (`
		Queue [{{queueName}}] is closed. Queue hours are:
		<hr>
		<p>{{breakLines queueHours}}</p>
	`);
	manager.strings[CustomNotifications.transferQueueHoliday] = (`
		Queue [{{queueName}}] is closed today for a holiday. Queue hours are:
		<hr>
		<p>{{breakLines queueHours}}</p>
	`);
	
	const queueClosedNotificationTimeoutMs = 20000;
	
	flex.Notifications.registerNotification({
		id: CustomNotifications.transferQueueClosed,
		closeButton: true,
		content: CustomNotifications.transferQueueClosed,
		timeout: queueClosedNotificationTimeoutMs,
		type: Flex.NotificationType.warning
	});
	flex.Notifications.registerNotification({
		id: CustomNotifications.transferQueueHoliday,
		closeButton: true,
		content: CustomNotifications.transferQueueHoliday,
		timeout: queueClosedNotificationTimeoutMs,
		type: Flex.NotificationType.warning
	});
}
