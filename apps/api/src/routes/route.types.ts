import { ZodType } from 'zod';

export interface RouteDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  controller: string;
  config: {
    description: string;
    middlewares?: string[];
    validation?: {
      body?: ZodType;
      params?: ZodType;
    };
    tags?: string[];
  };
}
