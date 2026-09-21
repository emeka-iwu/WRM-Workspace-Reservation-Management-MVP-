/**
 * UI Action: Claim
 * Table: Reservation Tracker (x_1906134_worksp_0_reservation_tracker)
 *
 * Condition:
 * current.assigned_to=='' && gs.hasRole('x_1906134_worksp_0.wrm_agent')
 *
 * Action type: Form button, client false (server side script)
 *
 * Assigns the current unassigned record to the logged in user.
 */

// Assign the current record to the logged-in user
current.assigned_to = gs.getUserID();
current.work_notes = 'Claimed by ' + gs.getUserName();
current.update();
action.setRedirectURL(current);
gs.addInfoMessage('Reservation has been claimed by you.');
