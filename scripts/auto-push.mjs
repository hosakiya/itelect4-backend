import { existsSync, watch } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const branch = "auto-sync";
const debounceMs = 5000;
const retryMs = 15000;
const directoryNames = ["src", "scripts", "test", "tests"];
const rootFileNames = [
  ".env.example",
  ".gitignore",
  "README",
  "README.md",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
];
const rootFiles = new Set(rootFileNames);
const watchers = new Map();
let syncTimer;
let syncing = false;
let syncAgain = false;

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message ?? result.stderr.trim() ?? `git ${args[0]} failed`);
  }

  return result.stdout.trim();
}

function normalize(relativePath) {
  return relativePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function isAllowed(relativePath) {
  const normalized = normalize(relativePath);
  const parts = normalized.split("/");

  if (parts.some((part) => [".env", ".git", ".vscode", "dist", "node_modules"].includes(part))) {
    return false;
  }

  return (
    rootFiles.has(normalized) ||
    directoryNames.some((directory) => normalized.startsWith(`${directory}/`))
  );
}

function syncChanges() {
  if (syncing) {
    syncAgain = true;
    return;
  }

  syncing = true;

  try {
    const currentBranch = runGit(["branch", "--show-current"]);
    if (currentBranch !== branch) {
      throw new Error(`Expected branch '${branch}', found '${currentBranch}'`);
    }

    const stagePaths = [
      ...directoryNames.filter((directory) => existsSync(path.join(root, directory))),
      ...rootFileNames.filter((file) => existsSync(path.join(root, file))),
    ];
    runGit(["add", "-A", "--", ...stagePaths]);

    const stagedPaths = runGit(["diff", "--cached", "--name-only"])
      .split(/\r?\n/)
      .filter(Boolean);
    const unexpectedPaths = stagedPaths.filter((file) => !isAllowed(file));
    if (unexpectedPaths.length > 0) {
      throw new Error(`Not syncing unexpected staged paths: ${unexpectedPaths.join(", ")}`);
    }

    const stagedDiff = spawnSync("git", ["diff", "--cached", "--quiet"], {
      cwd: root,
      windowsHide: true,
    });
    if (stagedDiff.error || stagedDiff.status > 1) {
      throw new Error(stagedDiff.error?.message ?? "Could not inspect staged changes");
    }

    if (stagedDiff.status === 1) {
      const timestamp = new Date().toISOString();
      runGit(["commit", "-m", `Auto-sync: ${timestamp}`]);
      console.log(`[auto-sync] Committed changes at ${timestamp}`);
    }

    runGit(["push", "origin", `HEAD:${branch}`]);
    console.log(`[auto-sync] Pushed to origin/${branch}`);
  } catch (error) {
    console.error(`[auto-sync] ${error.message}. Retrying in ${retryMs / 1000}s.`);
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncChanges, retryMs);
  } finally {
    syncing = false;
    if (syncAgain) {
      syncAgain = false;
      scheduleSync(1000);
    }
  }
}

function scheduleSync(delay = debounceMs) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncChanges, delay);
}

function watchDirectory(directory) {
  if (watchers.has(directory) || !existsSync(path.join(root, directory))) {
    return;
  }

  const watcher = watch(path.join(root, directory), { recursive: true }, (_event, filename) => {
    if (!filename || isAllowed(`${directory}/${filename.toString()}`)) {
      scheduleSync();
    }
  });
  watchers.set(directory, watcher);
}

if (runGit(["branch", "--show-current"]) !== branch) {
  throw new Error(`Start this task on the '${branch}' branch only`);
}

for (const directory of directoryNames) {
  watchDirectory(directory);
}

watch(root, { recursive: false }, (_event, filename) => {
  if (!filename) {
    return;
  }

  const relativePath = normalize(filename.toString());
  if (directoryNames.includes(relativePath)) {
    watchDirectory(relativePath);
    scheduleSync();
  } else if (isAllowed(relativePath)) {
    scheduleSync();
  }
});

console.log(`[auto-sync] Watching project files; pushes go to origin/${branch} after ${debounceMs / 1000}s idle.`);
console.log("[auto-sync] .env and .vscode/ are excluded; main is never updated automatically.");
syncChanges();