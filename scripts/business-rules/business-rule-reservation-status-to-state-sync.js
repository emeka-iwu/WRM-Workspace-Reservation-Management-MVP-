/**
 * Business Rule: Sync State with Reservation Status
 * Table: Reservation Tracker (x_1906134_worksp_0_reservation_tracker)
 *
 * When: before, update
 * Filter condition: Reservation status changes
 *
 * Keeps the inherited Task state field aligned with the custom
 * reservation status field, so task behaviour and reporting stay
 * consistent regardless of which field an agent or integration
 * updates directly. No current.update() call needed, changes to
 * current are saved automatically since this is a before rule.
 */
(function executeRule(current, previous /*null when async*/) {

    var reservationStatus = current.reservation_status.toString();

    if (reservationStatus == 'checked_in') {
        current.state = 1; // Open
    } else if (reservationStatus == 'no_show' || reservationStatus == 'cancelled') {
        current.state = 7; // Closed Skipped
    } else if (reservationStatus == 'checked_out') {
        current.state = 3; // Closed Complete
    }

})(current, previous);
