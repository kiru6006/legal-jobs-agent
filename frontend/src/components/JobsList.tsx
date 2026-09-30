import { useEffect, useState } from 'react';
import './JobsList.css';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  posted_date: string;
  description: str;
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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) return <p className="loading-state">Loading live jobs from API...</p>;
  if (error) return <p className="error-state">Error: {error}</p>;

  return (
    <div className="jobs-section">
      <div className="jobs-header">
        <h2>Live Legal Jobs Marketplace</h2>
        <label>
          Show jobs from past&nbsp;
          <select value={days} onChange={handleDaysChange}>
            <option value={30}>30 days</option>
            <option value={45}>45 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </label>
      </div>

      <table className="jobs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Company</th>
            <th>Location</th>
            <th>Posted</th>
            <th>Practice Area</th>
            <th>Seniority</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="job-row">
              <td className="job-id">#{job.id}</td>
              <td className="job-title">{job.title}</td>
              <td className="job-company">{job.company}</td>
              <td>{job.location}</td>
              <td className="job-date">{formatDate(job.posted_date)}</td>
              <td><span className="badge practice-badge">{job.practice_area}</span></td>
              <td><span className="badge seniority-badge">{job.seniority}</span></td>
              <td className="job-desc">{job.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
