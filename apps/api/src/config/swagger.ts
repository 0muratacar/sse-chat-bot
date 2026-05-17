import { z } from 'zod';
import { RouteDefinition } from '../routes/route.types';
import { chatRoutes } from '../routes/chat.routes';
import { adminRoutes } from '../routes/admin.routes';
import { authRoutes } from '../routes/auth.routes';
import { userRoutes } from '../routes/user.routes';

function zodToOpenAPISchema(schema: any): object {
  try {
    const jsonSchema = z.toJSONSchema(schema);
    const { $schema, ...rest } = jsonSchema as any;
    return rest;
  } catch {
    return { type: 'object' };
  }
}

function buildPathParams(path: string): object[] {
  const params: object[] = [];
  const matches = path.matchAll(/:(\w+)/g);
  for (const match of matches) {
    params.push({
      in: 'path',
      name: match[1],
      required: true,
      schema: { type: 'string' },
    });
  }
  return params;
}

function buildOperation(route: RouteDefinition, prefix: string) {
  const operation: any = {
    summary: route.config.description,
    tags: route.config.tags || [],
    responses: {
      '200': { description: 'Success' },
    },
  };

  if (route.config.middlewares?.includes('auth') || route.config.middlewares?.includes('admin')) {
    operation.security = [{ bearerAuth: [], appCheck: [] }];
    operation.responses['401'] = { description: 'Unauthorized' };
  }

  if (route.config.middlewares?.includes('admin')) {
    operation.responses['403'] = { description: 'Admin access required' };
  }

  const parameters = buildPathParams(route.path);
  if (parameters.length > 0) {
    operation.parameters = parameters;
    operation.responses['404'] = { description: 'Not found' };
  }

  if (route.config.validation?.params) {
    const paramsSchema = zodToOpenAPISchema(route.config.validation.params);
    const props = (paramsSchema as any).properties || {};
    operation.parameters = Object.entries(props).map(([name, schema]) => ({
      in: 'path',
      name,
      required: true,
      schema,
    }));
  }

  if (route.config.validation?.body) {
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: zodToOpenAPISchema(route.config.validation.body),
        },
      },
    };
  }

  return operation;
}

function generateSpec() {
  const paths: Record<string, any> = {};

  const routeGroups = [
    { prefix: '/chats', routes: chatRoutes },
    { prefix: '/admin', routes: adminRoutes },
    { prefix: '/auth', routes: authRoutes },
    { prefix: '/users', routes: userRoutes },
  ];

  for (const group of routeGroups) {
    for (const route of group.routes) {
      const openAPIPath = (group.prefix + route.path)
        .replace(/:(\w+)/g, '{$1}')
        .replace(/\/$/, '') || '/';

      if (!paths[openAPIPath]) {
        paths[openAPIPath] = {};
      }

      paths[openAPIPath][route.method] = buildOperation(route, group.prefix);
    }
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'SSE Chat Bot API',
      version: '1.0.0',
      description: 'AI Chat System Backend with Feature Flagging and SSE Streaming',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        appCheck: { type: 'apiKey', in: 'header', name: 'X-Firebase-AppCheck' },
      },
    },
    paths,
  };
}

export const swaggerSpec = generateSpec();
