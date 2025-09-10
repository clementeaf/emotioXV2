# GitHub Secrets Configuration for EmotioX v2

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings under **Settings → Secrets and variables → Actions**:

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_DEFAULT_REGION`: `us-east-1` (or your preferred region)

### Frontend Deployment
- `NEXT_PUBLIC_PUBLIC_TESTS_URL`: The CloudFront URL for public-tests (e.g., `https://d1234567890.cloudfront.net`)

### Public-Tests Deployment
- `PUBLIC_TESTS_S3_BUCKET`: S3 bucket name for public-tests
- `PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID for public-tests
- `VITE_API_BASE_URL`: `https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev`
- `VITE_PUBLIC_TESTS_URL`: Same as `NEXT_PUBLIC_PUBLIC_TESTS_URL`

## How to Get CloudFront URL

1. Go to AWS Console → CloudFront
2. Find your public-tests distribution
3. Copy the **Domain Name** (e.g., `d1234567890.cloudfront.net`)
4. Use `https://` + domain name as the URL

## Verification Steps

After setting up secrets:

1. **Test Frontend Deployment:**
   ```bash
   # Trigger workflow manually from GitHub Actions tab
   # Or push changes to frontend/
   ```

2. **Test Public-Tests Deployment:**
   ```bash
   # Trigger workflow manually from GitHub Actions tab
   # Or push changes to public-tests/
   ```

3. **Verify Communication:**
   - Open deployed frontend
   - Generate participant link
   - Link should open public-tests CloudFront URL, not localhost

## Current AWS Endpoints

- **API HTTP:** `https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev`
- **API WebSocket:** `wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev`
- **Frontend S3:** `http://emotioxv2-frontend-041238861016.s3-website-us-east-1.amazonaws.com`
- **Public-Tests CloudFront:** Configure as `NEXT_PUBLIC_PUBLIC_TESTS_URL`