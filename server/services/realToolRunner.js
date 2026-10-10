/**
 * Real System Tool Runner:
 * Actually writes files to disk in the workspace and executes real terminal
 * commands (Node.js, Python, npm, bash) using child_process.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class RealToolRunner {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    // Create actual dedicated workspace folder on disk
    this.workspaceDir = path.join(__dirname, '../workspace', sessionId);
    if (!fs.existsSync(this.workspaceDir)) {
      fs.mkdirSync(this.workspaceDir, { recursive: true });
    }
  }

  getWorkspacePath(filename) {
    // Prevent directory traversal
    const safeName = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.workspaceDir, safeName);
  }

  async writeFile(filename, content) {
    const fullPath = this.getWorkspacePath(filename);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, content, 'utf-8');
    return {
      success: true,
      filename,
      fullPath,
      bytes: Buffer.byteLength(content, 'utf-8'),
      output: `[Real Disk I/O] Wrote ${Buffer.byteLength(content, 'utf-8')} bytes to '${filename}' at ${fullPath}.`
    };
  }

  async readFile(filename) {
    const fullPath = this.getWorkspacePath(filename);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File '${filename}' does not exist on disk.`);
    }
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    return {
      success: true,
      filename,
      content,
      output: content
    };
  }

  async listFiles() {
    if (!fs.existsSync(this.workspaceDir)) return [];
    const getFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) {
          results = results.concat(getFiles(full));
        } else {
          results.push(path.relative(this.workspaceDir, full).replace(/\\/g, '/'));
        }
      });
      return results;
    };
    return getFiles(this.workspaceDir);
  }

  async runCommand(command, timeoutMs = 25000) {
    return new Promise((resolve) => {
      exec(command, {
        cwd: this.workspaceDir,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer
      }, (error, stdout, stderr) => {
        const out = stdout ? stdout.trim() : '';
        const err = stderr ? stderr.trim() : '';
        let fullOutput = out;
        if (err) {
          fullOutput = fullOutput ? `${fullOutput}\n[stderr]: ${err}` : `[stderr]: ${err}`;
        }
        if (!fullOutput) {
          fullOutput = error ? `Process exited with error: ${error.message}` : `(Command exited successfully with code 0)`;
        }

        resolve({
          command,
          success: !error,
          exitCode: error ? (error.code || 1) : 0,
          output: fullOutput
        });
      });
    });
  }

  async deleteFile(filename) {
    try {
      const fullPath = this.getWorkspacePath(filename);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return { success: true, filename, output: `[Real Disk I/O] Deleted '${filename}' from disk.` };
      }
      return { success: false, filename, output: `File '${filename}' was not found on disk.` };
    } catch (err) {
      return { success: false, filename, output: `Error deleting: ${err.message}` };
    }
  }
}

module.exports = RealToolRunner;
