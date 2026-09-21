# Technical Documentation — WRM

## Application Overview

| Property   | Value              |
| ---------- | ------------------ |
| Platform   | ServiceNow         |
| App Type   | Scoped Application |
| App Name   | Workspace Reservation Management |
| Scope      | x_1906134_worksp_0 |
| Build Type | Capstone Project   |
| Year       | 2026               |

---

## Table Structure

### Workspace Options (x_1906134_worksp_0_workspace_options)

Auto-number prefix: WRO

| Field Label         | Field Name             | Type      | Notes                                      |
| -------------------- | ------------------------ | --------- | -------------------------------------------- |
| Status               | status                   | Choice    | Available, Unavailable, Under maintenance, Decommissioned. Internal values: available, unavailable, under_maintenance, decommissioned |
| Workspace name       | workspace_name           | String    | Read only after creation (Data Policy)       |
| Workspace type       | workspace_type           | Choice    | Hot desk, Focus room, Collaboration space, Meeting room. Read only after creation |
| Location             | location                 | Reference | References cmn_location. Read only after creation |
| Max occupancy        | max_occupancy            | Integer   | Read only after creation                     |
| Workspace description| workspace_description     | String    | Max length 1000                              |
| Image                | image                     | Image     | Displayed via constructed /sys_attachment.do URL, not a direct getValue() |

---

### Reservation Tracker (x_1906134_worksp_0_reservation_tracker)

Extends: task. Auto-number prefix: WRT

| Field Label         | Field Name          | Type      | Notes                                        |
| -------------------- | ---------------------- | --------- | ----------------------------------------------- |
| Request number       | u_request_number       | Reference | References sc_req_item                          |
| Workspace             | workspace              | Reference | References Workspace Options. Read only via UI Policy |
| Reservation status    | reservation_status     | Choice    | Internal values: pending_check_in, checked_in, checked_out, cancelled, no_show |
| Reserved for           | reserved_for            | Reference | References sys_user. Read only via UI Policy    |
| Additional notes      | additional_notes        | String    | Max length 1000                                  |

Inherited fields, relabeled via dictionary override rather than renamed:

| Original Field | Displayed As      | Notes                                                  |
| --------------- | -------------------- | --------------------------------------------------------- |
| Actual start     | Start date/time      | Internal name work_start. Read only via UI Policy         |
| Actual end       | End date/time        | Internal name work_end                                     |
| Description      | Purpose of visit     | Hidden for Cancelled/No-show via UI Policy                 |
| Close notes       | Maintenance issue    | Internal name close_notes. Shown only when reservation status is Checked-out |
| State (task)      | State                | See State Cycles below                                      |

---

### Workspace Maintenance (x_1906134_worksp_0_workspace_maintenance)

Auto-number prefix: WRM

| Field Label      | Field Name       | Type      | Notes                                          |
| ------------------ | ------------------- | --------- | --------------------------------------------------- |
| Reservation         | reservation          | Reference | References Reservation Tracker. Required             |
| Workspace           | workspace            | Reference | References Workspace Options. Required               |
| Workspace status     | workspace_status      | Choice    | Available, In maintenance, Decommissioned. Internal values: available, in_maintenance, decommissioned. Required |
| Ticket status         | ticket_status          | Choice    | Open, Closed. Internal values: open, closed. Required |
| Date reported          | date_reported           | Date      | Required                                              |
| Issue description       | issue_description        | String    | Max length 1000. Required                             |
| Work performed          | work_performed           | String    | Max length 1000. Optional                             |
| Assignment group        | assignment_group         | Reference | References sys_user_group                            |
| Assigned to              | assigned_to               | Reference | References sys_user                                   |

Note: the internal value for the maintenance state on this table
(in_maintenance) differs from the internal value used on the
Workspace Options status field (under_maintenance). Both represent
the same real world state but are stored as different strings
across the two tables. Worth normalising in a future iteration.

---

## Roles and Groups

| Role                        | Purpose                                    |
| ----------------------------- | --------------------------------------------- |
| wrm_user                     | Submits reservation requests via portal        |
| wrm_agent                    | Processes reservations, check-in, check-out    |
| workspace_maintenance_user    | Table role for Workspace Maintenance. Manages maintenance tickets |
| wrm_admin                    | Manages workspace inventory and configuration   |

