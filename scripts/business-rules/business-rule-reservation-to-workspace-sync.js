/**
 * Business Rule: Sync Workspace Availability on Reservation Status Change
 * Table: Reservation Tracker (x_1906134_worksp_0_reservation_tracker)
 *
 * When: after, update
 * Filter condition: Reservation status changes
 *
 * Updates the related Workspace Options record when reservation
 * status changes. Marks the workspace unavailable while a
 * reservation is pending check-in or checked-in, and available
 * again once it is checked-out, no-show, or cancelled.
 */
(function executeRule(current, previous /*null when async*/) {

    var reservationStatus = current.reservation_status.toString();

    var wsGR = new GlideRecord('x_1906134_worksp_0_workspace_options');

    if (!wsGR.get(current.workspace)) {
        gs.warn('Reservation Tracker Sync: could not find related Workspace Options record for reservation ' + current.number + ' (workspace reference: ' + current.workspace + ')');
        return;
    }

    if (reservationStatus == 'pending_check_in' || reservationStatus == 'checked_in') {
        wsGR.setValue('status', 'unavailable');
    } else if (reservationStatus == 'checked_out' || reservationStatus == 'no_show' || reservationStatus == 'cancelled') {
        wsGR.setValue('status', 'available');
    }

    wsGR.update();

})(current, previous);
