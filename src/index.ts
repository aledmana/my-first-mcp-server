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

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const server = new McpServer({
			name: "Stocks Server",
			version: "1.0",
		});
		server.registerTool("get-stock-price", {
			description: "티커 심볼을 입력받아 해당 주식의 가격을 조회한다.",
			inputSchema: {
				symbol: z.string(),
			},
		},
		async ({symbol}) => {
			return {
				content: [
					{
						type: "text",
						text: `${symbol}의 가격은 $10 USD 입니다.`,
					}
				]
			}
		});

		const handler = createMcpHandler(server);
		
		return handler(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