| Group                     | Roles Assigned                     | Purpose                          |
| ---------------------------- | ------------------------------------- | ------------------------------------- |
| Workspace Agents             | itil, approver_user, wrm_agent        | Receives approval requests, assigned to reservations |
| Workspace Maintenance Team   | workspace_maintenance_user            | Receives maintenance tickets           |

---

## State Cycles

### Reservation Status (Reservation Tracker)

| Status           | Description                                       |
| ------------------ | ----------------------------------------------------- |
| Pending check-in    | Reservation approved, awaiting check-in                |
| Checked-in          | Guest has checked in. Workspace becomes unavailable     |
| Checked-out          | Guest has checked out. Workspace becomes available again |
| No-show               | Guest never checked in                                  |
| Cancelled              | Reservation cancelled                                    |

### Task State (Reservation Tracker, synced from Reservation Status)

| Value | Label            | Synced From                     |
| ----- | ------------------ | ---------------------------------- |
| -5    | Pending             | Default on creation                 |
| 1     | Open                | Reservation status: Checked-in      |
| 2     | Work in Progress     | Not used by this application         |
| 3     | Closed Complete       | Reservation status: Checked-out       |
| 4     | Closed Incomplete      | Not used by this application           |
| 7     | Closed Skipped          | Reservation status: No-show or Cancelled |

### Workspace Options Status

| Status              | Set By                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| Available              | Default, or when a maintenance ticket closes with outcome Available    |
| Unavailable             | Reservation moves to Pending check-in or Checked-in                     |
| Under maintenance        | A maintenance ticket is opened against the workspace                     |
| Decommissioned             | A maintenance ticket closes with outcome Decommissioned                    |

### Workspace Maintenance Ticket Status

| Status | Description                          |
| -------- | ----------------------------------------- |
| Open     | Ticket active, workspace under maintenance |
| Closed   | Ticket resolved, outcome recorded on workspace_status |

---

## Business Rules

### 1. Sync Workspace Availability on Reservation Status Change

Table: Reservation Tracker. When: after, update. Filter: reservation status changes.

Reads the reservation status on the current record, retrieves the
linked Workspace Options record via the workspace reference field,
and sets its status to unavailable when the reservation is pending
check-in or checked-in, and available when the reservation is
checked-out, no-show, or cancelled.

### 2. Sync State with Reservation Status

Table: Reservation Tracker. When: before, update. Filter: reservation status changes.

Sets the current record's inherited state field directly, no
current.update() needed since this is a before rule. Maps
checked-in to Open (1), checked-out to Closed Complete (3), and
no-show or cancelled to Closed Skipped (7).

### 3. Sync Workspace Status from Maintenance Ticket

Table: Workspace Maintenance. When: after, insert and update. Filter: ticket status changes.

Retrieves the linked Workspace Options record via the workspace
reference field. Sets it to under_maintenance when the ticket is
open. When the ticket closes, copies whichever outcome the agent
selected on workspace_status (available or decommissioned) across
to the Workspace Options status field, rather than assuming a fixed
outcome.

Insert must be checked alongside Update on this rule. An earlier
build only had Update checked, which meant the sync never fired on
initial ticket creation, only on subsequent edits.

### 4. Block Maintenance Closure While In Maintenance

Table: Workspace Maintenance. When: before, update. Filter: ticket status changes to Closed AND workspace status is In maintenance.

Built using Simple Actions rather than a script. Add Message
displays the required error text, and Abort Action stops the save
entirely. Chosen deliberately as a configuration-over-scripting
example, since the requirement was fully expressible through filter
conditions and the two built in actions.

---

## UI Actions — Reservation Tracker

