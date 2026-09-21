/**
 * UI Action: Needs Maintenance
 * Table: Reservation Tracker (x_1906134_worksp_0_reservation_tracker)
 *
 * Condition:
 * gs.hasRole('x_1906134_worksp_0.wrm_agent') && current.reservation_status == 'checked_out' && current.state==3
 *
 * Action type: Form button, client false (server side script)
 *
 * Creates a Workspace Maintenance record for the workspace linked to
 * this reservation, using the Maintenance issue field (close_notes)
 * as the issue description. Blocks the action with an error message
 * if that field is blank. Assigns the new ticket to the Workspace
 * Maintenance Team group. The Workspace Maintenance to Workspace
 * Options sync Business Rule reacts to the new ticket and marks the
 * workspace as under maintenance.
 */

(function() {

    // Validate that a maintenance issue comment is present
    if (!current.close_notes || current.close_notes == '') {
        gs.addErrorMessage('A comment is required in the Maintenance issue field before flagging for maintenance.');
        return;
    }

    // Create the Workspace Maintenance record
    var maint = new GlideRecord('x_1906134_worksp_0_workspace_maintenance');
    maint.initialize();
    maint.reservation = current.sys_id;
    maint.workspace = current.workspace;
    maint.workspace_status = 'in_maintenance';
    maint.ticket_status = 'open';
    maint.date_reported = new GlideDateTime();
    maint.issue_description = current.close_notes;

    // Assign to Workspace Maintenance Team
    var grp = new GlideRecord('sys_user_group');
    grp.addQuery('name', 'Workspace Maintenance Team');
    grp.query();
    if (grp.next()) {
        maint.assignment_group = grp.sys_id;
    }

    maint.insert();
    gs.addInfoMessage('Maintenance ticket created successfully.');

})();
action.setRedirectURL(current);
