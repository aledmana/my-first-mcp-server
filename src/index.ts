/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { createMcpHandler } from "agents/mcp";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

const widgetHtml = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f0f4f8;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 320px;
      width: 100%;
    }
    .city { font-size: 1.5rem; font-weight: 600; color: #1a202c; }
    .temp { font-size: 3rem; font-weight: 700; color: #2d3748; margin: 0.5rem 0; }
    .desc { font-size: 1rem; color: #718096; }
    .loading { color: #718096; }
  </style>
</head>
<body>
  <div class="card" id="price-card">
    <p class="loading">Loading stock price…</p>
  </div>

  <script type="module">

  import { App } from "https://esm.sh/@modelcontextprotocol/ext-apps/app-with-deps";

  const app = new App(
  	{name: 'Stocks App', version: '1.0'}
  )

  app.ontoolresult = ({structuredContent}) => {
  	if(!structuredContent) return;
  	document.getElementById("price-card").innerHTML = structuredContent.price;
  }

  app.connect();
  </script>
</body>
</html>`;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const server = new McpServer({
			name: "Stocks Server",
			version: "1.0",
		});

		registerAppResource(
			server,
			"Stocks Widget",
			"ui://stocks-ui",
			{ description: "주식 도구의 UI" },
			async () => {
				return {
					contents: [
						{
							uri: "ui://stocks-ui",
							text: widgetHtml,
							mimeType: RESOURCE_MIME_TYPE,
						}
					]
				}
			}
		)
		
		registerAppTool(
			server,
			"get-stock-price", {
				description: "티커 심볼을 입력받아 해당 주식의 가격을 조회한다.",
				inputSchema: {
					symbol: z.string(),
				},
				_meta: {
					ui: {
						resourceUri: 'ui://stocks-ui',
					},
					'openai/toolInvocation/invoking': 'Getting stocks...',
					'openai/toolInvocation/invoked': 'Search complete',
				},
				annotations: {
					openWorldHint: true,
					readOnlyHint: true,
				},
			},
			async ({symbol}) => {
				return {
					content: [
						{
							type: "text",
							text: `${symbol}의 가격은 $10 USD 입니다.`,
						}
					],
					structuredContent: {
						price: 10,
					}
				}
			}
		);

		const handler = createMcpHandler(server);
		
		return handler(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
