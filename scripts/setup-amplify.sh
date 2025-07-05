#!/bin/bash

# Script para configurar AWS Amplify para EmotioXV2 Frontend
# Este script automatiza la creación de la aplicación de Amplify

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All requirements met"
}

# Check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS credentials configured"
}

# Get user input
get_user_input() {
    print_status "Getting configuration details..."
    
    # App name
    read -p "Enter the Amplify app name (default: emotioxv2-frontend): " APP_NAME
    APP_NAME=${APP_NAME:-emotioxv2-frontend}
    
    # Repository URL
    read -p "Enter the GitHub repository URL: " REPOSITORY_URL
    if [ -z "$REPOSITORY_URL" ]; then
        print_error "Repository URL is required"
        exit 1
    fi
    
    # GitHub token
    read -s -p "Enter your GitHub personal access token: " GITHUB_TOKEN
    echo
    if [ -z "$GITHUB_TOKEN" ]; then
        print_error "GitHub token is required"
        exit 1
    fi
    
    # Branch name
    read -p "Enter the main branch name (default: main): " BRANCH_NAME
    BRANCH_NAME=${BRANCH_NAME:-main}
    
    # Environment
    read -p "Enter the environment name (default: production): " ENVIRONMENT
    ENVIRONMENT=${ENVIRONMENT:-production}
    
    # AWS Region
    read -p "Enter AWS region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    # Domain (optional)
    read -p "Enter custom domain (optional, press Enter to skip): " CUSTOM_DOMAIN
}

# Create Amplify app
create_amplify_app() {
    print_status "Creating Amplify application..."
    
    # Create the app
    APP_RESULT=$(aws amplify create-app \
        --name "$APP_NAME" \
        --repository "$REPOSITORY_URL" \
        --platform "WEB" \
        --environment-variables "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NODE_OPTIONS=--max-old-space-size=4096" \
        --enable-auto-branch-creation \
        --auto-branch-creation-config \
        "enableAutoBranch=true,enableBasicAuth=false,enablePerformanceMode=false,enablePullRequestPreview=true,environmentVariables={NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NODE_OPTIONS=--max-old-space-size=4096},framework=Next.js - SSG,pullRequestEnvironmentName=preview,stage=DEVELOPMENT" \
        --region "$AWS_REGION" \
        --output json)
    
    APP_ID=$(echo "$APP_RESULT" | jq -r '.app.appId')
    APP_ARN=$(echo "$APP_RESULT" | jq -r '.app.appArn')
    
    print_success "Amplify app created with ID: $APP_ID"
    
    # Store app ID for later use
    echo "AMPLIFY_APP_ID=$APP_ID" > .amplify-config
    echo "AMPLIFY_APP_ARN=$APP_ARN" >> .amplify-config
    echo "AWS_REGION=$AWS_REGION" >> .amplify-config
}

# Create branch
create_branch() {
    print_status "Creating branch: $BRANCH_NAME"
    
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --stage "$ENVIRONMENT" \
        --framework "Next.js - SSG" \
        --enable-auto-build \
        --environment-variables "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NODE_OPTIONS=--max-old-space-size=4096" \
        --region "$AWS_REGION" \
        --output json > /dev/null
    
    print_success "Branch '$BRANCH_NAME' created"
}

# Connect repository
connect_repository() {
    print_status "Connecting GitHub repository..."
    
    # Create access token
    aws amplify create-domain-association \
        --app-id "$APP_ID" \
        --domain-name "$CUSTOM_DOMAIN" \
        --region "$AWS_REGION" \
        --output json > /dev/null 2>&1 || true
    
    # Update app with OAuth token
    aws amplify update-app \
        --app-id "$APP_ID" \
        --oauth-token "$GITHUB_TOKEN" \
        --region "$AWS_REGION" \
        --output json > /dev/null
    
    print_success "Repository connected"
}

# Setup custom domain (if provided)
setup_custom_domain() {
    if [ -n "$CUSTOM_DOMAIN" ]; then
        print_status "Setting up custom domain: $CUSTOM_DOMAIN"
        
        aws amplify create-domain-association \
            --app-id "$APP_ID" \
            --domain-name "$CUSTOM_DOMAIN" \
            --sub-domain-settings \
            "prefix=,branchName=$BRANCH_NAME" \
            --region "$AWS_REGION" \
            --output json > /dev/null
        
        print_success "Custom domain configured"
        print_warning "Remember to update your DNS settings to point to the Amplify domain"
    fi
}

# Start initial deployment
start_deployment() {
    print_status "Starting initial deployment..."
    
    JOB_RESULT=$(aws amplify start-job \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --job-type "RELEASE" \
        --region "$AWS_REGION" \
        --output json)
    
    JOB_ID=$(echo "$JOB_RESULT" | jq -r '.jobSummary.jobId')
    
    print_success "Deployment started with Job ID: $JOB_ID"
    
    # Monitor deployment
    print_status "Monitoring deployment progress..."
    
    while true; do
        JOB_STATUS=$(aws amplify get-job \
            --app-id "$APP_ID" \
            --branch-name "$BRANCH_NAME" \
            --job-id "$JOB_ID" \
            --region "$AWS_REGION" \
            --query 'job.summary.status' \
            --output text)
        
        case $JOB_STATUS in
            "PENDING"|"PROVISIONING"|"RUNNING")
                print_status "Deployment in progress... Status: $JOB_STATUS"
                sleep 30
                ;;
            "SUCCEED")
                print_success "Deployment completed successfully!"
                break
                ;;
            "FAILED"|"CANCELLED")
                print_error "Deployment failed with status: $JOB_STATUS"
                exit 1
                ;;
            *)
                print_warning "Unknown status: $JOB_STATUS"
                sleep 30
                ;;
        esac
    done
}

# Print final information
print_final_info() {
    print_success "AWS Amplify setup completed!"
    echo
    echo "📱 Application Details:"
    echo "   App Name: $APP_NAME"
    echo "   App ID: $APP_ID"
    echo "   Branch: $BRANCH_NAME"
    echo "   Environment: $ENVIRONMENT"
    echo
    echo "🔗 URLs:"
    echo "   Amplify Console: https://console.aws.amazon.com/amplify/home?region=$AWS_REGION#/$APP_ID"
    echo "   App URL: https://$BRANCH_NAME.$APP_ID.amplifyapp.com"
    if [ -n "$CUSTOM_DOMAIN" ]; then
        echo "   Custom Domain: https://$CUSTOM_DOMAIN"
    fi
    echo
    echo "🔧 Next Steps:"
    echo "   1. Add these secrets to your GitHub repository:"
    echo "      - AWS_ACCESS_KEY_ID"
    echo "      - AWS_SECRET_ACCESS_KEY"
    echo "      - AMPLIFY_APP_ID=$APP_ID"
    echo
    echo "   2. Push your code to trigger the CI/CD pipeline"
    echo
    echo "   3. Monitor deployments in the Amplify Console"
    echo
    echo "✅ Your CI/CD pipeline is now ready!"
}

# Main execution
main() {
    echo "🚀 AWS Amplify Setup for EmotioXV2 Frontend"
    echo "=============================================="
    echo
    
    check_requirements
    check_aws_credentials
    get_user_input
    create_amplify_app
    create_branch
    connect_repository
    setup_custom_domain
    start_deployment
    print_final_info
}

# Run main function
main "$@"
