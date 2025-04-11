# KrishiSaarthi - AgriTech Platform

KrishiSaarthi is a full-stack web platform that connects farmers, soil testing companies, seed providers, and market agents. Built with Next.js (App Router), PostgreSQL, Prisma ORM, and AWS S3.

## Features

- 🔐 User Registration & Role Management
- 👤 User Profiles
- 🌾 Crop Feeds (Farmer Community)
- 🧪 Soil Testing Requests & Reports
- 🌱 Crop Monitoring with AI
- 🛒 Market Module
- 🏷️ Bidding System
- ☁️ AWS S3 Integration for File Uploads

## Tech Stack

- Frontend: Next.js App Router + Tailwind CSS + ShadCN UI
- Backend: API Routes (Edge or Serverless)
- Database: PostgreSQL with Prisma ORM
- File Storage: AWS S3 + Pre-signed URLs
- Authentication: JWT + Role-based Access
- Charts: Recharts for crop price graphs
- Date Handling: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS S3 bucket

### Environment Setup

Create a `.env` file in the root directory with the following variables:

\`\`\`
DATABASE_URL="postgresql://username:password@localhost:5432/krishisaarthi"
JWT_SECRET="your-secret-key-here"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
\`\`\`

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Set up the database:
   \`\`\`
   npx prisma migrate dev
   npx prisma db seed
   \`\`\`
4. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

## Database Schema

The application uses Prisma ORM with the following models:
- User (with roles: FARMER, SOIL_TEST_COMPANY, SEED_PROVIDER, MARKET_AGENT, BUYER)
- CropFeed
- Comment
- SoilTestRequest
- SoilTestReport
- Feedback
- MarketPrice
- BiddingEntry
- Bid

## API Routes

The application provides RESTful API endpoints for:
- User authentication
- Crop feeds management
- Soil testing requests and reports
- Market price data
- Bidding system

## Deployment

The application can be deployed to Vercel:

\`\`\`
vercel
\`\`\`

## License

This project is licensed under the MIT License.
