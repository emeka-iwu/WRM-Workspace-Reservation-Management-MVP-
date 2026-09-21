/**
 * Business Rule: Sync Workspace Status from Maintenance Ticket
 * Table: Workspace Maintenance (x_1906134_worksp_0_workspace_maintenance)
 *
 * When: after, insert and update
 * Filter condition: Ticket status changes
 *
 * Updates the related Workspace Options record when a maintenance
 * ticket opens or closes. Marks the workspace under_maintenance
 * while the ticket is open. On close, copies whichever outcome the
 * agent selected on the ticket's own workspace_status field
 * (available or decommissioned) across to Workspace Options, rather
 * than assuming a fixed outcome.
 *
 * Insert must be checked alongside Update. With Update only, the
 * sync does not fire on initial ticket creation, only on
 * subsequent edits.
 */
(function executeRule(current, previous /*null when async*/) {

    var ticketStatus = current.getValue('ticket_status');
    var workspaceStatus = current.getValue('workspace_status');

    var wsGR = new GlideRecord('x_1906134_worksp_0_workspace_options');

    if (!wsGR.get(current.workspace)) {
        gs.warn('Workspace Maintenance Sync: could not find related Workspace Options record for ticket ' + current.number + ' (workspace reference: ' + current.workspace + ')');
        return;
    }

    if (ticketStatus == 'open') {
        wsGR.setValue('status', 'under_maintenance');
    } else if (ticketStatus == 'closed') {
        if (workspaceStatus == 'available') {
            wsGR.setValue('status', 'available');
        } else if (workspaceStatus == 'decommissioned') {
            wsGR.setValue('status', 'decommissioned');
        }
    }

    wsGR.update();

})(current, previous);
