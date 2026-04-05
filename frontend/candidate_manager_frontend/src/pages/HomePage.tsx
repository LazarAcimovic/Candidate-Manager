import { useEffect } from "react";
import { useCandidateStore } from "../store/candidateStore";
import SearchSection from "../components/SearchSection";
import { Link } from "react-router-dom";

const HomePage = () => {
  const { candidates, isLoading, error, fetchCandidates, removeCandidate } =
    useCandidateStore();

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      removeCandidate(id);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header-stack">
        <h1>Candidates Dashboard</h1>
        <SearchSection />
      </div>

      {isLoading && <p className="status-text">Učitavanje...</p>}
      {error && <div className="error-text">{error}</div>}

      {!isLoading && !error && candidates.length === 0 && (
        <div className="empty-state">
          <p>No candidates found matching your filters.</p>
        </div>
      )}

      <div className="candidate-grid">
        {candidates.map((c) => (
          <div key={c.id} className="candidate-card">
            <div className="card-info">
              <h3>{c.fullName}</h3>
              <p className="candidate-email">{c.email}</p>
              <div className="skill-tags">
                {c.skillNames.slice(0, 5).map((s) => (
                  <span key={`${c.id}-${s}`} className="skill-tag">
                    {s}
                  </span>
                ))}
                {c.skillNames.length > 5 && (
                  <span className="skill-tag-more">
                    +{c.skillNames.length - 5}
                  </span>
                )}
              </div>
              <p className="contact-info">📞 {c.contactNumber}</p>
            </div>
            <div className="card-actions">
              <Link to={`/candidate/${c.id}`} className="btn btn-outline">
                Details
              </Link>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(c.id, c.fullName)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
