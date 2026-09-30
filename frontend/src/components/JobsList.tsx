import { useEffect, useState, useMemo } from 'react';
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
  priority?: string;
  score?: number;
  open_position?: string;
  apply_url?: string;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [days, setDays] = useState<number>(60);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [practiceArea, setPracticeArea] = useState<string>('');
  const [seniorityFilter, setSeniorityFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // AI Copilot state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [quickInput, setQuickInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "👋 Hi! I am your **Legal AI Copilot**. Type any search query or requirement, and I will automatically filter the table view, summarize top matches, and suggest target firms!"
    }
  ]);

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

  // Compute filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${job.title} ${job.company} ${job.location} ${job.practice_area} ${job.description} ${job.jurisdiction}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (practiceArea && job.practice_area !== practiceArea) return false;
      if (seniorityFilter && job.seniority !== seniorityFilter) return false;
      if (locationFilter && !job.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      return true;
    });
  }, [jobs, search, practiceArea, seniorityFilter, locationFilter]);

  // Handle AI Copilot Natural Language Filter
  const processCopilotQuery = (query: string) => {
    if (!query.trim()) return;
    const lower = query.toLowerCase();

    // Add user prompt message
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);

    // Check for clear/reset
    if (lower.includes('clear') || lower.includes('reset') || lower.includes('all')) {
      setSearch('');
      setPracticeArea('');
      setSeniorityFilter('');
      setLocationFilter('');
      setPriorityFilter('');
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: `🤖 **Cleared all filters!** Displaying all **${jobs.length}** legal targets in the table view.` }
      ]);
      return;
    }

    // Extract intents
    let newSearch = '';
    let newLocation = '';
    let newSeniority = '';
    let newPractice = '';

    // Locations
    const cities = ['chennai', 'coimbatore', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'berlin', 'frankfurt', 'remote'];
    for (const c of cities) {
      if (lower.includes(c)) {
        newLocation = c;
        break;
      }
    }

    // Seniority
    if (lower.includes('senior')) newSeniority = 'Senior';
    else if (lower.includes('director') || lower.includes('executive')) newSeniority = 'Executive / Director';
    else if (lower.includes('junior') || lower.includes('associate')) newSeniority = 'Junior / Associate';
    else if (lower.includes('mid')) newSeniority = 'Mid-Senior';

    // Keywords / Practice Areas
    if (lower.includes('corporate') || lower.includes('commercial')) newPractice = 'Corporate & Commercial';
    else if (lower.includes('compliance') || lower.includes('regulatory')) newPractice = 'Compliance & Regulatory';
    else if (lower.includes('ip') || lower.includes('intellectual property')) newPractice = 'Intellectual Property';
    else if (lower.includes('privacy') || lower.includes('gdpr')) newPractice = 'Data Privacy';

    const terms = ['contract', 'legal', 'counsel', 'paralegal', 'attorney', 'engineer', 'manager', 'm&a', 'bank'];
    const matchedTerms = terms.filter((t) => lower.includes(t));

    if (matchedTerms.length > 0) {
      newSearch = matchedTerms.join(' ');
    } else if (!newLocation && !newSeniority && !newPractice) {
      newSearch = query;
    }

    // Apply UI state updates
    if (newSearch) setSearch(newSearch);
    if (newLocation) setLocationFilter(newLocation);
    if (newSeniority) setSeniorityFilter(newSeniority);
    if (newPractice) setPracticeArea(newPractice);

    // Filter computation simulation for response
    setTimeout(() => {
      const matchCount = jobs.filter((j) => {
        const h = `${j.title} ${j.company} ${j.location} ${j.practice_area} ${j.description}`.toLowerCase();
        if (newSearch && !h.includes(newSearch.toLowerCase())) return false;
        if (newLocation && !j.location.toLowerCase().includes(newLocation.toLowerCase())) return false;
        if (newSeniority && j.seniority !== newSeniority) return false;
        if (newPractice && j.practice_area !== newPractice) return false;
        return true;
      }).length;

      let reply = `🤖 **Filter Applied:** Table view updated to show **${matchCount} matching targets**.`;
      if (matchCount > 0) {
        reply += `\n\n💡 **Tip:** Use the table links to view full role specs or submit your candidate application score!`;
      } else {
        reply += `\n\n⚠️ No exact matches found for that query. Click **Clear All** to reset filters.`;
      }
      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
    }, 100);
  };

  const handleClearFilters = () => {
    setSearch('');
    setPracticeArea('');
    setSeniorityFilter('');
    setLocationFilter('');
    setPriorityFilter('');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) return <p className="loading-state">Loading live legal job marketplace...</p>;
  if (error) return <p className="error-state">Error: {error}</p>;

  // Practice area options
  const practiceAreas = Array.from(new Set(jobs.map((j) => j.practice_area))).filter(Boolean);

  return (
    <div className="legal-hub-container">
      {/* Header */}
      <header className="hub-header">
        <div>
          <h1>⚖️ India In-House Legal Career Hub</h1>
          <p>LLB / LLM • Bar Council Advocate • Pan-India Legal Intelligence • Real-Time Job Feed</p>
        </div>
        <div className="hdr-right">
          <span className="badge bb">{filteredJobs.length} Positions</span>
          <span className="badge br">High Priority</span>
          <span className="badge bg">Active Openings</span>
          <span className="badge bo">Legal Intelligence</span>
        </div>
      </header>

      {/* AI Copilot Quick Bar */}
      <div className="copilot-bar">
        <div className="copilot-quick-wrapper">
          <span className="copilot-icon">🤖</span>
          <strong className="copilot-label">AI Search & Copilot:</strong>
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Ask AI: e.g., 'Show active corporate law jobs in Chennai' or 'High priority IP counsel'..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                processCopilotQuery(quickInput);
                setQuickInput('');
                setIsCopilotOpen(true);
              }
            }}
          />
          <button
            onClick={() => {
              processCopilotQuery(quickInput);
              setQuickInput('');
              setIsCopilotOpen(true);
            }}
          >
            Filter with AI
          </button>
        </div>
        <div className="copilot-chips">
          <span className="copilot-chip" onClick={() => { processCopilotQuery('Active Corporate jobs'); setIsCopilotOpen(true); }}>⚡ Corporate Jobs</span>
          <span className="copilot-chip" onClick={() => { processCopilotQuery('Compliance Regulatory'); setIsCopilotOpen(true); }}>🔥 Compliance</span>
          <span className="copilot-chip" onClick={() => { processCopilotQuery('Senior roles'); setIsCopilotOpen(true); }}>💼 Senior Roles</span>
          <span className="copilot-chip chip-reset" onClick={handleClearFilters}>🔄 Clear All</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="fbar">
        <div className="fg">
          <label>Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Company, role, keyword..."
          />
        </div>
        <div className="fdiv"></div>
        <div className="fg">
          <label>Practice Area</label>
          <select value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)}>
            <option value="">All Practice Areas</option>
            {practiceAreas.map((pa) => (
              <option key={pa} value={pa}>{pa}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>Seniority</label>
          <select value={seniorityFilter} onChange={(e) => setSeniorityFilter(e.target.value)}>
            <option value="">All Levels</option>
            <option value="Senior">Senior</option>
            <option value="Mid-Senior">Mid-Senior</option>
            <option value="Junior / Associate">Junior / Associate</option>
            <option value="Executive / Director">Executive / Director</option>
          </select>
        </div>
        <div className="fdiv"></div>
        <div className="fg">
          <label>Location</label>
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="City or Remote..."
            style={{ width: '120px' }}
          />
        </div>
        <div className="fg">
          <label>Date Filter</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={30}>Past 30 Days</option>
            <option value={45}>Past 45 Days</option>
            <option value={60}>Past 60 Days</option>
            <option value={90}>Past 90 Days</option>
          </select>
        </div>
        <button className="bclear" onClick={handleClearFilters}>✕ Clear</button>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="srow">
        <div className="sc blue-border">
          <div className="n">{filteredJobs.length}</div>
          <div className="l">Matched Jobs</div>
        </div>
        <div className="sc red-border">
          <div className="n">{filteredJobs.filter((j) => j.seniority === 'Senior' || j.seniority.includes('Executive')).length}</div>
          <div className="l">Senior / Lead</div>
        </div>
        <div className="sc green-border">
          <div className="n">{filteredJobs.filter((j) => j.practice_area.includes('Corporate')).length}</div>
          <div className="l">Corporate & Commercial</div>
        </div>
        <div className="sc orange-border">
          <div className="n">{filteredJobs.filter((j) => j.practice_area.includes('Compliance')).length}</div>
          <div className="l">Compliance & Regulatory</div>
        </div>
        <div className="sc purple-border">
          <div className="n">{new Set(filteredJobs.map((j) => j.company)).size}</div>
          <div className="l">Unique Companies</div>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="twrap">
        <div className="alert-bar">
          <strong>Apply Now:</strong> Featured Opportunities in Corporate Counsel, Data Privacy, Intellectual Property, and Compliance.
        </div>
        <div className="tmeta">
          <span>Showing <strong>{filteredJobs.length}</strong> jobs, sorted by relevance date</span>
        </div>
        <table id="main-table" className="jobs-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>ID</th>
              <th style={{ width: '220px' }}>Company & Position</th>
              <th style={{ width: '120px' }}>Location</th>
              <th style={{ width: '100px' }}>Posted Date</th>
              <th style={{ width: '160px' }}>Practice Area</th>
              <th style={{ width: '130px' }}>Seniority</th>
              <th style={{ width: '110px' }}>Employment</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr key={job.id} className="job-row">
                <td className="job-id">#{job.id}</td>
                <td>
                  <span className="co-name">{job.title}</span>
                  <span className="co-ind">{job.company}</span>
                </td>
                <td>{job.location}</td>
                <td className="job-date">{formatDate(job.posted_date)}</td>
                <td><span className="pill practice-pill">{job.practice_area}</span></td>
                <td><span className="pill seniority-pill">{job.seniority}</span></td>
                <td><span className="pill type-pill">{job.employment_type}</span></td>
                <td className="job-desc">{job.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Copilot Floating Drawer Widget */}
      <button className="copilot-floating-btn" onClick={() => setIsCopilotOpen(!isCopilotOpen)}>
        <span>🤖</span> AI Copilot
      </button>

      {isCopilotOpen && (
        <div className="copilot-drawer active">
          <div className="copilot-header">
            <h4>🤖 Legal AI Copilot</h4>
            <button className="copilot-close" onClick={() => setIsCopilotOpen(false)}>✕</button>
          </div>
          <div className="copilot-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`copilot-msg ${m.sender}`}>
                <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            ))}
          </div>
          <div className="copilot-chips">
            <span className="copilot-chip" onClick={() => processCopilotQuery('Active Corporate jobs')}>⚡ Corporate</span>
            <span className="copilot-chip" onClick={() => processCopilotQuery('Compliance Regulatory')}>🔥 Compliance</span>
            <span className="copilot-chip" onClick={() => processCopilotQuery('Senior roles')}>💼 Senior</span>
            <span className="copilot-chip chip-reset" onClick={handleClearFilters}>🔄 Clear</span>
          </div>
          <div className="copilot-input-area">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="Ask AI Copilot to filter..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  processCopilotQuery(copilotInput);
                  setCopilotInput('');
                }
              }}
            />
            <button
              onClick={() => {
                processCopilotQuery(copilotInput);
                setCopilotInput('');
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
