# Issue 001 — Docker Compose: "No such image" after successful pull

**Date:** 2026-05-12  
**Context:** Starting the local PostgreSQL container for the first time after a Docker Desktop reinstall

---

## What happened

Running `docker compose up -d` failed with:

```
Error response from daemon: {"message":"No such image: postgres:16-alpine"}
```

The image was clearly present — `docker images | grep postgres` showed it, `docker pull postgres:16-alpine` completed successfully, and `docker compose pull` also reported success. But every attempt to start the container hit the same error immediately after pulling.

---

## Root cause

Docker Desktop has a setting called **"Use containerd for pulling and storing images"**. When enabled, images are stored in the containerd image store instead of the classic Docker image store.

The problem is a split: `docker pull` and `docker images` read from the containerd store correctly, but the Docker Compose daemon (in certain Docker Desktop versions) looks in the classic store and finds nothing. The pull succeeds into one store; compose looks in the other.

This was confirmed by checking the storage driver:

```
docker info | grep "Storage Driver"
# Storage Driver: overlayfs
#   driver-type: io.containerd.snapshotter.v1
```

The `io.containerd.snapshotter.v1` driver type confirms the containerd image store was active.

---

## Fix

One-time settings change in Docker Desktop:

1. Open **Docker Desktop**
2. Go to **Settings → General**
3. Uncheck **"Use containerd for pulling and storing images"**
4. Click **Apply & Restart**

After Docker restarts, `docker compose up -d` works normally.

---

## How to avoid next time

If `docker compose up -d` fails with "No such image" immediately after a successful pull, check the storage driver first:

```bash
docker info | grep -A1 "Storage Driver"
```

If you see `io.containerd.snapshotter.v1`, the containerd image store setting is the likely culprit. Disable it in Docker Desktop settings before spending time on other fixes.
