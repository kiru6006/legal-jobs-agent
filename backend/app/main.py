from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import os
import re
import httpx
from dotenv import load_dotenv

from .ai import match_job

load_dotenv()

app = FastAPI(title="Legal Career Intelligence Agent Backend")

# Allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Job(BaseModel):
    id: int
    title: str
    company: str
    location: str
    posted_date: datetime
    description: str
    jurisdiction: str
    practice_area: str
    seniority: str
    employment_type: str

# In-memory store for fetched real jobs
_JOB_STORE: List[Job] = []

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', raw_html)
    return ' '.join(cleantext.split())

def determine_practice_area(text: str) -> str:
    t = text.lower()
    if 'intellectual property' in t or 'patent' in t or 'trademark' in t or 'copyright' in t or 'ip ' in t:
        return 'Intellectual Property'
    elif 'compliance' in t or 'regulatory' in t or 'financial crime' in t or 'kyc' in t or 'aml' in t:
        return 'Compliance & Regulatory'
    elif 'privacy' in t or 'gdpr' in t or 'data protection' in t:
        return 'Data Privacy'
    elif 'litigation' in t or 'dispute' in t or 'court' in t or 'arbitration' in t:
        return 'Litigation'
    elif 'tax' in t:
        return 'Tax Law'
    elif 'employment' in t or 'labor' in t or 'hr' in t:
        return 'Employment Law'
    elif 'contract' in t or 'commercial' in t or 'corporate' in t or 'mergers' in t or 'm&a' in t:
        return 'Corporate & Commercial'
    else:
        return 'Legal & Corporate'

def determine_seniority(text: str) -> str:
    t = text.lower()
    if 'head' in t or 'director' in t or 'vp' in t or 'partner' in t or 'chief' in t or 'lead' in t:
        return 'Executive / Director'
    elif 'senior' in t or 'sr' in t or 'principal' in t:
        return 'Senior'
    elif 'junior' in t or 'associate' in t or 'intern' in t:
        return 'Junior / Associate'
    else:
        return 'Mid-Senior'

def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

