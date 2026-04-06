import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { skillService } from "../services/skillService";
import { candidateService } from "../services/candidateService";
import type { Skill } from "../models/SkillModel";

const AddCandidatePage = () => {
  const navigate = useNavigate();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    dateOfBirth: "",
    skillNames: [] as string[],
  });

  useEffect(() => {
    skillService.getAll().then(setAllSkills).catch(console.error);
  }, []);

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
    setError(null);
    try {
      await candidateService.create(formData);
      navigate("/");
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setError(err.response.data);
      } else {
        setError("An error occurred while saving the candidate.");
      }
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1>Add New Candidate</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              className="search-input"
              placeholder="e.g. Michael Smith"
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
              placeholder="example@mail.com"
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
              placeholder="+381..."
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
                placeholder="e.g. React, .NET..."
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

          {error && (
            <div
              className="error-banner"
              style={{
                color: "#721c24",
                backgroundColor: "#f8d7da",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "1rem",
                border: "1px solid #f5c6cb",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCandidatePage;
