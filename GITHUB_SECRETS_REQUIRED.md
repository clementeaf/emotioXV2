# GitHub Secrets Required for Deploy Simple Workflow

## 🔐 REQUIRED SECRETS

Para que el workflow `deploy-simple.yml` funcione correctamente, necesitas configurar estos secrets en GitHub:

### **AWS Credentials (REQUIRED)**
```
AWS_ACCESS_KEY_ID          # AWS Access Key ID for deployment
AWS_SECRET_ACCESS_KEY      # AWS Secret Access Key for deployment
```

### **S3 Bucket Configuration (REQUIRED for Public Tests)**
```
PUBLIC_TESTS_S3_BUCKET               # S3 bucket name for public-tests (e.g., "emotioxv2-public-tests")
PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID  # CloudFront distribution ID for public-tests (e.g., "E1J2YXOVM8QFOG")
```

### **Frontend S3 Configuration (OPTIONAL)**
```
FRONTEND_S3_BUCKET         # S3 bucket name for frontend (optional - skip if using Amplify)
```

## 🛠️ How to Configure Secrets

1. **Go to your GitHub repository**
2. **Navigate to**: Settings → Secrets and variables → Actions
3. **Click**: "New repository secret"
4. **Add each secret** with the exact name and corresponding value

## 🧪 Testing the Workflow

After configuring the secrets:

1. **Manual Test**: Go to Actions → Deploy Simple (Fixed) → Run workflow
2. **Check logs** for any missing configuration
3. **Automatic Test**: Push any change to main branch

## 🎯 Current Workflow Features

✅ **Backend Deployment**: Serverless deploy to AWS Lambda  
✅ **Public Tests Deployment**: Build + deploy to S3 + CloudFront invalidation  
✅ **Frontend Deployment**: Optional S3 deployment (skip if using Amplify)  
✅ **Error Handling**: Comprehensive error checking and logging  
✅ **Dependency Management**: Proper cache configuration for faster builds  

## ⚠️ Troubleshooting

### If Backend Deploy Fails:
- Check AWS credentials
- Verify serverless.yml configuration
- Check IAM permissions for Lambda/API Gateway

### If Public Tests Deploy Fails:
- Verify S3 bucket exists and is accessible
- Check CloudFront distribution ID
- Ensure bucket policies allow deployment

### If Frontend Deploy Fails:
- Check if build output directory exists (out/ or .next/)
- Verify S3 bucket permissions
- This step is optional and won't break other deployments

## 📝 Notes

- **Frontend deployment is optional** - workflow continues even if it fails
- **All secrets are encrypted** in GitHub
- **Use least-privilege IAM policies** for security
- **Test with workflow_dispatch first** before relying on automatic triggers