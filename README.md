# LegalJobs AI Assistant

## Project Overview

LegalJobs is an intelligent vertical SaaS platform designed for the legal industry. It combines a specialized job marketplace with an AI-powered legal research assistant and case management tool. The platform helps lawyers find relevant job opportunities and provides deep, evidence-based research capabilities for legal professionals.

---

## 🏛️ Key Features

### 1. Specialized Job Marketplace
- **Legal-First Matching:** Filters jobs specifically for lawyers, paralegals, and legal professionals.
- **Role-Based Filters:** Easily filter by specialization (e.g., Corporate Law, Litigation, IP).
- **Location & Salary Intelligence:** Advanced search with pay-range estimation.

### 2. AI Research Assistant
- **Case Law Extraction:** Extracts judgments and precedents from case documents.
- **Summarization & Analysis:** Generates concise summaries with key rulings and arguments.
- **Citation Verification:** Ensures the accuracy and relevance of legal precedents.

### 3. Case Management (Draft)
- **Case Document Indexing:** Upload and search across multiple case files.
- **Timeline Extraction:** Automatic generation of legal timelines.
- **Argument Tracking:** Organizes and retrieves arguments for specific cases.

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    User[Legal Professionals / Firms] --> Frontend[Next.js Frontend]
    Frontend --> API[FastAPI / LangChain Backend]
    
    subgraph "Core Services"
        API --> VectorStore[Vector Database (Qdrant)]
        API --> FileStore[Document Storage (MinIO/S3)]
        API --> KG[Graph Database (Neo4j)]
    end
    
    VectorStore --> RAG[RAG Pipeline]
    KG --> LegalGraph[Legal Knowledge Graph]
    
    RAG & LegalGraph --> LLM[LLM Inference Layer]
    LLM --> API
    
    Frontend -->|Jobs| JobService[Job Matching Engine]
    Frontend -->|Research| ResearchService[AI Research Engine]
    Frontend -->|Cases| CaseService[Case Management Engine]
```

---

## 🛠️ Technology Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** FastAPI (Python)
- **AI / ML:** LangChain, SentenceTransformers, PyPDF, NLTK
- **Databases:**
  - Qdrant (Vector Store for semantic search)
  - Neo4j (Knowledge Graph for legal relationships)
  - PostgreSQL (Metadata & User Data)
- **Infrastructure:** Docker, Docker Compose

---

## 🚀 Getting Started

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 18+

### 1. Clone the Repository
```bash
git clone <repository-url>
cd legal-jobs-agent
```

### 2. Start the Stack
Use the provided `docker-compose.yml` to launch all services:
```bash
docker compose up --build
```

### 3. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Vector Store (Qdrant):** http://localhost:6333
- **Graph DB (Neo4j):** http://localhost:7474

### 4. Running Backend Services Manually (Optional)
If you prefer to run services locally:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```
legal-jobs-agent/
├── backend/                    # FastAPI backend & AI logic
│   ├── app/
│   │   ├── api/                # API routes (jobs, research, cases)
│   │   ├── core/               # LangChain chains & RAG pipelines
│   │   ├── services/           # Business logic & LLM interactions
│   │   ├── models/             # Pydantic schemas
│   │   └── knowledge/          # Knowledge graph logic
│   ├── data/                   # Sample datasets & documents
│   └── vector_index/           # Vector embeddings & indices
├── frontend/                   # Next.js frontend
├── docs/                       # Technical documentation
├── migrations/                 # Database migrations
└── docker-compose.yml          # Docker orchestration
```

---

## 🎯 Roadmap

- [ ] **Phase 1 (MVP):** Complete Job Marketplace + Basic Research Assistant.
- [ ] **Phase 2:** Implement Legal Knowledge Graph & Advanced Case Management.
- [ ] **Phase 3:** Add specialized modules for Corporate Law, IP, and International Law.
- [ ] **Phase 4:** Mobile App development.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.