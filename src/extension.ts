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

      let prompt = "";
      for (const file of stagedFiles) {
        const patch = await repo.diffIndexWithHEAD(file.uri.fsPath);
        prompt += `${patch}\n`;
        // vscode.window.showInformationMessage(patch);
      }

      const statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
      );
      statusBar.text = "$(sync~spin) Loading..."; // 内置加载动画图标

      // 生产中不要这样写死敏感数据，这里仅作演示，下面的idkey要在演示完成后删除
      const APP_ID = "bb67b75f5390408a9cc8883055d7bfac";
      const API_KEY = "sk-03b88fa4b2b44f808251259fa067c7f3";
      const url = `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;
      statusBar.show();
      try {
        const res: any = await fetch(url, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            input: {
              prompt,
            },
            parameters: {},
            debug: {},
          }),
        }).then((res) => res.json());
        if (res.output.text) {
          const re = () => /```\w*([\s\S]*?)```/;
          let message = "";
          if (re().test(res.output.text)) {
            const matched = res.output.text.match(re());
            message = (matched?.[1] || res.output.text).trim();
          } else {
            message = res.output.text.trim();
          }
          repo.inputBox.value = message;
        }
      } catch {
        repo.inputBox.value = "罢工了，你手写吧";
      } finally {
        statusBar.dispose(); // 完成后移除状态栏
      }

      context.subscriptions.push(disposable);
    },
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
