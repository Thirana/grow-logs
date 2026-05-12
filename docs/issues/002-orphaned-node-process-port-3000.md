# Issue 002 — Orphaned Node process blocking port 3000

**Date:** 2026-05-12  
**Context:** Starting the NestJS dev server after a Claude Code session that ran background Bash commands

---

## What happened

Running `npm run start:dev` failed immediately with:

```
Error: listen EADDRINUSE: address already in use :::3000
```

No other server had been manually started. The port was being held by an orphaned Node.js process left behind from a background Bash command that wasn't cleaned up when the session ended.

---

## Root cause

Claude Code ran `npm run start:dev` (or similar) in a background Bash command to verify server behaviour. Background processes in Bash tool calls are not reliably terminated when the command completes — the Node process kept running, holding port 3000, with no visible terminal to kill it from.

---

## Fix

**Step 1 — Check if something is on port 3000:**

```bash
lsof -i :3000
```

Output looks like:

```
COMMAND   PID             USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    12345 thiranaembuldeniya   23u  IPv6 0x...      0t0  TCP *:hbci (LISTEN)
```

**Step 2 — Identify the process:**

```bash
lsof -i :3000 | grep LISTEN
```

Note the `PID` value from the output (e.g. `12345`).

**Step 3 — Kill it:**

```bash
kill -9 <PID>
# e.g. kill -9 12345
```

Or do it in one command without needing to copy the PID:

```bash
kill -9 $(lsof -t -i :3000)
```

**Step 4 — Confirm the port is free:**

```bash
lsof -i :3000
# should return nothing
```

Now `npm run start:dev` will start normally.

---

## Useful variants

Check all ports your Node processes are listening on:

```bash
lsof -i -P -n | grep node
```

Check what process is on any specific port (replace 3000 with any port):

```bash
lsof -i :<port>
```

---

## How to avoid next time

Never start a long-running dev server in a background Bash command to verify behaviour. Use `tsc --noEmit` or `nest build` to verify compilation without starting a server process. If you need to test live server behaviour, start it yourself in a terminal so you have full control over it.
