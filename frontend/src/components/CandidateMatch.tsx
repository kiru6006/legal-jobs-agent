import { useState } from 'react';

interface MatchResponse {
  score: number;
}

export default function CandidateMatch() {
  const [candidate, setCandidate] = useState('');
  const [jobId, setJobId] = useState('');
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        candidate: JSON.parse(candidate),
        job_id: Number(jobId),
      };
      const res = await fetch('http://localhost:8002/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Match request failed');
      const data = await res.json();
      setResult({ score: data.score });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="candidate-match">
      <h2>Candidate‑Job Fit Score</h2>
      <form onSubmit={handleSubmit} className="match-form">
        <label>
          Candidate JSON:
          <textarea
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            rows={6}
            placeholder='e.g. {"experience": "5 years", "skills": ["contract", "litigation"]}'
          />
        </label>
        <label>
          Job ID:
          <input
            type="number"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Enter job ID"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Scoring…' : 'Get Score'}
        </button>
      </form>
      {error && <p className="error">Error: {error}</p>}
      {result && <p className="score">Relevance score: {result.score.toFixed(1)} / 100</p>}
    </section>
  );
}
