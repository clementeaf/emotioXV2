# Environment Variables Configuration

This directory contains the environment variables configuration system for the EmotioX frontend application.

## Overview

The environment configuration system provides:
- **Type Safety**: Full TypeScript support for all environment variables
- **Validation**: Runtime validation using Zod schemas
- **Default Values**: Safe defaults for development
- **Environment-Specific**: Different configurations for dev/staging/prod
- **React Integration**: Custom hooks for easy access in components

## Files Structure

```
src/config/
├── index.ts              # Main configuration export
├── env.ts                # Type definitions and constants
├── envValidator.ts        # Validation logic with Zod
├── env.development.ts    # Development environment defaults
├── env.staging.ts        # Staging environment defaults
├── env.production.ts     # Production environment defaults
└── README.md            # This documentation
```

## Environment Variables

### Core Configuration

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `NODE_ENV` | Environment mode | `development` | ✅ |
| `STAGE` | Deployment stage | `dev` | ✅ |
| `SERVICE_NAME` | Service identifier | `emotioxv2` | ✅ |
| `APP_REGION` | AWS region | `us-east-1` | ✅ |

### API Configuration

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `API_ENDPOINT` | Base API URL | `http://localhost:3000` | ✅ |
| `API_TIMEOUT` | Request timeout (ms) | `30000` | ❌ |
| `API_RETRIES` | Retry attempts | `3` | ❌ |

### Database Tables

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `USER_TABLE` | Users table name | `emotioxv2-users-dev` | ✅ |
| `PARTICIPANT_TABLE` | Participants table | `emotioxv2-participants-dev` | ✅ |
| `MODULE_RESPONSES_TABLE` | Module responses | `emotioxv2-module-responses-dev` | ✅ |
| `QUOTA_RECORDS_TABLE` | Quota records | `emotioxv2-quota-records-dev` | ✅ |
| `EDUCATIONAL_CONTENT_TABLE` | Educational content | `emotioxv2-educational-content-dev` | ✅ |

### IAT (Implicit Association Test) Tables

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `IAT_TEST_CONFIG_TABLE` | IAT test configurations | `emotioxv2-iat-test-configs-dev` | ✅ |
| `IAT_SESSION_TABLE` | IAT sessions | `emotioxv2-iat-sessions-dev` | ✅ |
| `IAT_RESULTS_TABLE` | IAT results | `emotioxv2-iat-results-dev` | ✅ |
| `IAT_ANALYSIS_TABLE` | IAT analysis | `emotioxv2-iat-analysis-dev` | ✅ |
| `IAT_INTEGRATION_TABLE` | IAT integration | `emotioxv2-iat-integration-dev` | ✅ |

### Eye Tracking Tables

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `EYE_TRACKING_SESSIONS_TABLE` | Eye tracking sessions | `emotioxv2-eye-tracking-sessions-dev` | ✅ |
| `EYE_TRACKING_ANALYSES_TABLE` | Eye tracking analyses | `emotioxv2-eye-tracking-analyses-dev` | ✅ |
| `IAT_EYE_TRACKING_CONFIGS_TABLE` | IAT eye tracking configs | `emotioxv2-iat-eye-tracking-configs-dev` | ✅ |
| `IAT_EYE_TRACKING_RESULTS_TABLE` | IAT eye tracking results | `emotioxv2-iat-eye-tracking-results-dev` | ✅ |

### Authentication

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `JWT_SECRET` | JWT signing secret | `mi-clave-secreta-para-firmar-tokens-dev-only` | ✅ |
| `TOKEN_EXPIRATION` | Token expiration (seconds) | `604800` | ❌ |
| `ALLOWED_ORIGIN` | CORS allowed origins | `http://localhost:11500,http://localhost:3000,http://localhost:4700` | ❌ |

### Storage

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `S3_BUCKET_NAME` | S3 bucket name | `emotioxv2-storage-dev` | ✅ |
| `MAX_FILE_SIZE` | Max file size (bytes) | `10485760` | ❌ |
| `ALLOWED_FILE_TYPES` | Allowed file types | `image/jpeg,image/png,image/gif,application/pdf` | ❌ |

### Email

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `EMAIL_FROM` | From email address | `noreply@emotiox.dev` | ✅ |
| `EMAIL_TO` | To email address | `admin@emotiox.dev` | ✅ |

