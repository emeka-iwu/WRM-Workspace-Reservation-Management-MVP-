# Removing Out of Box UI Actions

This is a configuration step, not a script. Documented here rather
than as a code file since there is nothing to export beyond the
setting change itself.

## What was removed

The Discuss, Update, and Delete buttons were removed from the
Reservation Tracker form. These are inherited from the Task table,
which Reservation Tracker extends.

They were removed because every state transition on a reservation
is handled by the custom UI Actions (Check-In, Check-Out, No-Show,
Needs Maintenance, Claim). Leaving the inherited buttons active
would let an agent bypass that logic entirely, editing the record
directly without triggering the sync Business Rules or the
Maintenance issue validation on the Needs Maintenance action.

## How it was done

A new UI Action record was created for each button to be hidden,
scoped to the Reservation Tracker table. On each new record, the
Action name field was set to match the internal action name of the
out of box button being overridden, rather than a new custom name:

| New UI Action Name | Action Name Field | Condition |
| --------------------- | ------------------- | ----------- |
| Hide Discuss             | sysverb_discuss        | false          |
| Hide Update                | sysverb_update           | false          |
| Hide Delete                   | sysverb_delete            | false          |

Setting the Action name field to the same internal verb as the out
of box action (sysverb_discuss, sysverb_update, sysverb_delete)
causes the new, table specific record to override the inherited one
for Reservation Tracker specifically. Setting Condition to false
means the button never evaluates as visible, regardless of role or
record state, effectively hiding it without touching the original
out of box UI Action record, which continues to work normally on
every other table that extends Task.

## Acceptance criteria

- Discuss, Update, and Delete buttons do not appear on the
  Reservation Tracker form
- Discuss, Update, and Delete remain unaffected on other tables
  that extend Task
