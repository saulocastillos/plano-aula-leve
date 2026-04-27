import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(command, args, options = {}) {
  await execFileAsync(command, args, {
    maxBuffer: 1024 * 1024 * 20,
    ...options
  });
}

export async function makeTempDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
}

export async function extractOfficeArchive(filePath, prefix) {
  const tempDir = await makeTempDir(prefix);

  if (process.platform === "win32") {
    await run("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${filePath.replace(/'/g, "''")}' -DestinationPath '${tempDir.replace(/'/g, "''")}' -Force`
    ]);
  } else {
    await run("unzip", ["-qq", filePath, "-d", tempDir]);
  }

  return tempDir;
}

export async function packOfficeArchive(sourceDir, outputPath) {
  const absoluteOutputPath = path.resolve(outputPath);
  await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
  await fs.rm(absoluteOutputPath, { force: true });

  if (process.platform === "win32") {
    const tempZip = `${absoluteOutputPath}.zip`;
    await fs.rm(tempZip, { force: true });
    await run("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${path.join(sourceDir, "*").replace(/'/g, "''")}' -DestinationPath '${tempZip.replace(/'/g, "''")}' -Force`
    ]);
    await fs.rename(tempZip, absoluteOutputPath);
    return;
  }

  await run("zip", ["-qr", absoluteOutputPath, "."], { cwd: sourceDir });
}
