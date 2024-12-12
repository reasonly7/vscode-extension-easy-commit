// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "easy-commit.generateCommitMessage",
    async () => {
      // 获取 Git API
      const gitExtension = vscode.extensions.getExtension("vscode.git");
      if (!gitExtension) {
        vscode.window.showErrorMessage("当前 VSCode 中没有 Git 插件！");
        return;
      }

      if (!gitExtension.isActive) {
        await gitExtension.activate();
      }
      const gitApi = gitExtension.exports.getAPI(1);
      const repositories = gitApi.repositories;

      if (repositories.length === 0) {
        vscode.window.showErrorMessage("当前目录下没有 Git 仓库！");
        return;
      }

      const repo = repositories[0]; // 获取第一个仓库
      const stagedFiles = repo.state.indexChanges; // 暂存区文件列表

      if (stagedFiles.length === 0) {
        vscode.window.showInformationMessage("暂存区中没有发现任何文件！");
        return;
      }
      for (const file of stagedFiles) {
        const patch = await repo.diffIndexWithHEAD(file.uri.fsPath);
        vscode.window.showInformationMessage(patch);
      }

      context.subscriptions.push(disposable);
    },
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
