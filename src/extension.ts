import * as vscode from "vscode";
import ollama from "ollama";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "deepseek-extension" is now active!');

  const disposable = vscode.commands.registerCommand(
    "deepseek-extension.helloWorld",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepseek-extension",
        "DeepSeek AI",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebViewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        console.log("Received message from webview:", message);
        
        if (message.command === "chat") {
          const userPrompt = message.text;
          let responseText = "";

          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:1.5b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const chunk of streamResponse) {
              console.log("Received chunk:", chunk);
              if (chunk && chunk.message && chunk.message.content) {
                responseText += chunk.message.content;
                panel.webview.postMessage({ command: "response", text: responseText });
              } else {
                console.error("Unexpected chunk structure:", chunk);
              }
            }
          } catch (error) {
            let errorMessage = "An unknown error occurred";
            if (error instanceof Error) {
              errorMessage = error.message;
            }
            panel.webview.postMessage({ command: "response", text: "Error: " + errorMessage });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebViewContent(): string {
  return /*html*/ `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DeepSeek AI</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #f4f4f4;
          }
          h2 {
              color: #333;
          }
          #prompt {
              width: 80%;
              padding: 10px;
              font-size: 16px;
              border: 1px solid #ccc;
              border-radius: 5px;
              margin-bottom: 10px;
          }
          button {
              padding: 10px 20px;
              font-size: 16px;
              background-color: #007BFF;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
          }
          button:hover {
              background-color: #0056b3;
          }
          #response {
              width: 80%;
              min-height: 100px;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              background-color: white;
              margin-top: 10px;
              color: black;
              overflow: auto;
              word-wrap: break-word;
              white-space: pre-wrap;
              text-align: left;
          }
          .dots {
              display: inline-block;
              width: 10px;
              height: 10px;
              margin-left: 5px;
              background-color: black;
              border-radius: 50%;
              animation: blink 1.5s infinite;
          }
          .dots:nth-child(2) {
              animation-delay: 0.5s;
          }
          .dots:nth-child(3) {
              animation-delay: 1s;
          }
          @keyframes blink {
              0%, 100% { opacity: 0; }
              50% { opacity: 1; }
          }
      </style>
  </head>
  <body>
      <h2>DeepSeek AI Extension</h2>
      <textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
      <button id="submit">Submit</button>
      <div id="response">Response will appear here...</div>
      
      <script>
          const input = document.getElementById("prompt");
          const responseDiv = document.getElementById("response");
          const vscode = acquireVsCodeApi();

          document.getElementById("submit").addEventListener("click", () => {
              const text = input.value;
              if (!text.trim()) return;
              input.value = "";
              responseDiv.innerHTML += "\\n\\n\\nLoading<span class='dots'></span><span class='dots'></span><span class='dots'></span>";
              console.log("Message Sent:", text);
              vscode.postMessage({ command: "chat", text: text });
          });

          window.addEventListener("message", event => {
              const message = event.data;
              if (message.command === "response") {
                  responseDiv.innerHTML = message.text;
              }
          });
      </script>
  </body>
  </html>`;
}

export function deactivate() {}
