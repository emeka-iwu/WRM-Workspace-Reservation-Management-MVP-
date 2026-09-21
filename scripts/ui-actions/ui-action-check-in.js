/**
 * UI Action: Check-In
 * Table: Reservation Tracker (x_1906134_worksp_0_reservation_tracker)
 *
 * Condition:
 * current.reservation_status=='pending_check_in' && gs.hasRole('x_1906134_worksp_0.wrm_user')
 *
 * Action type: Form button, client false (server side script)
 *
 * Marks the reservation as checked in. The Reservation Tracker to
 * Workspace Options sync Business Rule reacts to this status change
 * and marks the linked workspace as unavailable. A second Business
 * Rule syncs the inherited State field to Open.
 */

// Set reservation status to Checked-in
current.reservation_status = 'checked_in';
current.work_notes = 'Check-in recorded.';
current.update();

action.setRedirectURL(current);
gs.addInfoMessage('Checked in for Reservation.');
