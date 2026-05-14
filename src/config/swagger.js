import { dirname, join } from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const routeGlobs = [join(__dirname, "../modules/**/*.js")];

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "AuthCore API",
    version: "1.0.0",
    description: "Centralized authentication and session management service",
  },
  servers: [{ url: env.APP_URL }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: routeGlobs,
};

function prefixOpenApiPaths(spec, prefix) {
  const normalized = prefix.replace(/\/$/, "");
  if (!normalized) {
    return spec;
  }

  const paths = spec.paths;
  if (!paths || typeof paths !== "object") {
    return spec;
  }

  const nextPaths = {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    const nextKey = pathKey.startsWith(normalized) ? pathKey : `${normalized}${pathKey}`;
    nextPaths[nextKey] = pathItem;
  }
  spec.paths = nextPaths;
  return spec;
}

export function buildSwaggerSpec() {
  const spec = swaggerJsdoc(swaggerOptions);
  return prefixOpenApiPaths(spec, env.API_PREFIX);
}
