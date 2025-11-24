# ChatPDF RAG Application

## 1. Overview

This repository contains a full-stack Next.js application designed to turn PDF documents into queryable knowledge bases. It implements a Retrieval-Augmented Generation (RAG) pipeline, allowing users to upload documents and interact with them via an AI chat interface.

The application features secure user authentication (Clerk), persistent storage (S3), vector indexing (Pinecone), and a comprehensive, authenticated REST API for external integration and programmatic document querying.

## 2. Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| *Framework* | Next.js (App Router) | Full-stack application structure and routing. |
| *Database* | PostgreSQL (Neon) | Primary data persistence (Drizzle ORM). |
| *Vector DB* | Pinecone | Semantic search and context retrieval for RAG. |
| *LLM/Embeddings* | Google Generative AI (Gemini) | AI response generation and text vectorization. |
| *Authentication* | Clerk | User session management and secure routing. |
| *Storage* | AWS S3 | Persistent storage for uploaded PDF files. |
| *ORM/Migrations* | Drizzle ORM, drizzle-kit | Type-safe database interaction and schema management. |

## 3. Project Structure

| Path | Role |
| :--- | :--- |
| src/app/chat/[chatId]/ | Core UI for PDF viewing and interactive chat. |
| src/app/api/chat/ | Internal streaming endpoint for RAG chat sessions. |
| src/app/api/v1/ | External, authenticated REST API endpoints (/query, /documents). |
| src/app/api-keys/ | User dashboard for managing API credentials. |
| src/lib/db/ | Database connection and schema definitions. |
| src/lib/context.ts | RAG core: Retrieves context chunks from Pinecone. |
| src/lib/pinecone.ts | Document ingestion, chunking, and vector upserting. |
| src/lib/api-middleware.ts | API key authentication, rate limiting, and usage logging. |
| src/components/ | Reusable UI components (e.g., FileUpload, APIDashboard). |
| drizzle.config.ts | Configuration for Drizzle CLI tooling. |

## 4. Key Components/Modules

### RAG & Data Ingestion
*   **src/lib/pinecone.ts**: Orchestrates the ingestion workflow: downloads PDF from S3, splits text into chunks, generates embeddings, and upserts vectors into the Pinecone index (chatpdf).
*   **src/lib/embeddings.ts**: Centralized utility using the Gemini API (text-embedding-004) to convert text into vector representations.
*   **src/lib/context.ts**: Executes the vector search against Pinecone based on a user query, retrieving the top 10 relevant text chunks and formatting them into a context string for the LLM.
*   **src/app/api/chat/route.ts**: Handles the primary chat logic, combining RAG context with conversation history and streaming the gemini-2.5-flash response.

### API Management & Security
*   **src/lib/api-key-utils.ts**: Handles secure credential generation, SHA256 hashing of secrets, and timing-safe secret verification.
*   **src/lib/api-middleware.ts**: Enforces API key authentication (X-API-Key, X-API-Secret), implements an in-memory rate limiter (100 req/hr), and logs all usage to the api_usage_logs table.
*   **src/app/api/v1/query/route.ts**: The public-facing endpoint for programmatic querying of uploaded documents.

## 5. Setup

1.  *Clone the repository:*
    bash
    git clone [repository-url]
    cd [repository-name]
    

2.  *Install dependencies:*
    bash
    npm install
    # or
    yarn install
    

3.  *Configure Environment:* Create a .env file based on the required variables (see Configuration section).

4.  *Database Setup (Drizzle):*
    The application uses Drizzle ORM. Ensure your DATABASE_URL is set, then run migrations:
    bash
    npx drizzle-kit push:pg
    

## 6. Usage

### Running the Application
Start the Next.js development server:
bash
npm run dev


### API Quickstart (External Query)
The primary external endpoint for querying your documents is POST /api/v1/query.

*Authentication:* Requires X-API-Key and X-API-Secret headers, which can be generated via the /api-keys dashboard.

*Example Request:*
bash
curl -X POST "http://localhost:3000/api/v1/query" \
-H "Content-Type: application/json" \
-H "X-API-Key: kg_..." \
-H "X-API-Secret: [Your_Secret]" \
-d '{
    "question": "What are the key findings in the document?",
    "chatId": "123"
}'


## 7. Configuration

| Name | Purpose | Required | Default |
| :--- | :--- | :--- | :--- |
| DATABASE_URL | PostgreSQL connection string (Neon). | Yes | - |
| GEMINI_API_KEY | Google AI API key for LLM and Embeddings. | Yes | - |
| PINECONE_API_KEY | Pinecone API key for vector database access. | Yes | - |
| NEXT_PUBLIC_S3_BUCKET_NAME | AWS S3 bucket name for file storage. | Yes | - |
| NEXT_PUBLIC_S3_ACCESS_KEY_ID | AWS Access Key ID. | Yes | - |
| NEXT_PUBLIC_S3_SECRET_ACCESS_KEY | AWS Secret Access Key. | Yes | - |
| CLERK_SECRET_KEY | Clerk backend secret key (implied). | Yes | - |

## 8. Data Model

The PostgreSQL database schema is defined in src/lib/db/schema.ts.

| Entity | Description | Key Fields | Relationships |
| :--- | :--- | :--- | :--- |
| *chats* | Metadata for uploaded documents/sessions. | id, userId, pdfName, fileKey, pdfUrl | One-to-many with messages. |
| *messages* | Individual entries in a conversation. | id, chatId, content, role (user_system_enum) | Linked to chats. |
| *api_keys* | User-generated credentials for external API access. | id, userId, apiKey, hashedSecret, isActive, rateLimit | One-to-many with api_usage_logs. |
| *api_usage_logs* | Audit trail for all API calls. | id, keyId, endpoint, method, statusCode, responseTime | Linked to api_keys. |

*Enum:* user_system_enum defines message roles as 'system' (assistant) or 'user'.

## 9. Testing

An integration test script is provided to verify the core API functionality (document listing and querying).

1.  Ensure the application is running (npm run dev).
2.  Ensure you have valid API_KEY and API_SECRET placeholders updated in test-api.js.
3.  Run the test script using Node:

bash
node test-api.js


The script will attempt to list documents and then execute a sample query against the first retrieved document ID.

## 10. Deployment

The application is built on Next.js and uses serverless-optimized database connections (@neondatabase/serverless).

*   *Serverless Compatibility:* The use of Neon and the neon-http driver ensures optimal performance in serverless environments (e.g., Vercel, AWS Lambda).
*   *S3 Configuration:* Ensure the S3 environment variables are correctly configured for the eu-north-1 region, as defined in src/lib/s3.ts.

## 11. Roadmap/Limitations

*   *Rate Limiting:* The current rate limiter in src/lib/api-middleware.ts is in-memory. For production scalability, it should be replaced with a persistent store (e.g., Redis).
*   *LLM Configuration:* The LLM prompt is highly engineered to enforce factual grounding and page number inclusion. Further prompt tuning may be required for complex documents.
*   *File Size:* The FileUpload component currently enforces a maximum PDF size of 10MB.
