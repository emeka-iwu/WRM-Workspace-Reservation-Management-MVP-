# Business Requirements — WRM

## Overview

WRM (Workspace Reservation Management) is a ServiceNow scoped
application built to automate and streamline the workspace booking
process for hybrid office employees. It eliminates the need for
employees to coordinate desk and room bookings through spreadsheets,
email chains, or informal team channels.

---

## Business Problem

Hybrid work has made office space unpredictable, and most
organisations still manage it manually.

Global office utilization reached just 54% in 2025, meaning close to
half of leased office space sits unused on an average day.
(Source: JLL, 2025 Global Occupancy Planning Benchmark Report)

Meeting rooms fare worse, averaging just 30% utilization globally.
(Source: CBRE, 2025 Global Workplace & Occupancy Insights)

No-show rates on room and desk bookings run as high as 25 to 40%,
meaning booking data alone consistently overstates real usage.
(Source: Skedda, Office Space Utilization: The Complete 2026 Guide)

Manual booking systems offer no way to track any of this, leaving
companies making real estate decisions with no reliable data behind
them.

---

## Desired Outcomes

- A single centralised platform where employees browse and request
  workspaces without contacting facilities or checking a spreadsheet
- Automated approval routing, removing the need for manual
  coordination between requester and approver
- Real time visibility into which workspaces are actually available
- Full lifecycle tracking, check-in, check-out, and maintenance,
  without an agent manually updating status at each step
- A data foundation for future utilization reporting and real
  estate decisions

---

## Stakeholders

| Stakeholder                | Value                                                          |
| --------------------------- | --------------------------------------------------------------- |
| Employee                   | Self service booking with real time confirmation and instructions |
| Workplace Agents           | Automated approval queue, full reservation context, one click check-in and check-out |
| Workspace Maintenance Team | Automated ticket creation with issue context, no manual handoff |
| Facilities Manager         | Dashboard with utilization, status, and maintenance trends       |

---

## Personas

| Persona            | Role      | Access                                                          |
| ------------------- | --------- | ----------------------------------------------------------------- |
| Self Service User   | wrm_user  | Browse workspaces, submit reservation requests via portal, view own reservations |
| Workplace Agent     | wrm_agent | Approve or reject requests, check reservations in and out, manage maintenance tickets |
| Administrator       | wrm_admin | Full manage access to workspace inventory and configuration        |

---

## Scope — MVP

### In Scope

- Employee workspace browsing and reservation request via Service Portal
- Automated date validation (end date cannot precede start date)
- Automated approval routing to the Workplace Agents group
- Real time approval and rejection alerts via Discord
- Email confirmation with reservation details and cancellation instructions
- Automated status sync across reservation, workspace, and maintenance records
- Check-in, check-out, no-show, and claim actions for agents
- Maintenance ticket creation with automatic workspace status update
- Blocked closure of maintenance tickets while workspace remains in maintenance
- Read only protection on core workspace fields after creation
- Role based navigation and access across employee, agent, and admin views
- Knowledge base article on how to request a workspace
- Manager dashboard with utilization and status reporting

### Out of Scope (Post MVP)

- Self service cancellation from the portal
- Scheduled cleanup job for auto check-out and overdue check-in flagging
- CMDB and CI linked workspace availability
- Event Management integration for infrastructure driven availability
- Booking day and hour trend reporting (heatmap style utilization view)

---

## Workspace Availability Policy

A workspace's availability is driven entirely by reservation and
maintenance activity, not set manually by an agent.

- A workspace becomes unavailable the moment a reservation moves to
  pending check-in or checked-in
- A workspace becomes available again once a reservation is checked
  out, marked no-show, or cancelled
- A workspace moves to under maintenance the moment an open
  maintenance ticket is logged against it
- A workspace returns to available or moves to decommissioned based
  on the outcome the agent records when the maintenance ticket closes

---

## Validation Rules

The following checks run before a reservation or maintenance record
is created or closed:

1. End date/time cannot be earlier than start date/time
2. Only workspaces with a status of available are selectable on the
   reservation request form
3. The requester field is auto populated with the logged in user and
   cannot be edited
4. Workspace name, type, location, and max occupancy become read
   only once a workspace record is created
5. A maintenance ticket cannot be closed while the linked workspace
   status remains in maintenance
