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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EmotioXV2 MCP Server running on stdio');
  }
}

const server = new EmotioXV2MCPServer();
server.run().catch(console.error);

