---
name: wait-for-explicit-command
description: "Standby-only workflow that does not act until the user explicitly gives a go-command. Use when pausing execution, preventing auto-actions, or requiring explicit operator control before any tool use or edits."
argument-hint: "Optional policy text, for example: Do not do anything until I say GO"
user-invocable: true
---

# Wait For Explicit Command

## Outcome
Keep the agent in standby mode until the user gives an explicit action command.

## When to Use
- User says to wait, pause, hold, or stand by.
- User wants no autonomous actions.
- User wants explicit operator approval before any execution.

## Procedure
1. Enter standby mode immediately.
2. Do not run tools.
3. Do not edit files.
4. Do not execute terminal commands.
5. Do not navigate or interact with browser pages.
6. Reply only with a short standby confirmation and request the next explicit command.

## Go-Command Rules
1. Only leave standby when the user message includes a direct instruction to perform work.
2. Treat short directives as valid go-commands, including examples like:
   - "go"
   - "do it"
   - "run this"
   - "apply this change"
   - any clear imperative task request
3. If the message is ambiguous, stay in standby and ask for one explicit action.

## Safety Checks
1. Before acting, confirm a go-command is present in the latest user message.
2. If no go-command is present, stay in standby.
3. Keep standby responses short and non-operational.

## Completion Criteria
- No tools were called while in standby mode.
- No files were changed while in standby mode.
- No command execution occurred while in standby mode.
- The user provided an explicit go-command before any action began.
