/**
 * UI Action: No-Show
 * Table: Reservation Tracker (x_1906134_worksp_0_reservation_tracker)
 *
 * Condition:
 * gs.hasRole('x_1906134_worksp_0.wrm_agent') && current.reservation_status=='pending_check_in' && current.work_start < new GlideDateTime()
 *
 * Action type: Form button, client false (server side script)
 *
 * Marks a reservation as a no-show when the guest never checked in
 * within the booking window. The Reservation Tracker to Workspace
 * Options sync Business Rule reacts to this status change and marks
 * the linked workspace as available again.
 *
 * Note: current.state = 4 below is superseded before save. The
 * Sync State with Reservation Status Business Rule also runs on
 * before update for this same field change, and maps no_show to
 * state 7 (Closed Skipped), the correct value on this instance.
 * The stored state ends up as 7 regardless of the line below.
 */

// Mark as No-show and close skipped
current.reservation_status = 'no_show';
current.state = 4; // Closed Skipped
current.work_notes = 'Marked as no-show.';
current.update();
action.setRedirectURL(current);
gs.addInfoMessage('No Show selected.');
