import { useEffect, useState } from 'react';
import './JobsList.css';

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
      <table className="jobs-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Company</th>
            <th>Location</th>
            <th>Practice Area</th>
            <th>Seniority</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="job-row">
              <td>{job.title}</td>
              <td>{job.company}</td>
              <td>{job.location}</td>
              <td>{job.practice_area}</td>
              <td>{job.seniority}</td>
              <td>{job.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
