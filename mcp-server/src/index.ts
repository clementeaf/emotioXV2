#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { execa, type ExecaError } from 'execa';
import { z } from 'zod';

/**
 * Servidor MCP para gestión de Git, GitHub Actions y Deployments
 */
class EmotioXV2MCPServer {
  private server: Server;
  private projectRoot: string;

  constructor() {
    this.server = new Server(
      {
        name: 'emotioxv2-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectRoot = process.cwd();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'git_status',
          description: 'Obtener el estado actual de git (archivos modificados, staged, etc.)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'git_commit',
          description: 'Hacer commit de cambios con un mensaje',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Mensaje del commit',
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Archivos específicos a commitear (opcional, si no se especifica se commitan todos los cambios)',
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'git_push',
          description: 'Subir cambios al repositorio remoto',
          inputSchema: {
            type: 'object',
            properties: {
              branch: {
                type: 'string',
                description: 'Rama a la que hacer push (por defecto: main)',
                default: 'main',
              },
            },
          },
        },
        {
          name: 'git_commit_and_push',
          description: 'Hacer commit y push en una sola operación',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Mensaje del commit',
              },
              branch: {
                type: 'string',
                description: 'Rama a la que hacer push (por defecto: main)',
                default: 'main',
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Archivos específicos a commitear (opcional)',
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'github_actions_list_runs',
          description: 'Listar los últimos runs de GitHub Actions',
          inputSchema: {
            type: 'object',
            properties: {
              workflow: {
                type: 'string',
                description: 'Nombre del workflow (opcional)',
              },
              limit: {
                type: 'number',
                description: 'Número máximo de runs a listar (por defecto: 10)',
                default: 10,
              },
            },
          },
        },
        {
          name: 'github_actions_view_run',
          description: 'Ver detalles de un run específico de GitHub Actions',
          inputSchema: {
            type: 'object',
            properties: {
              runId: {
                type: 'string',
                description: 'ID del run',
              },
            },
            required: ['runId'],
          },
        },
        {
          name: 'github_actions_view_logs',
          description: 'Ver logs de un run específico de GitHub Actions',
          inputSchema: {
            type: 'object',
            properties: {
              runId: {
                type: 'string',
                description: 'ID del run',
              },
            },
            required: ['runId'],
          },
        },
        {
          name: 'github_actions_list_workflows',
          description: 'Listar todos los workflows disponibles',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'deployment_status',
          description: 'Verificar el estado de los deployments (frontend, public-tests, research-links)',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'Servicio específico a verificar (frontend, public-tests, research-links) o "all" para todos',
                enum: ['frontend', 'public-tests', 'research-links', 'all'],
                default: 'all',
              },
            },
          },
        },
        {
          name: 'deployment_summary',
          description: 'Obtener un resumen completo del estado de deployments y GitHub Actions',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'check_deployment_sync',
          description: 'Verificar si los deployments de S3/CloudFront están sincronizados con los últimos cambios en git',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'Servicio específico a verificar (frontend, public-tests) o "all" para todos',
                enum: ['frontend', 'public-tests', 'all'],
                default: 'all',
              },
            },
          },
        },
        {
          name: 'verify_s3_cloudfront_status',
          description: 'Verificar el estado de S3/CloudFront y comparar con los últimos commits',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'Servicio específico a verificar (frontend, public-tests)',
                enum: ['frontend', 'public-tests'],
                required: true,
              },
            },
          },
        },
        {
          name: 'compare_commits_with_deployments',
          description: 'Comparar los últimos commits con los últimos deployments para verificar si están actualizados',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'Servicio específico a verificar (frontend, public-tests) o "all" para todos',
                enum: ['frontend', 'public-tests', 'all'],
                default: 'all',
              },
            },
          },
        },
        {
          name: 'dynamodb_list_tables',
          description: 'Listar todas las tablas de DynamoDB disponibles',
          inputSchema: {
            type: 'object',
            properties: {
              stage: {
                type: 'string',
                description: 'Stage a filtrar (dev, prod) o "all" para todos',
                enum: ['dev', 'prod', 'all'],
                default: 'all',
              },
            },
          },
        },
        {
          name: 'dynamodb_get_item',
          description: 'Obtener un item específico de una tabla de DynamoDB',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Nombre de la tabla',
              },
              key: {
                type: 'object',
                description: 'Clave del item (formato JSON)',
              },
            },
            required: ['tableName', 'key'],
          },
        },
        {
          name: 'dynamodb_put_item',
          description: 'Crear o actualizar un item en una tabla de DynamoDB',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Nombre de la tabla',
              },
              item: {
                type: 'object',
                description: 'Item a crear/actualizar (formato JSON)',
              },
            },
            required: ['tableName', 'item'],
          },
        },
        {
          name: 'dynamodb_query',
          description: 'Consultar una tabla de DynamoDB usando una clave o índice',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Nombre de la tabla',
              },
              keyConditionExpression: {
                type: 'string',
                description: 'Expresión de condición de clave (ej: "id = :id")',
              },
              expressionAttributeValues: {
                type: 'object',
                description: 'Valores de atributos para la expresión (formato JSON)',
              },
              indexName: {
                type: 'string',
                description: 'Nombre del índice a usar (opcional)',
              },
              limit: {
                type: 'number',
                description: 'Límite de resultados (por defecto: 100)',
                default: 100,
              },
            },
            required: ['tableName', 'keyConditionExpression', 'expressionAttributeValues'],
          },
        },
        {
          name: 'dynamodb_scan',
          description: 'Escanear una tabla de DynamoDB (obtener todos los items)',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Nombre de la tabla',
              },
              filterExpression: {
                type: 'string',
                description: 'Expresión de filtro (opcional, ej: "status = :status")',
              },
              expressionAttributeValues: {
                type: 'object',
                description: 'Valores de atributos para la expresión (formato JSON, opcional)',
              },
              limit: {
                type: 'number',
                description: 'Límite de resultados (por defecto: 100)',
                default: 100,
              },
            },
            required: ['tableName'],
          },
        },
        {
          name: 'dynamodb_delete_item',
          description: 'Eliminar un item de una tabla de DynamoDB',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Nombre de la tabla',
              },
              key: {
                type: 'object',
                description: 'Clave del item a eliminar (formato JSON)',
              },
            },
            required: ['tableName', 'key'],
          },
        },
        {
          name: 's3_list_buckets',
          description: 'Listar todos los buckets de S3 disponibles',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 's3_list_objects',
          description: 'Listar objetos en un bucket de S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
              prefix: {
                type: 'string',
                description: 'Prefijo para filtrar objetos (opcional)',
              },
              limit: {
                type: 'number',
                description: 'Límite de resultados (por defecto: 100)',
                default: 100,
              },
            },
            required: ['bucket'],
          },
        },
        {
          name: 's3_get_object',
          description: 'Obtener un objeto de S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
              key: {
                type: 'string',
                description: 'Clave del objeto',
              },
            },
            required: ['bucket', 'key'],
          },
        },
        {
          name: 's3_put_object',
          description: 'Subir un objeto a S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
              key: {
                type: 'string',
                description: 'Clave del objeto',
              },
              body: {
                type: 'string',
                description: 'Contenido del objeto',
              },
              contentType: {
                type: 'string',
                description: 'Tipo de contenido (opcional, ej: "application/json")',
              },
            },
            required: ['bucket', 'key', 'body'],
          },
        },
        {
          name: 's3_delete_object',
          description: 'Eliminar un objeto de S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
              key: {
                type: 'string',
                description: 'Clave del objeto',
              },
            },
            required: ['bucket', 'key'],
          },
        },
        {
          name: 's3_get_bucket_policy',
          description: 'Obtener la política de un bucket de S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
            },
            required: ['bucket'],
          },
        },
        {
          name: 's3_put_bucket_policy',
          description: 'Actualizar la política de un bucket de S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
              policy: {
                type: 'object',
                description: 'Política del bucket (formato JSON)',
              },
            },
            required: ['bucket', 'policy'],
          },
        },
        {
          name: 's3_get_bucket_cors',
          description: 'Obtener la configuración CORS de un bucket de S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
            },
            required: ['bucket'],
          },
        },
        {
          name: 's3_put_bucket_cors',
          description: 'Actualizar la configuración CORS de un bucket de S3',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: {
                type: 'string',
                description: 'Nombre del bucket',
              },
              corsConfig: {
                type: 'object',
                description: 'Configuración CORS (formato JSON)',
              },
            },
            required: ['bucket', 'corsConfig'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'git_status':
            return await this.gitStatus();
          case 'git_commit':
            return await this.gitCommit(args as { message: string; files?: string[] });
          case 'git_push':
            return await this.gitPush(args as { branch?: string });
          case 'git_commit_and_push':
            return await this.gitCommitAndPush(args as { message: string; branch?: string; files?: string[] });
          case 'github_actions_list_runs':
            return await this.githubActionsListRuns(args as { workflow?: string; limit?: number });
          case 'github_actions_view_run':
            return await this.githubActionsViewRun(args as { runId: string });
          case 'github_actions_view_logs':
            return await this.githubActionsViewLogs(args as { runId: string });
          case 'github_actions_list_workflows':
            return await this.githubActionsListWorkflows();
          case 'deployment_status':
            return await this.deploymentStatus(args as { service?: string });
          case 'deployment_summary':
            return await this.deploymentSummary();
          case 'check_deployment_sync':
            return await this.checkDeploymentSync(args as { service?: string });
          case 'verify_s3_cloudfront_status':
            return await this.verifyS3CloudFrontStatus(args as { service: string });
          case 'compare_commits_with_deployments':
            return await this.compareCommitsWithDeployments(args as { service?: string });
          case 'dynamodb_list_tables':
            return await this.dynamodbListTables(args as { stage?: string });
          case 'dynamodb_get_item':
            return await this.dynamodbGetItem(args as { tableName: string; key: Record<string, unknown> });
          case 'dynamodb_put_item':
            return await this.dynamodbPutItem(args as { tableName: string; item: Record<string, unknown> });
          case 'dynamodb_query':
            return await this.dynamodbQuery(args as { tableName: string; keyConditionExpression: string; expressionAttributeValues: Record<string, unknown>; indexName?: string; limit?: number });
          case 'dynamodb_scan':
            return await this.dynamodbScan(args as { tableName: string; filterExpression?: string; expressionAttributeValues?: Record<string, unknown>; limit?: number });
          case 'dynamodb_delete_item':
            return await this.dynamodbDeleteItem(args as { tableName: string; key: Record<string, unknown> });
          case 's3_list_buckets':
            return await this.s3ListBuckets();
          case 's3_list_objects':
            return await this.s3ListObjects(args as { bucket: string; prefix?: string; limit?: number });
          case 's3_get_object':
            return await this.s3GetObject(args as { bucket: string; key: string });
          case 's3_put_object':
            return await this.s3PutObject(args as { bucket: string; key: string; body: string; contentType?: string });
          case 's3_delete_object':
            return await this.s3DeleteObject(args as { bucket: string; key: string });
          case 's3_get_bucket_policy':
            return await this.s3GetBucketPolicy(args as { bucket: string });
          case 's3_put_bucket_policy':
            return await this.s3PutBucketPolicy(args as { bucket: string; policy: Record<string, unknown> });
          case 's3_get_bucket_cors':
            return await this.s3GetBucketCors(args as { bucket: string });
          case 's3_put_bucket_cors':
            return await this.s3PutBucketCors(args as { bucket: string; corsConfig: Record<string, unknown> });
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Herramienta desconocida: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error ejecutando ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async executeCommand(command: string, args: string[] = [], options: { cwd?: string } = {}): Promise<string> {
    try {
      const result = await execa(command, args, {
        cwd: options.cwd || this.projectRoot,
      });
      return result.stdout;
    } catch (error) {
      if (error instanceof Error && 'stdout' in error) {
        const execaError = error as ExecaError;
        throw new Error(`${execaError.message}\n${execaError.stdout}\n${execaError.stderr}`);
      }
      throw error;
    }
  }

  private async gitStatus(): Promise<{ content: Array<{ type: string; text: string }> }> {
    const status = await this.executeCommand('git', ['status', '--porcelain']);
    const branch = await this.executeCommand('git', ['branch', '--show-current']);
    const remote = await this.executeCommand('git', ['remote', 'get-url', 'origin']).catch(() => 'No remote');

    return {
      content: [
        {
          type: 'text',
          text: `📊 Estado de Git\n\n` +
            `🌿 Rama: ${branch.trim()}\n` +
            `🔗 Remote: ${remote.trim()}\n\n` +
            `📝 Archivos modificados:\n${status || 'No hay cambios'}`,
        },
      ],
    };
  }

  private async gitCommit(args: { message: string; files?: string[] }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { message, files } = args;

    if (files && files.length > 0) {
      await this.executeCommand('git', ['add', ...files]);
    } else {
      await this.executeCommand('git', ['add', '.']);
    }

    await this.executeCommand('git', ['commit', '-m', message]);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Commit realizado exitosamente\n\nMensaje: ${message}\n${files ? `Archivos: ${files.join(', ')}` : 'Todos los archivos modificados'}`,
        },
      ],
    };
  }

  private async gitPush(args: { branch?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const branch = args.branch || 'main';
    await this.executeCommand('git', ['push', 'origin', branch]);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Push realizado exitosamente a la rama: ${branch}`,
        },
      ],
    };
  }

  private async gitCommitAndPush(args: { message: string; branch?: string; files?: string[] }): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.gitCommit({ message: args.message, files: args.files });
    await this.gitPush({ branch: args.branch });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Commit y push realizados exitosamente\n\nMensaje: ${args.message}\nRama: ${args.branch || 'main'}`,
        },
      ],
    };
  }

  private async githubActionsListRuns(args: { workflow?: string; limit?: number }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const limit = args.limit || 10;
    const workflow = args.workflow;

    let command = ['gh', 'run', 'list', '--limit', limit.toString(), '--json', 'status,conclusion,displayTitle,createdAt,workflowName'];
    
    if (workflow) {
      command.push('--workflow', workflow);
    }

    const output = await this.executeCommand(command[0], command.slice(1));
    const runs = JSON.parse(output);

    const formatted = runs.map((run: any) => 
      `📋 ${run.workflowName}\n` +
      `   Estado: ${run.status} - ${run.conclusion || 'in_progress'}\n` +
      `   Título: ${run.displayTitle}\n` +
      `   Creado: ${new Date(run.createdAt).toLocaleString()}\n`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🚀 Últimos ${runs.length} runs de GitHub Actions\n\n${formatted}`,
        },
      ],
    };
  }

  private async githubActionsViewRun(args: { runId: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const output = await this.executeCommand('gh', ['run', 'view', args.runId, '--json', 'status,conclusion,displayTitle,createdAt,updatedAt,workflowName,headBranch,headSha']);
    const run = JSON.parse(output);

    return {
      content: [
        {
          type: 'text',
          text: `📊 Detalles del Run: ${args.runId}\n\n` +
            `Workflow: ${run.workflowName}\n` +
            `Estado: ${run.status} - ${run.conclusion || 'in_progress'}\n` +
            `Título: ${run.displayTitle}\n` +
            `Rama: ${run.headBranch}\n` +
            `Commit: ${run.headSha}\n` +
            `Creado: ${new Date(run.createdAt).toLocaleString()}\n` +
            `Actualizado: ${new Date(run.updatedAt).toLocaleString()}`,
        },
      ],
    };
  }

  private async githubActionsViewLogs(args: { runId: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const logs = await this.executeCommand('gh', ['run', 'view', args.runId, '--log']);

    return {
      content: [
        {
          type: 'text',
          text: `📋 Logs del Run: ${args.runId}\n\n${logs}`,
        },
      ],
    };
  }

  private async githubActionsListWorkflows(): Promise<{ content: Array<{ type: string; text: string }> }> {
    const output = await this.executeCommand('gh', ['workflow', 'list', '--json', 'name,state,id']);
    const workflows = JSON.parse(output);

    const formatted = workflows.map((wf: any) => 
      `📋 ${wf.name}\n` +
      `   ID: ${wf.id}\n` +
      `   Estado: ${wf.state}\n`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🔧 Workflows disponibles\n\n${formatted}`,
        },
      ],
    };
  }

  private async deploymentStatus(args: { service?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const service = args.service || 'all';
    const workflows = {
      frontend: 'deploy-frontend.yml',
      'public-tests': 'deploy-public-tests-s3.yml',
      'research-links': 'deploy-research-links-s3.yml',
    };

    const servicesToCheck = service === 'all' 
      ? Object.keys(workflows) 
      : [service];

    const results: string[] = [];

    for (const svc of servicesToCheck) {
      const workflow = workflows[svc as keyof typeof workflows];
      if (!workflow) continue;

      try {
        const output = await this.executeCommand('gh', [
          'run', 'list',
          '--workflow', workflow,
          '--limit', '1',
          '--json', 'status,conclusion,displayTitle,createdAt'
        ]);
        
        const runs = JSON.parse(output);
        if (runs.length > 0) {
          const run = runs[0];
          results.push(
            `📦 ${svc}\n` +
            `   Estado: ${run.status} - ${run.conclusion || 'in_progress'}\n` +
            `   Título: ${run.displayTitle}\n` +
            `   Último deploy: ${new Date(run.createdAt).toLocaleString()}\n`
          );
        } else {
          results.push(`📦 ${svc}\n   No hay runs disponibles\n`);
        }
      } catch (error) {
        results.push(`📦 ${svc}\n   Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `🚀 Estado de Deployments\n\n${results.join('\n')}`,
        },
      ],
    };
  }

  private async deploymentSummary(): Promise<{ content: Array<{ type: string; text: string }> }> {
    const gitStatus = await this.gitStatus();
    const workflows = await this.githubActionsListWorkflows();
    const deployments = await this.deploymentStatus({ service: 'all' });
    const recentRuns = await this.githubActionsListRuns({ limit: 5 });

    return {
      content: [
        {
          type: 'text',
          text: `📊 Resumen Completo\n\n` +
            `=== Git Status ===\n${gitStatus.content[0].text}\n\n` +
            `=== Workflows ===\n${workflows.content[0].text}\n\n` +
            `=== Deployments ===\n${deployments.content[0].text}\n\n` +
            `=== Últimos Runs ===\n${recentRuns.content[0].text}`,
        },
      ],
    };
  }

  private async checkDeploymentSync(args: { service?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const service = args.service || 'all';
    const services = service === 'all' ? ['frontend', 'public-tests'] : [service];
    
    const results: string[] = [];
    
    for (const svc of services) {
      try {
        // Obtener último commit
        const lastCommit = await this.executeCommand('git', ['log', '-1', '--format=%H|%s|%cd', '--date=iso']);
        const [commitHash, commitMessage, commitDate] = lastCommit.trim().split('|');
        
        // Obtener último run del workflow de deploy
        const workflowMap: Record<string, string> = {
          'frontend': 'deploy-frontend.yml',
          'public-tests': 'deploy-public-tests-s3.yml',
        };
        
        const workflow = workflowMap[svc];
        if (!workflow) continue;
        
        const runOutput = await this.executeCommand('gh', [
          'run', 'list',
          '--workflow', workflow,
          '--limit', '1',
          '--json', 'status,conclusion,displayTitle,createdAt,headSha,headBranch'
        ]);
        
        const runs = JSON.parse(runOutput);
        
        if (runs.length === 0) {
          results.push(`📦 ${svc}\n   ⚠️ No hay runs de deployment disponibles\n`);
          continue;
        }
        
        const lastRun = runs[0];
        const runCommitHash = lastRun.headSha;
        const runDate = new Date(lastRun.createdAt);
        const commitDateObj = new Date(commitDate);
        
        // Comparar commits
        const isUpToDate = runCommitHash === commitHash;
        const timeDiff = commitDateObj.getTime() - runDate.getTime();
        const hoursDiff = Math.abs(timeDiff) / (1000 * 60 * 60);
        
        let status = '';
        if (isUpToDate) {
          status = '✅ Actualizado';
        } else if (commitDateObj > runDate) {
          status = `⚠️ Desactualizado (${hoursDiff.toFixed(1)} horas de diferencia)`;
        } else {
          status = '✅ Deployment más reciente que el commit';
        }
        
        results.push(
          `📦 ${svc}\n` +
          `   Último commit: ${commitHash.substring(0, 7)} - ${commitMessage}\n` +
          `   Fecha commit: ${commitDateObj.toLocaleString()}\n` +
          `   Último deployment: ${runCommitHash.substring(0, 7)}\n` +
          `   Fecha deployment: ${runDate.toLocaleString()}\n` +
          `   Estado: ${status}\n` +
          `   Run: ${lastRun.status} - ${lastRun.conclusion || 'in_progress'}\n`
        );
      } catch (error) {
        results.push(`📦 ${svc}\n   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `🔄 Sincronización de Deployments\n\n${results.join('\n')}`,
        },
      ],
    };
  }

  private async verifyS3CloudFrontStatus(args: { service: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { service } = args;
    
    const config: Record<string, { bucket: string; workflow: string; secretKey: string }> = {
      'frontend': {
        bucket: 'emotioxv2-frontend-041238861016',
        workflow: 'deploy-frontend.yml',
        secretKey: 'FRONTEND_CLOUDFRONT_DISTRIBUTION_ID',
      },
      'public-tests': {
        bucket: 'emotioxv2-public-tests-041238861016',
        workflow: 'deploy-public-tests-s3.yml',
        secretKey: 'PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID',
      },
    };
    
    const svcConfig = config[service];
    if (!svcConfig) {
      throw new McpError(ErrorCode.InvalidParams, `Servicio desconocido: ${service}`);
    }
    
    const results: string[] = [];
    
    try {
      // Verificar último run
      const runOutput = await this.executeCommand('gh', [
        'run', 'list',
        '--workflow', svcConfig.workflow,
        '--limit', '1',
        '--json', 'status,conclusion,displayTitle,createdAt,headSha'
      ]);
      
      const runs = JSON.parse(runOutput);
      const lastRun = runs.length > 0 ? runs[0] : null;
      
      if (lastRun) {
        results.push(
          `📋 Último Run de Deployment\n` +
          `   Estado: ${lastRun.status} - ${lastRun.conclusion || 'in_progress'}\n` +
          `   Título: ${lastRun.displayTitle}\n` +
          `   Commit: ${lastRun.headSha.substring(0, 7)}\n` +
          `   Fecha: ${new Date(lastRun.createdAt).toLocaleString()}\n`
        );
      } else {
        results.push(`⚠️ No hay runs de deployment disponibles\n`);
      }
      
      // Verificar S3 (requiere AWS CLI)
      try {
        const s3Check = await this.executeCommand('aws', [
          's3', 'ls',
          `s3://${svcConfig.bucket}/index.html`,
          '--region', 'us-east-1'
        ]);
        
        results.push(`✅ S3: Archivo index.html encontrado en bucket ${svcConfig.bucket}\n`);
      } catch (error) {
        results.push(`⚠️ S3: No se pudo verificar (AWS CLI puede no estar configurado)\n`);
      }
      
      // Verificar CloudFront (requiere AWS CLI y secret)
      try {
        const secretOutput = await this.executeCommand('gh', [
          'secret', 'list',
          '--json', 'name'
        ]);
        
        const secrets = JSON.parse(secretOutput);
        const hasCloudFrontSecret = secrets.some((s: { name: string }) => s.name === svcConfig.secretKey);
        
        if (hasCloudFrontSecret) {
          results.push(`✅ CloudFront: Secret configurado (${svcConfig.secretKey})\n`);
        } else {
          results.push(`⚠️ CloudFront: Secret no configurado (${svcConfig.secretKey})\n`);
        }
      } catch (error) {
        results.push(`⚠️ CloudFront: No se pudo verificar secret\n`);
      }
      
    } catch (error) {
      results.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `🔍 Verificación de S3/CloudFront - ${service}\n\n${results.join('\n')}`,
        },
      ],
    };
  }

  private async compareCommitsWithDeployments(args: { service?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const service = args.service || 'all';
    const services = service === 'all' ? ['frontend', 'public-tests'] : [service];
    
    const results: string[] = [];
    
    // Obtener últimos 5 commits
    const commitsOutput = await this.executeCommand('git', [
      'log', '-5', '--format=%H|%s|%cd|%an',
      '--date=iso',
      '--pretty=format:%H|%s|%cd|%an'
    ]);
    
    const commits = commitsOutput.trim().split('\n').map(line => {
      const [hash, message, date, author] = line.split('|');
      return { hash, message, date, author };
    });
    
    for (const svc of services) {
      const workflowMap: Record<string, string> = {
        'frontend': 'deploy-frontend.yml',
        'public-tests': 'deploy-public-tests-s3.yml',
      };
      
      const workflow = workflowMap[svc];
      if (!workflow) continue;
      
      try {
        // Obtener últimos 5 runs
        const runOutput = await this.executeCommand('gh', [
          'run', 'list',
          '--workflow', workflow,
          '--limit', '5',
          '--json', 'status,conclusion,displayTitle,createdAt,headSha,headBranch'
        ]);
        
        const runs = JSON.parse(runOutput);
        
        // Comparar commits con deployments
        const deployedCommits = new Set(runs.map((r: any) => r.headSha));
        const pendingCommits = commits.filter(c => !deployedCommits.has(c.hash));
        
        results.push(
          `📦 ${svc}\n` +
          `   Total commits: ${commits.length}\n` +
          `   Total deployments: ${runs.length}\n` +
          `   Commits desplegados: ${commits.length - pendingCommits.length}\n` +
          `   Commits pendientes: ${pendingCommits.length}\n`
        );
        
        if (pendingCommits.length > 0) {
          results.push(`   ⚠️ Commits pendientes de deploy:\n`);
          pendingCommits.forEach(commit => {
            results.push(`      - ${commit.hash.substring(0, 7)}: ${commit.message}\n`);
          });
        } else {
          results.push(`   ✅ Todos los commits están desplegados\n`);
        }
        
        if (runs.length > 0) {
          const lastRun = runs[0];
          results.push(
            `   Último deployment: ${lastRun.headSha.substring(0, 7)} - ${lastRun.displayTitle}\n` +
            `   Estado: ${lastRun.status} - ${lastRun.conclusion || 'in_progress'}\n`
          );
        }
        
      } catch (error) {
        results.push(`📦 ${svc}\n   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `📊 Comparación de Commits con Deployments\n\n${results.join('\n')}`,
        },
      ],
    };
  }

  private async dynamodbListTables(args: { stage?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { stage = 'all' } = args;
    
    try {
      const output = await this.executeCommand('aws', [
        'dynamodb', 'list-tables',
        '--region', 'us-east-1',
        '--output', 'json'
      ]);
      
      const result = JSON.parse(output);
      let tables = result.TableNames || [];
      
      if (stage !== 'all') {
        tables = tables.filter((table: string) => table.includes(`-${stage}`));
      }
      
      const formatted = tables.map((table: string) => `  - ${table}`).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Tablas de DynamoDB${stage !== 'all' ? ` (stage: ${stage})` : ''}\n\n${formatted || 'No hay tablas disponibles'}\n\nTotal: ${tables.length}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error listando tablas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async dynamodbGetItem(args: { tableName: string; key: Record<string, unknown> }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { tableName, key } = args;
    
    try {
      const keyJson = JSON.stringify(this.convertToDynamoDBItem(key));
      const output = await this.executeCommand('aws', [
        'dynamodb', 'get-item',
        '--table-name', tableName,
        '--key', keyJson,
        '--region', 'us-east-1',
        '--output', 'json'
      ]);
      
      const result = JSON.parse(output);
      
      if (!result.Item) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Item no encontrado en la tabla ${tableName}`,
            },
          ],
        };
      }
      
      const item = this.convertDynamoDBItem(result.Item);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Item encontrado en ${tableName}\n\n${JSON.stringify(item, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error obteniendo item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async dynamodbPutItem(args: { tableName: string; item: Record<string, unknown> }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { tableName, item } = args;
    
    try {
      const dynamoItem = this.convertToDynamoDBItem(item);
      const itemJson = JSON.stringify(dynamoItem);
      
      await this.executeCommand('aws', [
        'dynamodb', 'put-item',
        '--table-name', tableName,
        '--item', itemJson,
        '--region', 'us-east-1'
      ]);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Item creado/actualizado en ${tableName}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error creando/actualizando item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async dynamodbQuery(args: { tableName: string; keyConditionExpression: string; expressionAttributeValues: Record<string, unknown>; indexName?: string; limit?: number }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { tableName, keyConditionExpression, expressionAttributeValues, indexName, limit = 100 } = args;
    
    try {
      const values = this.convertToDynamoDBItem(expressionAttributeValues);
      const valuesJson = JSON.stringify(values);
      
      const command = [
        'aws', 'dynamodb', 'query',
        '--table-name', tableName,
        '--key-condition-expression', keyConditionExpression,
        '--expression-attribute-values', valuesJson,
        '--limit', limit.toString(),
        '--region', 'us-east-1',
        '--output', 'json'
      ];
      
      if (indexName) {
        command.splice(3, 0, '--index-name', indexName);
      }
      
      const output = await this.executeCommand(command[0], command.slice(1));
      const result = JSON.parse(output);
      
      const items = (result.Items || []).map((item: Record<string, unknown>) => this.convertDynamoDBItem(item));
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Resultados de consulta en ${tableName}\n\nTotal: ${items.length}\n\n${JSON.stringify(items, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error consultando tabla: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async dynamodbScan(args: { tableName: string; filterExpression?: string; expressionAttributeValues?: Record<string, unknown>; limit?: number }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { tableName, filterExpression, expressionAttributeValues, limit = 100 } = args;
    
    try {
      const command = [
        'aws', 'dynamodb', 'scan',
        '--table-name', tableName,
        '--limit', limit.toString(),
        '--region', 'us-east-1',
        '--output', 'json'
      ];
      
      if (filterExpression && expressionAttributeValues) {
        const values = this.convertToDynamoDBItem(expressionAttributeValues);
        const valuesJson = JSON.stringify(values);
        command.push('--filter-expression', filterExpression);
        command.push('--expression-attribute-values', valuesJson);
      }
      
      const output = await this.executeCommand(command[0], command.slice(1));
      const result = JSON.parse(output);
      
      const items = (result.Items || []).map((item: Record<string, unknown>) => this.convertDynamoDBItem(item));
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Resultados de escaneo en ${tableName}\n\nTotal: ${items.length}\n\n${JSON.stringify(items, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error escaneando tabla: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async dynamodbDeleteItem(args: { tableName: string; key: Record<string, unknown> }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { tableName, key } = args;
    
    try {
      const keyJson = JSON.stringify(this.convertToDynamoDBItem(key));
      
      await this.executeCommand('aws', [
        'dynamodb', 'delete-item',
        '--table-name', tableName,
        '--key', keyJson,
        '--region', 'us-east-1'
      ]);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Item eliminado de ${tableName}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error eliminando item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3ListBuckets(): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const output = await this.executeCommand('aws', [
        's3api', 'list-buckets',
        '--region', 'us-east-1',
        '--output', 'json'
      ]);
      
      const result = JSON.parse(output);
      const buckets = (result.Buckets || []).map((bucket: { Name: string; CreationDate: string }) => 
        `  - ${bucket.Name} (creado: ${new Date(bucket.CreationDate).toLocaleString()})`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `🪣 Buckets de S3\n\n${buckets || 'No hay buckets disponibles'}\n\nTotal: ${result.Buckets?.length || 0}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error listando buckets: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3ListObjects(args: { bucket: string; prefix?: string; limit?: number }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket, prefix = '', limit = 100 } = args;
    
    try {
      const command = [
        'aws', 's3api', 'list-objects-v2',
        '--bucket', bucket,
        '--max-items', limit.toString(),
        '--region', 'us-east-1',
        '--output', 'json'
      ];
      
      if (prefix) {
        command.push('--prefix', prefix);
      }
      
      const output = await this.executeCommand(command[0], command.slice(1));
      const result = JSON.parse(output);
      
      const objects = (result.Contents || []).map((obj: { Key: string; Size: number; LastModified: string }) => 
        `  - ${obj.Key} (${obj.Size} bytes, modificado: ${new Date(obj.LastModified).toLocaleString()})`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📁 Objetos en ${bucket}${prefix ? ` (prefijo: ${prefix})` : ''}\n\n${objects || 'No hay objetos'}\n\nTotal: ${result.Contents?.length || 0}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error listando objetos: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3GetObject(args: { bucket: string; key: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket, key } = args;
    
    try {
      const fs = await import('fs/promises');
      const tempFile = `/tmp/s3-get-temp-${Date.now()}`;
      
      await this.executeCommand('aws', [
        's3api', 'get-object',
        '--bucket', bucket,
        '--key', key,
        '--region', 'us-east-1',
        tempFile
      ]);
      
      const content = await fs.readFile(tempFile, 'utf-8');
      await fs.unlink(tempFile);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Objeto obtenido de ${bucket}/${key}\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error obteniendo objeto: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3PutObject(args: { bucket: string; key: string; body: string; contentType?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket, key, body, contentType } = args;
    
    try {
      const fs = await import('fs/promises');
      const tempFile = `/tmp/s3-put-temp-${Date.now()}`;
      
      await fs.writeFile(tempFile, body, 'utf-8');
      
      const command = [
        'aws', 's3api', 'put-object',
        '--bucket', bucket,
        '--key', key,
        '--body', tempFile,
        '--region', 'us-east-1'
      ];
      
      if (contentType) {
        command.push('--content-type', contentType);
      }
      
      await this.executeCommand(command[0], command.slice(1));
      await fs.unlink(tempFile);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Objeto subido a ${bucket}/${key}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error subiendo objeto: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3DeleteObject(args: { bucket: string; key: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket, key } = args;
    
    try {
      await this.executeCommand('aws', [
        's3api', 'delete-object',
        '--bucket', bucket,
        '--key', key,
        '--region', 'us-east-1'
      ]);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Objeto eliminado de ${bucket}/${key}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error eliminando objeto: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3GetBucketPolicy(args: { bucket: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket } = args;
    
    try {
      const output = await this.executeCommand('aws', [
        's3api', 'get-bucket-policy',
        '--bucket', bucket,
        '--region', 'us-east-1',
        '--output', 'json'
      ]);
      
      const result = JSON.parse(output);
      const policy = typeof result.Policy === 'string' ? JSON.parse(result.Policy) : result.Policy;
      
      return {
        content: [
          {
            type: 'text',
            text: `📋 Política del bucket ${bucket}\n\n${JSON.stringify(policy, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('NoSuchBucketPolicy')) {
        return {
          content: [
            {
              type: 'text',
              text: `⚠️ El bucket ${bucket} no tiene política configurada`,
            },
          ],
        };
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error obteniendo política: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3PutBucketPolicy(args: { bucket: string; policy: Record<string, unknown> }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket, policy } = args;
    
    try {
      const fs = await import('fs/promises');
      const policyJson = JSON.stringify(policy);
      const tempFile = `/tmp/s3-policy-temp-${Date.now()}.json`;
      
      await fs.writeFile(tempFile, policyJson, 'utf-8');
      
      await this.executeCommand('aws', [
        's3api', 'put-bucket-policy',
        '--bucket', bucket,
        '--policy', `file://${tempFile}`,
        '--region', 'us-east-1'
      ]);
      
      await fs.unlink(tempFile);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Política actualizada para el bucket ${bucket}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error actualizando política: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3GetBucketCors(args: { bucket: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket } = args;
    
    try {
      const output = await this.executeCommand('aws', [
        's3api', 'get-bucket-cors',
        '--bucket', bucket,
        '--region', 'us-east-1',
        '--output', 'json'
      ]);
      
      return {
        content: [
          {
            type: 'text',
            text: `📋 Configuración CORS del bucket ${bucket}\n\n${JSON.stringify(JSON.parse(output), null, 2)}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('NoSuchCORSConfiguration')) {
        return {
          content: [
            {
              type: 'text',
              text: `⚠️ El bucket ${bucket} no tiene configuración CORS`,
            },
          ],
        };
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error obteniendo CORS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async s3PutBucketCors(args: { bucket: string; corsConfig: Record<string, unknown> }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { bucket, corsConfig } = args;
    
    try {
      const fs = await import('fs/promises');
      const configJson = JSON.stringify(corsConfig);
      const tempFile = `/tmp/s3-cors-temp-${Date.now()}.json`;
      
      await fs.writeFile(tempFile, configJson, 'utf-8');
      
      await this.executeCommand('aws', [
        's3api', 'put-bucket-cors',
        '--bucket', bucket,
        '--cors-configuration', `file://${tempFile}`,
        '--region', 'us-east-1'
      ]);
      
      await fs.unlink(tempFile);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Configuración CORS actualizada para el bucket ${bucket}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error actualizando CORS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private convertDynamoDBItem(item: Record<string, unknown>): Record<string, unknown> {
    const converted: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(item)) {
      if (value && typeof value === 'object' && 'S' in value) {
        converted[key] = (value as { S: string }).S;
      } else if (value && typeof value === 'object' && 'N' in value) {
        converted[key] = Number((value as { N: string }).N);
      } else if (value && typeof value === 'object' && 'BOOL' in value) {
        converted[key] = (value as { BOOL: boolean }).BOOL;
      } else if (value && typeof value === 'object' && 'L' in value) {
        converted[key] = ((value as { L: unknown[] }).L).map(item => this.convertDynamoDBItem({ item }).item);
      } else if (value && typeof value === 'object' && 'M' in value) {
        converted[key] = this.convertDynamoDBItem((value as { M: Record<string, unknown> }).M);
      } else if (value && typeof value === 'object' && 'SS' in value) {
        converted[key] = (value as { SS: string[] }).SS;
      } else if (value && typeof value === 'object' && 'NS' in value) {
        converted[key] = ((value as { NS: string[] }).NS).map(n => Number(n));
      } else {
        converted[key] = value;
      }
    }
    
    return converted;
  }

  private convertToDynamoDBItem(item: Record<string, unknown>): Record<string, unknown> {
    const converted: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        converted[key] = { S: value };
      } else if (typeof value === 'number') {
        converted[key] = { N: value.toString() };
      } else if (typeof value === 'boolean') {
        converted[key] = { BOOL: value };
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'string') {
          converted[key] = { SS: value as string[] };
        } else if (value.length > 0 && typeof value[0] === 'number') {
          converted[key] = { NS: (value as number[]).map(n => n.toString()) };
        } else {
          converted[key] = { L: value.map(item => this.convertToDynamoDBItem({ item }).item) };
        }
      } else if (value && typeof value === 'object') {
        converted[key] = { M: this.convertToDynamoDBItem(value as Record<string, unknown>) };
      } else {
        converted[key] = { S: String(value) };
      }
    }
    
    return converted;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EmotioXV2 MCP Server running on stdio');
  }
}

const server = new EmotioXV2MCPServer();
server.run().catch(console.error);

