import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { candidateService } from "../services/candidateService";
import { skillService } from "../services/skillService";
import type { Skill } from "../models/SkillModel";

const CandidateDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    dateOfBirth: "",
    skillNames: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidate, skills] = await Promise.all([
          candidateService.getById(Number(id)),
          skillService.getAll(),
        ]);

        setFormData({
          fullName: candidate.fullName,
          email: candidate.email,
          contactNumber: candidate.contactNumber,
          dateOfBirth: candidate.dateOfBirth.split("T")[0],
          skillNames: candidate.skillNames,
        });
        setAllSkills(skills);
      } catch (err) {
        console.error(err);
        alert("Error loading candidate data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const filteredOptions = useMemo(() => {
    if (!skillInput.trim()) return allSkills;
    return allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(skillInput.toLowerCase()) &&
        !formData.skillNames.includes(s.name),
    );
  }, [allSkills, skillInput, formData.skillNames]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectSkill = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !formData.skillNames.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skillNames: [...prev.skillNames, trimmed],
      }));
    }
    setSkillInput("");
    setIsDropdownOpen(false);
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      selectSkill(skillInput);
    }
  };

  const removeSkill = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      skillNames: prev.skillNames.filter((s) => s !== name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await candidateService.update(Number(id), formData);
      navigate("/");
    } catch (err) {
      alert("Error updating candidate.");
    }
  };

  if (isLoading)
    return <div className="status-text">Loading candidate details...</div>;

  return (
    <div className="form-container">
      <div className="form-card">
        <h1>Edit Candidate</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              className="search-input"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              className="search-input"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className="search-input"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              className="search-input"
              value={formData.contactNumber}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Skills</label>
            <div className="custom-select-container">
              <input
                type="text"
                className="search-input"
                placeholder="Add more skills..."
                value={skillInput}
                onChange={handleSkillInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />

              {isDropdownOpen && filteredOptions.length > 0 && (
                <ul className="custom-dropdown">
                  {filteredOptions.map((s) => (
                    <li key={s.id} onClick={() => selectSkill(s.name)}>
                      {s.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="active-filters"
              style={{ marginTop: "0.75rem", borderTop: "none" }}
            >
              {formData.skillNames.map((name) => (
                <span key={name} className="filter-tag">
                  {name}
                  <button type="button" onClick={() => removeSkill(name)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </button>
            <button type="submit" className="btn btn-primary">
              Update Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateDetailsPage;
