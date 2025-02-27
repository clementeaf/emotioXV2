const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

const ENVIRONMENTS = ['dev', 'test', 'prod'];

function validateEnvironment(env) {
  if (!ENVIRONMENTS.includes(env)) {
    console.error(`Error: Environment must be one of: ${ENVIRONMENTS.join(', ')}`);
    process.exit(1);
  }
}

function getAwsAccountId() {
  try {
    const result = execSync('aws sts get-caller-identity --query Account --output text', { encoding: 'utf-8' });
    return result.trim();
  } catch (error) {
    console.error('Error getting AWS account ID. Please ensure you are logged in to AWS CLI');
    process.exit(1);
  }
}

function setupAWSCredentials(env) {
  try {
    execSync(`aws configure get aws_access_key_id --profile ${env}`, { stdio: 'pipe' });
  } catch (error) {
    console.error(`AWS credentials not found for profile ${env}`);
    console.log('Please configure AWS credentials first:');
    console.log(`aws configure --profile ${env}`);
    process.exit(1);
  }
}

function getResourceConfig(env) {
  const isProd = env === 'prod';
  
  return {
    // Lambda configurations
    LAMBDA_MEMORY_SIZE: isProd ? '512' : '256',
    LAMBDA_TIMEOUT: isProd ? '30' : '15',
    
    // DynamoDB configurations
    DYNAMODB_BILLING_MODE: isProd ? 'PROVISIONED' : 'PAY_PER_REQUEST',
    DYNAMODB_READ_CAPACITY: '5',
    DYNAMODB_WRITE_CAPACITY: '5',
    
    // S3 configurations
    S3_VERSIONING: 'true',
    S3_LIFECYCLE_ENABLED: isProd ? 'true' : 'false',
    
    // General configurations
    PROJECT_NAME: 'emotiox-v2',
    NODE_ENV: isProd ? 'production' : 'development'
  };
}

function generateEnvFile(env) {
  const accountId = getAwsAccountId();
  const resourceConfig = getResourceConfig(env);
  
  const envConfig = {
    // AWS Configuration
    AWS_PROFILE: env,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCOUNT_ID: accountId,
    
    // Environment Configuration
    STAGE: env,
    NODE_ENV: resourceConfig.NODE_ENV,
    PROJECT_NAME: resourceConfig.PROJECT_NAME,
    
    // Resource Configuration
    ...resourceConfig,
    
    // API Configuration
    NEXT_PUBLIC_API_URL: `https://api.${env}.emotiox.com`
  };

  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Root .env
  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
  
  // Frontend .env
  fs.writeFileSync(path.join(process.cwd(), 'frontend', '.env'), 
    `NEXT_PUBLIC_API_URL=${envConfig.NEXT_PUBLIC_API_URL}\n`);
  
  // Backend .env
  const backendEnvContent = [
    `STAGE=${env}`,
    `AWS_PROFILE=${env}`,
    `AWS_REGION=${envConfig.AWS_REGION}`,
    `PROJECT_NAME=${resourceConfig.PROJECT_NAME}`,
    `LAMBDA_MEMORY_SIZE=${resourceConfig.LAMBDA_MEMORY_SIZE}`,
    `LAMBDA_TIMEOUT=${resourceConfig.LAMBDA_TIMEOUT}`,
    `DYNAMODB_BILLING_MODE=${resourceConfig.DYNAMODB_BILLING_MODE}`,
    isProd ? `DYNAMODB_READ_CAPACITY=${resourceConfig.DYNAMODB_READ_CAPACITY}` : '',
    isProd ? `DYNAMODB_WRITE_CAPACITY=${resourceConfig.DYNAMODB_WRITE_CAPACITY}` : ''
  ].filter(Boolean).join('\n');
  
  fs.writeFileSync(path.join(process.cwd(), 'backend', '.env'), backendEnvContent + '\n');
}

async function main() {
  const env = process.argv[2];
  validateEnvironment(env);
  
  console.log(`Setting up ${env} environment...`);
  
  // Validate AWS credentials
  setupAWSCredentials(env);
  
  // Generate environment files
  generateEnvFile(env);
  
  console.log('Environment setup completed successfully!');
  console.log(`Next steps:`);
  console.log(`1. Review the generated .env files`);
  console.log(`2. Run 'npm install' if you haven't already`);
  console.log(`3. Run 'npm run deploy:${env}' to deploy the application`);
}

main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
}); 