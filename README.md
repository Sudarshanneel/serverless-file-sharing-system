# 🔐 Serverless File Sharing System

A secure, fully serverless file-sharing platform built on AWS that allows authenticated users to upload, manage, and securely share files using time-limited links — with no EC2 servers involved.

🌐 **Live Demo:** https://d7udchq0gfb1m.cloudfront.net

---

## 🚀 Features

- 🔑 Cognito-based authentication
  - User signup
  - Login
  - Email verification
- 📤 Secure file upload using S3 pre-signed URLs
- 📥 Secure file download using time-limited URLs
- 🔗 Time-limited and revocable share links
- 📊 Download tracking
- 📝 Per-file metadata management
- 🔒 Resource ownership validation
- ☁️ Fully serverless AWS architecture
- 🌐 HTTPS delivery through CloudFront

---

## 🏗️ Architecture

```text
                    ┌─────────────────┐
                    │      User       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   CloudFront    │
                    │  HTTPS Delivery │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   S3 Frontend   │
                    └─────────────────┘

                             │
                             ▼
                    ┌─────────────────┐
                    │ Amazon Cognito  │
                    │ Authentication  │
                    └────────┬────────┘
                             │ JWT
                             ▼
                    ┌─────────────────┐
                    │  API Gateway    │
                    │ JWT Authorizer  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ AWS Lambda      │
                    │ Functions       │
                    └───────┬─────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
        ┌─────────────────┐   ┌─────────────────┐
        │       S3        │   │    DynamoDB     │
        │   User Files    │   │ File Metadata   │
        └─────────────────┘   └─────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Authentication | Amazon Cognito |
| API | Amazon API Gateway |
| Compute | AWS Lambda |
| Runtime | Node.js 22.x |
| File Storage | Amazon S3 |
| Database | Amazon DynamoDB |
| CDN / HTTPS | Amazon CloudFront |
| Authorization | API Gateway JWT Authorizer |
| S3 Security | CloudFront Origin Access Control |

---

## 📁 Project Structure

```text
serverless-file-sharing-system/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── shared.html
│   ├── style.css
│   └── js/
│       ├── config.js
│       ├── auth.js
│       └── api.js
│
├── lambda/
│   ├── upload-file/
│   ├── list-files/
│   ├── download-file/
│   ├── delete-file/
│   ├── create-share-link/
│   ├── access-shared-file/
│   ├── revoke-share-link/
│   └── update-metadata/
│
├── .gitignore
└── README.md
```

---

## 🔒 Security Highlights

- Private S3 buckets with public access completely blocked
- Files are accessed using short-lived S3 pre-signed URLs
- CloudFront uses Origin Access Control for frontend delivery
- API Gateway uses JWT authorization
- File operations validate ownership using the Cognito JWT `sub` claim
- Share links use randomly generated UUIDs
- Share links have server-side expiration enforcement
- AWS credentials and environment secrets are excluded using `.gitignore`

---

## 📌 Application Capabilities

### Authentication
Users can:

- Create an account
- Verify their email
- Log in securely
- Access their personal dashboard

### File Management

Authenticated users can:

- Upload files
- View uploaded files
- Download files
- Delete files
- Update file metadata

### File Sharing

Users can:

- Generate shareable links
- Set link expiration
- Access shared files
- Revoke existing share links

---

## 📊 Current Status

### ✅ Completed

- User authentication
- File upload
- File listing
- File download
- File deletion
- File metadata management
- Share link creation
- Share link access
- Share link revocation
- HTTPS frontend delivery
- Serverless AWS deployment

### 🔜 Planned Improvements

- CloudWatch monitoring and logging
- Infrastructure as Code using Terraform
- CI/CD using GitHub Actions
- Automated testing
- Improved monitoring and alerting

---

## 💰 Cost Considerations

The application is designed to minimize AWS infrastructure costs during development by using serverless services such as:

- AWS Lambda
- Amazon DynamoDB
- Amazon S3
- Amazon CloudFront

No EC2 servers are required.

> AWS service pricing and free-tier eligibility can change, so verify current AWS pricing before production deployment.

---

## 🎯 Project Goal

The goal of this project is to demonstrate how a production-style file-sharing application can be designed using AWS serverless services while maintaining:

- Security
- Scalability
- Low infrastructure management
- HTTPS delivery
- Authentication and authorization
- Secure file sharing

---

## 👨‍💻 Author

**Sudarshan Neel**

---

⭐ If you find this project useful, consider giving it a star
