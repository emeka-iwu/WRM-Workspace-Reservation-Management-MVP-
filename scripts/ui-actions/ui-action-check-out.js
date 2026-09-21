/**
 * UI Action: Check-Out
 * Table: Reservation Tracker (x_1906134_worksp_0_reservation_tracker)
 *
 * Condition:
 * current.reservation_status=='checked_in' && gs.hasRole('x_1906134_worksp_0.wrm_user')
 *
 * Action type: Form button, client false (server side script)
 *
 * Marks the reservation as checked out and closes the task. The
 * Reservation Tracker to Workspace Options sync Business Rule
 * reacts to this status change and marks the linked workspace as
 * available again.
 */

// Set reservation status to Checked-out and close the task
current.reservation_status = 'checked_out';
current.state = 3; // Closed Complete
current.work_notes = 'Check-out recorded.';
current.update()
action.setRedirectURL(current);
gs.addInfoMessage('Checked out of Reservation.');
