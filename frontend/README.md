# ⚖️ LegalJobs Frontend Application

The frontend module of LegalJobs AI Assistant is a high-performance single-page web application built with **React**, **TypeScript**, and **Vite**. It features an interactive legal marketplace table view and an integrated **AI Job Search Copilot**.

---

## 🎨 Design System & Look and Feel

The interface incorporates the dark blue `#0d1b2a` to `#1b3a5c` gradient header, status badges, summary stat cards, and dark sticky header table design from `index.html`.

### Key Frontend Components:
- **`JobsList.tsx`**: Main dashboard component displaying live jobs from the FastAPI backend (`http://localhost:8002/jobs`). Includes search, dropdown filters for practice areas, seniority, locations, date ranges, and live synchronization with the AI Copilot.
- **`JobsList.css`**: Styling module containing table styles, badge pills, responsive stat cards, and the floating AI Copilot drawer.
- **`CandidateMatch.tsx`**: Candidate relevance scoring form interface.

---

## 🤖 AI Copilot Integration

The AI Copilot drawer is accessible via a floating action button at the bottom-right of the screen and a quick search bar in the header section.

### Features:
- **Live Search & Table Filtering**: Typing a natural query like *"Show active corporate law jobs in Chennai"* automatically sets filter parameters and re-renders the table view in real time.
- **Suggested Chips**: Quick filter chips for rapid interaction (*⚡ Corporate*, *🔥 Compliance*, *💼 Senior*, *🔄 Clear*).

---

## 🚀 Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The application will launch on **http://localhost:5173** (or http://localhost:3000).

### 3. Build for Production
```bash
npm run build
```

---

## 📂 Directory Structure

```
frontend/
├── src/
│   ├── assets/                 # Icons and imagery
│   ├── components/
│   │   ├── JobsList.tsx        # Dashboard table & AI Copilot drawer
│   │   ├── JobsList.css        # Dashboard and Copilot styling
│   │   └── CandidateMatch.tsx  # LLM scoring UI component
│   ├── App.tsx                 # Core application wrapper
│   ├── main.tsx                # React entry point
│   └── index.css               # Base global styles
├── public/                     # Static assets
└── package.json
```