| Button            | Shown When                                                        | Action                                              |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Check-In              | Reservation status = Pending check-in AND user has wrm_user role        | Sets reservation status to Checked-in, logs a work note      |
| Check-Out              | Reservation status = Checked-in AND user has wrm_user role               | Sets reservation status to Checked-out, logs a work note       |
| No-Show                 | User has wrm_agent role AND reservation status = Pending check-in AND start date/time is in the past | Sets reservation status to No-show, logs a work note              |
| Needs Maintenance         | User has wrm_agent role AND reservation status = Checked-out AND state is Closed Complete or Closed Skipped | Validates Maintenance issue is not blank, creates a Workspace Maintenance record, assigns it to the Workspace Maintenance Team group |
| Claim                       | Reservation Tracker and Workspace Maintenance. Assigned to is empty AND user has wrm_agent role | Assigns the record to the logged in user                            |

The out of box Discuss, Update, and Delete buttons were removed
from the Reservation Tracker form, since these actions are handled
entirely through the custom buttons above.

---

## UI Policies — Reservation Tracker

| Policy                                             | Condition                                                            | Action                                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Core fields always read only                            | Runs on load, always fires                                               | Request number, Reserved for, Workspace, and Location become read only            |
| Hide reservation details for cancelled or no-show records | Reservation status is Cancelled or No-show, AND state is Closed Complete or Closed Skipped | Start date/time, End date/time, Purpose of visit, and Additional notes hidden |
| Show maintenance issue field for checked-out records       | Reservation status is Checked-out, AND state is Closed Complete or Closed Skipped | Maintenance issue field shown in the Activity section                              |

---

## Data Policy — Workspace Options

Applied server side, not just on the form, so enforcement holds
across UI, imports, and web service access.

| Field           | Behaviour                        |
| ------------------ | ------------------------------------ |
| Workspace name       | Read only after record creation        |
| Workspace type        | Read only after record creation          |
| Location                | Read only after record creation            |
| Max occupancy             | Read only after record creation              |

Apply to all records is left unchecked so the fields remain
editable during initial creation, only becoming locked afterward.

---

## Catalog Client Script — Reservation Request

Type: onChange, on the End date/time variable.

Compares End date/time against Start date/time as strings, which
works because ServiceNow stores date/times in a sortable format. If
the end value precedes the start value, the field is cleared first,
then the error message is attached. Clearing before messaging
matters: attaching the message first and clearing second causes the
field's re-render to wipe the message before it displays.

---

## Flow Designer — Reservation Approval Flow

### Trigger

Service Catalog submission of the Request Workspace Reservation
catalog item.

### Steps (as built)

| Step | Action                    | Description                                            |
| ---- | ---------------------------- | ------------------------------------------------------------ |
| 1    | Get Catalog Variables          | Extracts the values entered on the catalog form                |
| 2    | Ask for Approval                 | Routes the request to the Workspace Agents group                  |
| 3    | If / Else                          | Branches on approval outcome                                        |
| 4    | Create Record (approved path)        | Creates the Reservation Tracker record with mapped fields              |
| 5    | Update Record (approved path)          | Closes the RITM as Closed Complete                                       |
| 6    | Custom Script Action (approved path)     | Sends a Discord approval notification via the Script Include                |
| 7    | Update Record (rejected path)              | Closes the RITM as Closed Skipped                                              |
| 8    | Send Email (rejected path)                   | Notifies the requester of rejection                                              |
| 9    | Custom Script Action (rejected path)           | Sends a Discord rejection notification via the Script Include                       |

---

## Script Include — discordNotification

Class Class.create() pattern, method sendMessage(message, emoji).
Uses sn_ws.RESTMessageV2 to POST a JSON payload to a Discord
webhook URL, read from the system property
x_1906134_worksp_0.discord.webhook_url rather than hardcoded. Wrapped
in try/catch, with gs.error() logging on failure so a network issue
does not break the calling flow.

---

## System Properties

| Property                                     | Purpose                          |
| ------------------------------------------------ | ------------------------------------- |
| x_1906134_worksp_0.discord.webhook_url             | Discord webhook URL used by the Script Include |

---

## SLA — Reservation Fulfillment

| Property    | Value                                                       |
| -------------- | ------------------------------------------------------------- |
| Table            | sc_req_item                                                       |
| Start condition   | State is Open AND Catalog item is Request Workspace Reservation      |
| Stop condition      | State is Closed Complete                                                |
| Target                | 4 hours                                                                   |
| Schedule                | 8x5 business hours                                                          |

