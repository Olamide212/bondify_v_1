# CloudFront CDN Setup for Bondify Assets

This guide will help you set up AWS CloudFront CDN to serve your S3 assets faster globally.

## Prerequisites

- AWS Account with appropriate permissions
- S3 bucket already configured
- Domain name (optional, but recommended for production)

## Step 1: Create CloudFront Distribution

### Option A: Using AWS Console (Recommended for beginners)

1. **Go to CloudFront Console**
   - Open [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
   - Click "Create Distribution"

2. **Configure Origin**
   - **Origin Domain**: Select your S3 bucket from the dropdown
   - **Origin Path**: Leave empty
   - **Name**: Keep default or customize
   - **Origin Access**: Select "Origin access control settings (recommended)"
     - Create new OAC or select existing
     - Check "Yes, update the bucket policy"

3. **Configure Default Cache Behavior**
   - **Viewer Protocol Policy**: "Redirect HTTP to HTTPS"
   - **Allowed HTTP Methods**: "GET, HEAD, OPTIONS"
   - **Cache Key and Origin Requests**:
     - **Cache policy**: "CachingOptimized"
     - **Origin request policy**: "CORS-S3Origin"

4. **Configure Additional Settings**
   - **Price Class**: Select based on your needs:
     - Use All Edge Locations (most expensive, best performance)
     - Use Only U.S., Canada and Europe
     - Use Only U.S., Canada, Europe & Asia
   - **Alternate Domain Names (CNAMEs)**: Add your custom domain if available
   - **SSL Certificate**: Use default or custom certificate

5. **Create Distribution**
   - Click "Create Distribution"
   - Wait for deployment (can take 10-15 minutes)

### Option B: Using AWS CLI

```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

Create `cloudfront-config.json`:

```json
{
  "CallerReference": "bondify-assets-$(date +%s)",
  "Comment": "Bondify Assets CDN",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "bondify-s3-origin",
        "DomainName": "YOUR_BUCKET_NAME.s3.amazonaws.com",
        "OriginAccessControlId": "YOUR_OAC_ID",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "bondify-s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "Comment": "Bondify Assets CDN",
  "PriceClass": "PriceClass_All",
  "Enabled": true
}
```

## Step 2: Update S3 Bucket Policy

If you didn't configure Origin Access Control automatically, update your S3 bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR_OAC_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

## Step 3: Configure Backend Environment

Add the CloudFront domain to your backend environment variables:

```bash
# In your .env file
AWS_CLOUDFRONT_DOMAIN=https://YOUR_DISTRIBUTION_ID.cloudfront.net
```

Example:
```bash
AWS_CLOUDFRONT_DOMAIN=https://d1234567890.cloudfront.net
```

## Step 4: Test the Setup

1. **Upload a test image** to your S3 bucket
2. **Access via CloudFront URL** and verify it loads
3. **Check response headers** for cache information:
   - `x-cache: Hit from cloudfront`
   - `x-amz-cf-pop: YOUR_EDGE_LOCATION`

## Step 5: Performance Optimization

### Cache Behaviors (Optional Advanced Setup)

Create additional cache behaviors for different asset types:

1. **Images**: Longer cache (1 year)
   - Path Pattern: `*.jpg`, `*.png`, `*.webp`, `*.gif`
   - Cache Policy: Custom policy with 1 year TTL

2. **Static Assets**: Medium cache (1 month)
   - Path Pattern: `*.css`, `*.js`, `*.woff2`
   - Cache Policy: Custom policy with 30 days TTL

### Compression

CloudFront automatically compresses content. Ensure your origin (S3) serves uncompressed content.

### Monitoring

Set up CloudFront monitoring:
- **CloudWatch Metrics**: Request count, error rates, data transfer
- **Access Logs**: Enable for detailed analytics
- **Real User Monitoring (RUM)**: For performance insights

## Benefits

- **Faster Global Delivery**: Assets served from edge locations closer to users
- **Reduced Latency**: Typically 100-200ms faster than direct S3
- **Cost Effective**: Can reduce S3 data transfer costs
- **Automatic Scaling**: Handles traffic spikes automatically
- **DDoS Protection**: Built-in protection against attacks

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check Origin Access Control and bucket policy
2. **404 Not Found**: Verify S3 object exists and permissions
3. **Slow Loading**: Check if CloudFront is actually being used (check headers)

### Useful Commands

```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Invalidate cache (force refresh)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

# List distributions
aws cloudfront list-distributions
```

## Cost Estimation

- **CloudFront**: ~$0.085 per GB data transfer
- **S3**: Reduced costs due to Origin Access Control
- **Total Savings**: Typically 20-50% reduction in data transfer costs

## Next Steps

1. Update your DNS to point to CloudFront (if using custom domain)
2. Set up monitoring and alerts
3. Consider implementing image optimization (WebP, responsive images)
4. Set up error pages and custom SSL certificates