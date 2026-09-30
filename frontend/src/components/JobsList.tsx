import { useEffect, useState } from 'react';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  posted_date: string;
  description: string;
  jurisdiction: string;
  practice_area: string;
  seniority: string;
  employment_type: string;
}

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`http://localhost:8002/jobs?days=${days}`);
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data: Job[] = await res.json();
        setJobs(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [days]);

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    setDays(Number(e.target.value));
  };

  if (loading) return <p>Loading jobs...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="jobs-section">
      <h2>Recent Legal Jobs</h2>
      <label>
        Show jobs from past&nbsp;
        <select value={days} onChange={handleDaysChange}>
          <option value={30}>30 days</option>
          <option value={45}>45 days</option>
          <option value={60}>60 days</option>
        </select>
      </label>
      <div className="job-cards">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <h3>{job.title} — {job.company}</h3>
            <p className="meta">{job.location} | {job.practice_area} | {job.seniority}</p>
            <p className="desc">{job.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  posted_date: string;
  description: string;
  jurisdiction: string;
  practice_area: string;
  seniority: string;
  employment_type: string;
}

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('http://localhost:8002/jobs');
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data: Job[] = await res.json();
        setJobs(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return <p>Loading jobs...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="jobs-section">
      <h2>Recent Legal Jobs</h2>
      <div className="job-cards">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <h3>{job.title} — {job.company}</h3>
            <p className="meta">{job.location} | {job.practice_area} | {job.seniority}</p>
            <p className="desc">{job.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