The Task SLA related list was added to the RITM form so agents can
see the running timer without leaving the record.

---

## Notifications

| Notification                              | Table              | Trigger                                                     | Recipient   |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------- | -------------- |
| Reservation Confirmation                        | sc_req_item            | State changes to Closed Complete AND catalog item is Request Workspace Reservation | Opened by       |
| Workspace Check-Out Inspection Required             | Reservation Tracker      | Reservation status changes to Checked-out                          | Assigned to       |

Both are declarative Notification records rather than Business
Rule plus event pairs, since neither required custom server side
logic beyond a straightforward field change condition.

---

## Access Control (ACLs)

Table level CRUD, edited from the four auto generated ACLs per
table.

| Table                  | Read                            | Create                      | Write                        | Delete   |
| -------------------------- | ------------------------------------ | -------------------------------- | ---------------------------------- | ---------- |
| Workspace Options             | No role required within the app scope    | Table role or wrm_admin              | Table role or wrm_admin                | admin only |
| Reservation Tracker              | wrm_agent, wrm_user                        | wrm_agent                                | wrm_agent, wrm_user                        | admin only |
| Workspace Maintenance               | workspace_maintenance_user or wrm_agent        | wrm_agent, workspace_maintenance_user        | workspace_maintenance_user                     | admin only |

An additional ACL was added on sys_attachment, scoped to
table_name=sp_widget, to allow non-admin portal users to view
widget-attached images such as the hero banner photo. The default
sys_attachment read ACL did not permit this for standard users.

---

## Service Portal

| Property   | Value                       |
| ------------ | -------------------------------- |
| URL suffix     | wrm                               |
| Homepage         | Workspace Reservations Home         |
| Header menu        | Custom menu, duplicated from the platform default rather than edited directly, to avoid affecting other portals on the instance |

### Widgets

| Widget                    | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------------- |
| Portal Hero Banner                | Welcome banner with first name greeting, background photo, and global search bar |
| Available Workspaces                 | Displays available workspaces as cards, queried server side and filtered to status = available. Clicking a card opens a detail modal with a Request This Workspace button that deep links to the catalog item |
| Recent Notifications                    | Displays the logged in user's recent emails, queried from sys_email filtered by recipient |
| Knowledge Articles                         | Displays recently published Knowledge Base articles with a link to browse all |
| My Reservations                                | Displays the logged in user's own Reservation Tracker records, filtered by reserved_for |

Role restricted navigation items (Requests, Approvals) are shown
or hidden depending on the logged in user's role, so agents and
employees see a different menu.

---

## Dashboard and Reports

A manager facing dashboard containing:

- Workspace Availability Overview, a pie chart grouped by Workspace Options status
- Reservation Status Distribution, a pie chart grouped by Reservation status
- Reservations by Space Type, a bar chart grouped by Workspace type
- Most Booked Workspaces, a bar chart grouped by Workspace
- Maintenance Ticket Status, a pie chart grouped by Ticket status
- Bookings by Day of Week and Bookings by Hour of Day, bar charts driven
  by two helper fields, Booking Day of Week and Booking Hour, calculated
  from Start date/time via a dedicated Business Rule since ServiceNow's
  native reporting cannot group by calendar weekday or hour directly

---

## Known Issues and Limitations

| Issue                                        | Detail                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Catalog client scripts cannot read URL parameters   | window is sandboxed and blocked in this context, and g_form.getParameter() does not exist in Service Portal's GlideForm implementation, unlike the classic UI. Workspace prefill via deep link was scoped back to a manual reselect |
| Service Portal page level CSS scoping                 | The visible content area sits inside a nested wrapper with the class body, which covers a plain body { } CSS rule. Required targeting main.body directly |
| Image field values are not directly usable URLs          | gr.getValue() on an Image field returns an attachment sys_id, not a URL. Requires manually constructing /sys_attachment.do?sys_id= in server script |
| Scheduled cleanup job                                        | A nightly job to auto check-out reservations past their end time with no manual check-out, and flag overdue pending check-ins, was designed but not implemented in the MVP |
| CMDB and CI linked availability                                | Supporting CI reference field on Workspace Options was scoped and designed but not implemented in the MVP |
