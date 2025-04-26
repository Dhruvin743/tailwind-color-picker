import * as vscode from 'vscode';
import resolveConfig from 'tailwindcss/resolveConfig';
import { existsSync } from 'fs';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'tailwind-color-grid.showColors',
    async () => {
      // Find Tailwind config file
      const configFiles = await vscode.workspace.findFiles(
        '**/tailwind.config.{js,cjs,mjs,ts}',
        '**/node_modules/**'
      );
      if (configFiles.length === 0) {
        vscode.window.showErrorMessage('No tailwind.config.js found');
        return;
      }

      const configPath = configFiles[0].fsPath;
      if (!existsSync(configPath)) {
        vscode.window.showErrorMessage('Tailwind config file not found');
        return;
      }

      try {
        // Load user config
        const { pathToFileURL } = await import('url');
        const userConfig = (async () => {
          return await import(pathToFileURL(configPath).href);
        })();
        const resolvedConfig = resolveConfig(userConfig);
        const colors = flattenColors(resolvedConfig.theme.colors);

        // Create and show webview
        const panel = vscode.window.createWebviewPanel(
          'tailwindColors',
          'Tailwind Colors',
          vscode.ViewColumn.One,
          { enableScripts: true }
        );

        panel.webview.html = getWebviewContent(
          colors,
          vscode.window.activeColorTheme.kind
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error loading Tailwind config: ${error}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

function flattenColors(colors: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  const colorRegex = /^(#([0-9a-f]{3}){1,2}|(rgb|hsl)a?\(.*\))$/i;

  for (const [key, value] of Object.entries(colors)) {
    const currentKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenColors(value, currentKey));
    } else if (typeof value === 'string' && colorRegex.test(value)) {
      result[currentKey] = value;
    }
  }

  return result;
}

function getWebviewContent(
  colors: Record<string, string>,
  themeKind: vscode.ColorThemeKind
): string {
  const isDarkTheme = themeKind === vscode.ColorThemeKind.Dark;
  const themeClass = isDarkTheme ? 'dark' : 'light';

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    padding: 16px;
                    background-color: ${isDarkTheme ? '#1e1e1e' : '#ffffff'};
                    color: ${isDarkTheme ? '#ffffff' : '#000000'};
                }
                
                .color-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 16px;
                }
                
                .color-card {
                    padding: 12px;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    background-color: ${isDarkTheme ? '#252526' : '#f3f3f3'};
                }
                
                .color-preview {
                    width: 100%;
                    height: 64px;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }
                
                .color-name {
                    font-family: var(--vscode-font-family);
                    font-size: 12px;
                    text-align: center;
                    word-break: break-all;
                }
            </style>
        </head>
        <body>
            <div class="color-grid">
                ${Object.entries(colors)
                  .map(
                    ([name, value]) => `
                    <div class="color-card">
                        <div class="color-preview" style="background-color: ${escapeHtml(
                          value
                        )}"></div>
                        <div class="color-name">${escapeHtml(name)}</div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </body>
        </html>
    `;
}

const escapeHtmlMap: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(unsafe: string): string {
  return unsafe.replace(
    /[&<>"']/g,
    (match) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[match as keyof typeof escapeHtmlMap] || match)
  );
}

export function deactivate() {}
