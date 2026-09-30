from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import os
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

# In‑memory stub store – replace with DB later
_FAKE_JOBS: List[Job] = []

def _populate_fake_jobs():
    if _FAKE_JOBS:
        return
    now = datetime.utcnow()
    for i in range(1, 51):
        job = Job(
            id=i,
            title=f"Legal Analyst {i}",
            company=f"LawCo {i%5}",
            location="Remote",
            posted_date=now - timedelta(days=i % 45),
            description="A great opportunity for legal professionals.",
            jurisdiction="US",
            practice_area="Corporate Law",
            seniority="Mid",
            employment_type="Full-time",
        )
        _FAKE_JOBS.append(job)

_populate_fake_jobs()

@app.get("/", response_model=dict)
def read_root():
    return {"message": "LCIA backend is running"}

@app.get("/jobs", response_model=List[Job])
def get_recent_jobs(days: int = 30):
    cutoff = datetime.utcnow() - timedelta(days=days)
    recent = [job for job in _FAKE_JOBS if job.posted_date >= cutoff]
    if not recent:
        raise HTTPException(status_code=404, detail="No jobs found for the given period")
    return recent

class MatchRequest(BaseModel):
    candidate: dict
    job_id: int

@app.post("/match", response_model=dict)
def match_candidate_job(request: MatchRequest):
    """Return an LLM‑generated relevance score for a candidate vs a job.
    The request body should contain a `candidate` dict and a `job_id` integer."""
    job = next((j for j in _FAKE_JOBS if j.id == request.job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result = match_job(request.candidate, job.dict())
    return {"score": result}
    # duplicate line removed

@app.get("/jobs/external", response_model=List[Job])
async def fetch_external_jobs(days: int = 30):
    """Fetch jobs from external free API (Arbeitnow) for the past *days*.
    The API does not provide posted_date, so we treat all results as recent.
    """
    import httpx
    url = os.getenv("ARBEITNOW_API_URL", "https://www.arbeitnow.com/api/job-board-api")
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("data", [])
    external_jobs: List[Job] = []
    now = datetime.utcnow()
    for i, item in enumerate(results, start=1000):
        job = Job(
            id=i,
            title=item.get("title", "Untitled"),
            company=item.get("company", "Unknown"),
            location=item.get("location", "Unknown"),
            posted_date=now,
            description=item.get("description", ""),
            jurisdiction=item.get("tags", ["US"])[0] if isinstance(item.get("tags"), list) else "US",
            practice_area="General",
            seniority="Mid",
            employment_type="Full-time",
        )
        external_jobs.append(job)
    cutoff = datetime.utcnow() - timedelta(days=days)
    combined = [job for job in _FAKE_JOBS + external_jobs if job.posted_date >= cutoff]
    if not combined:
        raise HTTPException(status_code=404, detail="No jobs found")
    return combined