async def fetch_real_external_jobs() -> List[Job]:
    global _JOB_STORE
    real_jobs: List[Job] = []
    job_id = 1
    now = datetime.now(timezone.utc)
    
    async with httpx.AsyncClient(timeout=10.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
        # Source 1: Arbeitnow API
        try:
            url = os.getenv("ARBEITNOW_API_URL", "https://www.arbeitnow.com/api/job-board-api")
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for item in data:
                    tags = item.get("tags", [])
                    tag_str = ", ".join(tags) if isinstance(tags, list) else ""
                    desc = clean_html(item.get("description", ""))
                    title = item.get("title", "Legal & Business Position")
                    combined = f"{title} {tag_str} {desc[:200]}"
                    
                    created_at = item.get("created_at")
                    if created_at:
                        posted_date = datetime.fromtimestamp(created_at, timezone.utc)
                    else:
                        posted_date = now - timedelta(days=(job_id % 30))
                        
                    jurisdiction = tags[0] if (isinstance(tags, list) and len(tags) > 0) else "US / Global"
                    
                    job = Job(
                        id=job_id,
                        title=title,
                        company=item.get("company_name") or item.get("company") or "Global Firm",
                        location=item.get("location") or ("Remote" if item.get("remote") else "On-site"),
                        posted_date=ensure_utc(posted_date),
                        description=desc[:250] + ("..." if len(desc) > 250 else ""),
                        jurisdiction=jurisdiction,
                        practice_area=determine_practice_area(combined),
                        seniority=determine_seniority(title),
                        employment_type=item.get("job_types", ["Full-time"])[0] if isinstance(item.get("job_types"), list) and item.get("job_types") else "Full-time"
                    )
                    real_jobs.append(job)
                    job_id += 1
        except Exception as e:
            print("Error fetching Arbeitnow jobs:", e)
            
        # Source 2: Remotive API
        try:
            resp = await client.get("https://remotive.com/api/remote-jobs")
            if resp.status_code == 200:
                data = resp.json().get("jobs", [])
                for item in data:
                    desc = clean_html(item.get("description", ""))
                    title = item.get("title", "Legal Counsel")
                    pub_date_str = item.get("publication_date")
                    if pub_date_str:
                        try:
                            posted_date = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                        except Exception:
                            posted_date = now
                    else:
                        posted_date = now
                        
                    category = item.get("category", "Legal & Compliance")
                    
                    job = Job(
                        id=job_id,
                        title=title,
                        company=item.get("company_name", "Global Enterprise"),
                        location=item.get("candidate_required_location", "Remote"),
                        posted_date=ensure_utc(posted_date),
                        description=desc[:250] + ("..." if len(desc) > 250 else ""),
                        jurisdiction="US / Global",
                        practice_area=determine_practice_area(f"{title} {category} {desc[:200]}"),
                        seniority=determine_seniority(title),
                        employment_type=item.get("job_type", "Full-time") or "Full-time"
                    )
                    real_jobs.append(job)
                    job_id += 1
        except Exception as e:
            print("Error fetching Remotive jobs:", e)

    if real_jobs:
        # Prioritize legal / compliance / corporate positions first
        legal_terms = ['legal', 'counsel', 'paralegal', 'attorney', 'lawyer', 'compliance', 'contracts', 'privacy', 'regulatory', 'policy', 'director', 'analyst']
        legal_jobs = [j for j in real_jobs if any(k in j.title.lower() or k in j.practice_area.lower() for k in legal_terms)]
        other_jobs = [j for j in real_jobs if j not in legal_jobs]
        sorted_jobs = legal_jobs + other_jobs
        
        for idx, j in enumerate(sorted_jobs, start=1):
            j.id = idx
        _JOB_STORE = sorted_jobs
    elif not _JOB_STORE:
        _populate_fallback_jobs()
        
    return _JOB_STORE

def _populate_fallback_jobs():
    global _JOB_STORE
    now = datetime.now(timezone.utc)
    _JOB_STORE = [
        Job(id=1, title="Senior Corporate Counsel", company="Apex Global Legal", location="New York, NY (Hybrid)", posted_date=now - timedelta(days=2), description="Lead M&A transactions, corporate governance, and key commercial negotiations for global tech enterprise.", jurisdiction="US - New York", practice_area="Corporate & Commercial", seniority="Senior", employment_type="Full-time"),
        Job(id=2, title="Data Privacy & GDPR Specialist", company="Lexis Regulatory Solutions", location="Remote", posted_date=now - timedelta(days=5), description="Advise cross-functional product and engineering teams on global data privacy regulations and AI compliance frameworks.", jurisdiction="EU / US", practice_area="Data Privacy", seniority="Mid-Senior", employment_type="Full-time"),
        Job(id=3, title="Intellectual Property Attorney", company="Innovate IP Law Group", location="San Francisco, CA", posted_date=now - timedelta(days=8), description="Manage patent portfolio strategy, trademark enforcement, and IP litigation support for biotech startups.", jurisdiction="US - California", practice_area="Intellectual Property", seniority="Senior", employment_type="Full-time"),
        Job(id=4, title="Financial Crime & AML Compliance Manager", company="FinTech Standard Bank", location="London, UK (Hybrid)", posted_date=now - timedelta(days=12), description="Supervise KYC, Anti-Money Laundering regulatory audits, and financial crime compliance policies.", jurisdiction="UK / EU", practice_area="Compliance & Regulatory", seniority="Executive / Director", employment_type="Full-time"),
        Job(id=5, title="Commercial Contracts Paralegal", company="Vanguard Logistics Corp", location="Chicago, IL", posted_date=now - timedelta(days=15), description="Draft, review, and organize vendor agreements, NDAs, and corporate service contracts.", jurisdiction="US - Illinois", practice_area="Corporate & Commercial", seniority="Junior / Associate", employment_type="Full-time"),
    ]

@app.get("/", response_model=dict)
def read_root():
    return {"message": "LCIA backend is running with live job feed"}

@app.get("/jobs", response_model=List[Job])
async def get_recent_jobs(days: int = 30):
    jobs = await fetch_real_external_jobs()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent = [job for job in jobs if ensure_utc(job.posted_date) >= cutoff]
    if not recent:
        return jobs[:50]  # Return active jobs if cutoff date filter is too restrictive
    return recent

@app.get("/jobs/external", response_model=List[Job])
async def get_external_jobs(days: int = 30):
    return await get_recent_jobs(days=days)

class MatchRequest(BaseModel):
    candidate: dict
    job_id: int

@app.post("/match", response_model=dict)
async def match_candidate_job(request: MatchRequest):
    """Return an LLM-generated relevance score for a candidate vs a job."""
    if not _JOB_STORE:
        await fetch_real_external_jobs()
    job = next((j for j in _JOB_STORE if j.id == request.job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result = match_job(request.candidate, job.dict())
    return {"score": result}
