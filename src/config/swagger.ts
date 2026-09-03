import { dirname, join } from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc, { type Options } from "swagger-jsdoc";

import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const routeGlobs: string[] = [join(__dirname, "../modules/**/*.js")];

const swaggerDefinition = {
  openapi: "3.0.0",

  info: {
    title: "AuthCore API",
    version: "1.0.0",
    description: "Centralized authentication and session management service",
  },

  servers: [
    {
      url: env.APP_URL,
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],
};

const swaggerOptions: Options = {
  definition: swaggerDefinition,
  apis: routeGlobs,
};

type SwaggerSpec = {
  paths?: Record<string, unknown>;
  [key: string]: unknown;
};

function prefixOpenApiPaths(spec: SwaggerSpec, prefix: string): SwaggerSpec {
  const normalized = prefix.replace(/\/$/, "");

  if (!normalized) {
    return spec;
  }

  const paths = spec.paths;

  if (!paths) {
    return spec;
  }

  const nextPaths: Record<string, unknown> = {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    const nextKey = pathKey.startsWith(normalized) ? pathKey : `${normalized}${pathKey}`;

    nextPaths[nextKey] = pathItem;
  }

  spec.paths = nextPaths;

  return spec;
}

export function buildSwaggerSpec(): SwaggerSpec {
  const spec = swaggerJsdoc(swaggerOptions) as SwaggerSpec;

  return prefixOpenApiPaths(spec, env.API_PREFIX);
}
