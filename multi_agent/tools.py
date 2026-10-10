"""Tools accessible by coding agents with transparent result logging."""

import os
import subprocess
import sys
import tempfile
from typing import Any, Dict, List, Optional
from .models import ToolCall, ToolResult


class WorkspaceTools:
    """Provides file operations and code execution in a designated workspace folder."""

    def __init__(self, workspace_dir: Optional[str] = None):
        if workspace_dir is None:
            self.workspace_dir = os.path.join(os.getcwd(), "workspace_output")
        else:
            self.workspace_dir = workspace_dir
        os.makedirs(self.workspace_dir, exist_ok=True)

    def write_file(self, filename: str, content: str) -> str:
        """Write content to a file in the workspace directory."""
        filepath = os.path.join(self.workspace_dir, filename)
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to '{filename}'."

    def read_file(self, filename: str) -> str:
        """Read content from a file in the workspace directory."""
        filepath = os.path.join(self.workspace_dir, filename)
        if not os.path.exists(filepath):
            return f"Error: File '{filename}' not found."
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    def list_files(self) -> str:
        """List all files in the workspace directory."""
        files = []
        for root, _, filenames in os.walk(self.workspace_dir):
            for fn in filenames:
                rel = os.path.relpath(os.path.join(root, fn), self.workspace_dir)
                files.append(rel)
        if not files:
            return "Workspace is currently empty."
        return "Workspace files:\n" + "\n".join(f"- {f}" for f in sorted(files))

    def execute_python_code(self, code: str, timeout: int = 15) -> Dict[str, Any]:
        """Safely executes a Python code snippet and captures stdout/stderr."""
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        try:
            res = subprocess.run(
                [sys.executable, tmp_path],
                cwd=self.workspace_dir,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            success = (res.returncode == 0)
            output = ""
            if res.stdout:
                output += res.stdout
            if res.stderr:
                if output:
                    output += "\n--- STDERR ---\n"
                output += res.stderr
            if not output:
                output = "(Executed with no output, exit code 0)"

            return {
                "success": success,
                "returncode": res.returncode,
                "output": output.strip()
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "returncode": -1,
                "output": f"Execution timed out after {timeout} seconds."
            }
        except Exception as e:
            return {
                "success": False,
                "returncode": -1,
                "output": f"Execution failed: {str(e)}"
            }
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    def run_tool(self, tool_call: ToolCall) -> ToolResult:
        """Dispatch a tool call and wrap into a ToolResult."""
        name = tool_call.name
        args = tool_call.arguments

        try:
            if name == "write_file":
                out = self.write_file(args.get("filename", "output.txt"), args.get("content", ""))
                return ToolResult(tool_call_id=tool_call.id, name=name, output=out, success=True)
            elif name == "read_file":
                out = self.read_file(args.get("filename", ""))
                return ToolResult(tool_call_id=tool_call.id, name=name, output=out, success=not out.startswith("Error"))
            elif name == "list_files":
                out = self.list_files()
                return ToolResult(tool_call_id=tool_call.id, name=name, output=out, success=True)
            elif name == "execute_python":
                res = self.execute_python_code(args.get("code", ""))
                return ToolResult(
                    tool_call_id=tool_call.id,
                    name=name,
                    output=res["output"],
                    success=res["success"]
                )
            else:
                return ToolResult(
                    tool_call_id=tool_call.id,
                    name=name,
                    output=f"Unknown tool: {name}",
                    success=False
                )
        except Exception as e:
            return ToolResult(
                tool_call_id=tool_call.id,
                name=name,
                output=f"Tool error: {str(e)}",
                success=False
            )
