import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { skillService } from "../services/skillService";
import { candidateService } from "../services/candidateService";
import type { Skill } from "../models/SkillModel";

const AddCandidatePage = () => {
  const navigate = useNavigate();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState("");

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !formData.skillNames.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skillNames: [...prev.skillNames, trimmed],
      }));
      setSkillInput("");
    }
  };

  const handleSkillSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const found = allSkills.find(
      (s) => s.name.toLowerCase() === val.toLowerCase(),
    );

    if (found) {
      addSkill(found.name);
    } else {
      setSkillInput(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(skillInput);
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
      await candidateService.create(formData);
      navigate("/");
    } catch (err) {
      alert("Error saving candidate.");
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
            <label>Skills (select or type new + Enter)</label>
            <div className="input-group">
              <input
                list="add-skills-options"
                type="text"
                className="search-input"
                placeholder="e.g. React, .NET..."
                value={skillInput}
                onChange={handleSkillSelect}
                onKeyDown={handleKeyDown}
              />
              <datalist id="add-skills-options">
                {allSkills.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
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
