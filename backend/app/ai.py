import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def match_job(candidate: dict, job: dict) -> float:
    """Generate a relevance score (0‑100) for a candidate against a job.
    The LLM is prompted with candidate and job details and asked to return only a numeric score.
    """
    prompt = (
        f"Match the candidate to the job and return a relevance score from 0 to 100.\n"
        f"Candidate details: {candidate}\n"
        f"Job details: {job}\n"
        "Provide only the numeric score."
    )
    response = model.generate_content(prompt)
    try:
        score_text = response.text.strip()
        filtered = ''.join(ch for ch in score_text if ch.isdigit() or ch == '.')
        score = float(filtered)
        return max(0.0, min(100.0, score))
    except Exception:
        return 0.0
