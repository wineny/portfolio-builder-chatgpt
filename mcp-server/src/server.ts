import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL, fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

type PizzazWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "assets");

function readWidgetHtml(componentName: string): string {
  // GitHub Pages base URL
  const GITHUB_PAGES_BASE = "https://wineny.github.io/portfolio-builder-chatgpt/assets";

  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `Widget assets not found. Expected directory ${ASSETS_DIR}. Run "pnpm run build" before starting the server.`
    );
  }

  // Find CSS and JS files
  const cssFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter((file) => file.startsWith(`${componentName}-`) && file.endsWith(".css"))
    .sort();
  const jsFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter((file) => file.startsWith(`${componentName}-`) && file.endsWith(".js"))
    .sort();

  if (cssFiles.length === 0 || jsFiles.length === 0) {
    throw new Error(
      `Widget assets for "${componentName}" not found in ${ASSETS_DIR}. Run "pnpm run build" to generate the assets.`
    );
  }

  const cssFile = cssFiles[cssFiles.length - 1];
  const jsFile = jsFiles[jsFiles.length - 1];

  // GitHub Pages에서 리소스 참조
  const htmlContents = `<!doctype html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline' ${GITHUB_PAGES_BASE}; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${GITHUB_PAGES_BASE};" />
  <link rel="stylesheet" href="${GITHUB_PAGES_BASE}/${cssFile}" crossorigin="anonymous" />
</head>
<body>
  <div id="${componentName}-root"></div>
  <script type="module" src="${GITHUB_PAGES_BASE}/${jsFile}" crossorigin="anonymous"></script>
</body>
</html>
`;

  return htmlContents;
}

function widgetDescriptorMeta(widget: PizzazWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
    "openai/widgetPrefersBorder": true,
    "openai/widgetDomain": "https://chatgpt.com",
    "openai/widgetCSP": {
      connect_domains: ["https://wineny.github.io"],
      resource_domains: ["https://wineny.github.io"],
    },
    "openai/widgetDescription": `Interactive ${widget.title} widget with form validation and accessibility features`,
  } as const;
}

function widgetInvocationMeta(widget: PizzazWidget) {
  return {
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
  } as const;
}

const widgets: PizzazWidget[] = [
  // 현재는 portfolio-builder만 빌드되어 있음
  // 다른 위젯들은 주석 처리
  // {
  //   id: "pizza-map",
  //   title: "Show Pizza Map",
  //   templateUri: "ui://widget/pizza-map.html",
  //   invoking: "Hand-tossing a map",
  //   invoked: "Served a fresh map",
  //   html: readWidgetHtml("pizzaz"),
  //   responseText: "Rendered a pizza map!",
  // },
  // {
  //   id: "pizza-carousel",
  //   title: "Show Pizza Carousel",
  //   templateUri: "ui://widget/pizza-carousel.html",
  //   invoking: "Carousel some spots",
  //   invoked: "Served a fresh carousel",
  //   html: readWidgetHtml("pizzaz-carousel"),
  //   responseText: "Rendered a pizza carousel!",
  // },
  // {
  //   id: "pizza-albums",
  //   title: "Show Pizza Album",
  //   templateUri: "ui://widget/pizza-albums.html",
  //   invoking: "Hand-tossing an album",
  //   invoked: "Served a fresh album",
  //   html: readWidgetHtml("pizzaz-albums"),
  //   responseText: "Rendered a pizza album!",
  // },
  // {
  //   id: "pizza-list",
  //   title: "Show Pizza List",
  //   templateUri: "ui://widget/pizza-list.html",
  //   invoking: "Hand-tossing a list",
  //   invoked: "Served a fresh list",
  //   html: readWidgetHtml("pizzaz-list"),
  //   responseText: "Rendered a pizza list!",
  // },
  // {
  //   id: "pizza-shop",
  //   title: "Open Pizzaz Shop",
  //   templateUri: "ui://widget/pizza-shop.html",
  //   invoking: "Opening the shop",
  //   invoked: "Shop opened",
  //   html: readWidgetHtml("pizzaz-shop"),
  //   responseText: "Rendered the Pizzaz shop!",
  // },
  {
    id: "portfolio-builder",
    title: "Build Portfolio",
    templateUri: "ui://widget/portfolio-builder.html",
    invoking: "Creating your portfolio",
    invoked: "Portfolio builder ready",
    html: readWidgetHtml("portfolio-builder"),
    responseText: "Portfolio builder is ready! Please enter your name and company.",
  },
];

const widgetsById = new Map<string, PizzazWidget>();
const widgetsByUri = new Map<string, PizzazWidget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});

const toolInputSchema = {
  type: "object",
  properties: {
    pizzaTopping: {
      type: "string",
      description: "Topping to mention when rendering the widget.",
    },
  },
  required: ["pizzaTopping"],
  additionalProperties: false,
} as const;

const toolInputParser = z.object({
  pizzaTopping: z.string(),
});

// Portfolio builder 전용 스키마
const portfolioInputSchema = {
  type: "object",
  properties: {
    userName: {
      type: "string",
      description: "User's name for the portfolio",
    },
    companyName: {
      type: "string",
      description: "Company name or affiliation (optional)",
    },
  },
  required: [],
  additionalProperties: false,
} as const;

const portfolioInputParser = z.object({
  userName: z.string().optional(),
  companyName: z.string().optional(),
});

const tools: Tool[] = widgets.map((widget) => ({
  name: widget.id,
  description: widget.title,
  inputSchema: widget.id === "portfolio-builder" ? portfolioInputSchema : toolInputSchema,
  title: widget.title,
  _meta: widgetDescriptorMeta(widget),
  // To disable the approval prompt for the widgets
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
}));

const resources: Resource[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetDescriptorMeta(widget),
}));

const resourceTemplates: ResourceTemplate[] = widgets.map((widget) => ({
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetDescriptorMeta(widget),
}));

function createPizzazServer(): Server {
  const server = new Server(
    {
      name: "pizzaz-node",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources,
    })
  );

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const widget = widgetsByUri.get(request.params.uri);

      if (!widget) {
        throw new Error(`Unknown resource: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: widgetDescriptorMeta(widget),
          },
        ],
      };
    }
  );

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates,
    })
  );

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools,
    })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const widget = widgetsById.get(request.params.name);

      if (!widget) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      // portfolio-builder 전용 처리
      if (widget.id === "portfolio-builder") {
        const args = portfolioInputParser.parse(request.params.arguments ?? {});

        return {
          content: [
            {
              type: "text",
              text: widget.responseText,
            },
          ],
          structuredContent: {
            userName: args.userName || "",
            companyName: args.companyName || "",
          },
          _meta: widgetInvocationMeta(widget),
        };
      }

      // 기존 pizzaz 위젯 처리
      const args = toolInputParser.parse(request.params.arguments ?? {});

      return {
        content: [
          {
            type: "text",
            text: widget.responseText,
          },
        ],
        structuredContent: {
          pizzaTopping: args.pizzaTopping,
        },
        _meta: widgetInvocationMeta(widget),
      };
    }
  );

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createPizzazServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (
      req.method === "OPTIONS" &&
      (url.pathname === ssePath || url.pathname === postPath)
    ) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    res.writeHead(404).end("Not Found");
  }
);

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

httpServer.listen(port, () => {
  console.log(`Pizzaz MCP server listening on http://localhost:${port}`);
  console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
  console.log(
    `  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`
  );
});
