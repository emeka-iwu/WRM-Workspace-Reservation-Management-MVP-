# Business Rule: Block Maintenance Closure While In Maintenance

Table: Workspace Maintenance (x_1906134_worksp_0_workspace_maintenance)

When: before, update

This rule has no script. It is a deliberate example of choosing
configuration over scripting, since the requirement was fully
expressible using a filter condition and two built in Simple
Actions.

## Filter Condition

Ticket status changes to Closed AND Workspace status is In
maintenance

## Actions

| Action        | Configuration                                                                 |
| --------------- | -------------------------------------------------------------------------------- |
| Add Message        | "You are unable to close this ticket because the workspace is still in maintenance." |
| Abort Action          | Checked                                                                             |

## Why no script

The filter condition alone determines whether the rule fires. Add
Message displays the required text to the user as a form error.
Abort Action stops the save entirely, so the ticket remains open
and no change is committed. No scripting API is needed for either
step, so writing a script here would only add unnecessary
complexity to something the platform's declarative tools already
handle completely.

## Interaction with the Maintenance to Workspace sync rule

This rule runs before, the maintenance to workspace sync rule runs
after, on the same table and the same field change. If this rule
aborts the save, the after rule never fires, since there is nothing
to sync from a transaction that never committed. This is the
correct behaviour: a blocked closure should never be treated as a
real status change.