### WebSocket

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `WEBSOCKET_ENDPOINT` | WebSocket URL | `ws://localhost:3001` | ✅ |
| `WEBSOCKET_API_ENDPOINT` | WebSocket API URL | `http://localhost:3001` | ✅ |

### Public Tests

| Variable | Description | Default (Dev) | Required |
|----------|-------------|---------------|----------|
| `PUBLIC_TESTS_URL` | Public tests URL | `http://localhost:4700` | ✅ |
| `PUBLIC_TESTS_ENABLED` | Enable public tests | `true` | ❌ |

## Usage

### Basic Usage

```typescript
import { env, getApiUrl, getTableName } from '../config';

// Access configuration
console.log(env.api.baseUrl);
console.log(env.database.tables.users);

// Use utility functions
const apiUrl = getApiUrl('/users');
const tableName = getTableName('users');
```

### React Hooks

```typescript
import { useEnvironment, useApiConfig, useDatabaseConfig } from '../hooks/useEnvironment';

function MyComponent() {
  const { isDevelopment, stage } = useEnvironment();
  const { baseUrl, timeout } = useApiConfig();
  const { tables } = useDatabaseConfig();

  return (
    <div>
      <p>Environment: {stage}</p>
      <p>API URL: {baseUrl}</p>
      <p>Users table: {tables.users}</p>
    </div>
  );
}
```

### API Service

```typescript
import { api } from '../services/apiService';

// Make API calls
const response = await api.get('/users');
const newUser = await api.post('/users', { name: 'John' });
```

## Environment Setup

### Development

For local development, the system uses safe defaults. No additional setup is required.

### Staging/Production

For staging and production environments, you must set the following variables:

```bash
# Required for production
JWT_SECRET=your-super-secure-jwt-secret-here
API_ENDPOINT=https://api.emotiox.com
S3_BUCKET_NAME=emotioxv2-storage-prod
EMAIL_FROM=noreply@emotiox.com
EMAIL_TO=admin@emotiox.com
```

### Docker/Container Deployment

```dockerfile
# Set environment variables in Docker
ENV NODE_ENV=production
ENV STAGE=prod
ENV JWT_SECRET=your-secret
ENV API_ENDPOINT=https://api.emotiox.com
```

### AWS Lambda/Serverless

```yaml
# serverless.yml
environment:
  NODE_ENV: production
  STAGE: ${self:provider.stage}
  JWT_SECRET: ${env:JWT_SECRET}
  API_ENDPOINT: ${self:custom.apiEndpoint}
```

## Validation

The system validates all environment variables at startup:

- **Type Validation**: Ensures correct data types
- **Format Validation**: Validates URLs, emails, etc.
- **Security Validation**: Checks JWT secret length
- **Required Fields**: Ensures all required variables are set

### Error Handling

```typescript
import { envValidator } from '../config/envValidator';

try {
  const config = envValidator.validate();
  console.log('Configuration loaded successfully');
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error('Validation errors:', error.errors);
  }
}
```

## Security Considerations

1. **Never commit secrets**: Use `.env` files or secure environment variable systems
2. **JWT Secret**: Must be at least 32 characters in production
3. **CORS Origins**: Restrict to specific domains in production
4. **File Uploads**: Validate file types and sizes
5. **API Endpoints**: Use HTTPS in production

## Troubleshooting

### Common Issues

1. **Missing Variables**: Check that all required variables are set
2. **Invalid URLs**: Ensure URLs are properly formatted
3. **Type Mismatches**: Check that numeric values are actually numbers
4. **CORS Issues**: Verify ALLOWED_ORIGIN includes your domain

### Debug Mode

In development, you can access the full configuration in the browser console:

```javascript
// Available in development only
window.__EMOTIOX_ENV__.config
window.__EMOTIOX_ENV__.envInfo
```

## Migration Guide

### From Old System

If migrating from an older environment variable system:

1. Update imports to use the new config system
2. Replace direct `process.env` access with typed config
3. Update environment variable names to match the new schema
4. Test in development before deploying

### Adding New Variables

1. Add the variable to `env.ts` types
2. Add validation rules to `envValidator.ts`
3. Add default values to environment-specific files
4. Update this documentation
5. Add tests for the new variable
