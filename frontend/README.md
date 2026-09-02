# Serverless File Sharing System

A secure serverless file-sharing platform built entirely on AWS, allowing
authenticated users to upload, manage, and securely share files via
time-limited links — with no EC2 servers involved.

**Live demo:** https://d7udchq0gfb1m.cloudfront.net

## Features
- Cognito-based authentication (signup, login, email verification)
- Secure file upload/download via S3 pre-signed URLs
- Time-limited, revocable share links
- Download tracking and per-file metadata
- Fully serverless architecture

## Architecture

User → CloudFront (HTTPS) → S3 (frontend)
↓
Cognito (auth)
↓
API Gateway (JWT authorizer)
↓
Lambda functions
↓
┌───────┴───────┐
S3 (files) DynamoDB (metadata)



## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (vanilla, no framework)
- **Auth:** Amazon Cognito (User Pool)
- **API:** Amazon API Gateway (HTTP API, JWT authorizer)
- **Compute:** AWS Lambda (Node.js 22.x, 8 functions)
- **Storage:** Amazon S3 (separate buckets for frontend and user files)
- **Database:** Amazon DynamoDB (with GSIs for user and share-link lookups)
- **CDN/HTTPS:** Amazon CloudFront (Origin Access Control)

## Project Structure

serverless-file-sharing-system/
├── frontend/ # Static frontend (HTML/CSS/JS)
│ ├── index.html
│ ├── login.html
│ ├── signup.html
│ ├── dashboard.html
│ ├── shared.html
│ ├── style.css
│ └── js/
│ ├── config.js
│ ├── auth.js
│ └── api.js
├── lambda/ # Lambda function source code
│ ├── upload-file/
│ ├── list-files/
│ ├── download-file/
│ ├── delete-file/
│ ├── create-share-link/
│ ├── access-shared-file/
│ ├── revoke-share-link/
│ └── update-metadata/
└── README.md



## Security Highlights
- Private S3 buckets with public access fully blocked
- Files served only via short-lived pre-signed URLs
- CloudFront serves the frontend via Origin Access Control (no public bucket access)
- Every file operation checks resource ownership against the Cognito JWT `sub` claim
- Share links use random UUIDs with server-side expiry enforcement

## Status
Core application (auth, upload/download, sharing, HTTPS delivery) is complete
and deployed. Planned next: CloudWatch monitoring, Terraform IaC, CI/CD via
GitHub Actions, and automated testing.

## Cost Notes
Built to stay within AWS Always Free tier limits (Lambda, DynamoDB,
CloudFront, S3). No WAF or custom domain is currently attached to keep
recurring costs at $0 during development.

