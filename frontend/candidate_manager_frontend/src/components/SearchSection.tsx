import { useState, useEffect } from "react";
import { useCandidateStore } from "../store/candidateStore";
import { skillService } from "../services/skillService";
import type { Skill } from "../models/SkillModel";

const SearchSection = () => {
  const { nameFilter, skillsFilter, searchByName, searchBySkills } =
    useCandidateStore();

  const [skillInput, setSkillInput] = useState("");
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  useEffect(() => {
    skillService.getAll().then(setAllSkills).catch(console.error);
  }, []);

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim() !== "") {
      const trimmed = skillInput.trim();
      if (!skillsFilter.includes(trimmed)) {
        searchBySkills([...skillsFilter, trimmed]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    searchBySkills(skillsFilter.filter((s) => s !== skill));
  };

  const clearAll = () => {
    searchBySkills([]);
  };

  return (
    <div className="search-section">
      <div className="search-inputs-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name..."
          value={nameFilter}
          onChange={(e) => searchByName(e.target.value)}
        />
        <div className="input-group">
          <input
            list="skills-options"
            type="text"
            className="search-input"
            placeholder="Add skill filter..."
            value={skillInput}
            onChange={handleSkillInputChange}
            onKeyDown={handleKeyDown}
          />
          <datalist id="skills-options">
            {allSkills.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>
      </div>

      {skillsFilter.length > 0 && (
        <div className="active-filters">
          {skillsFilter.map((s) => (
            <span key={s} className="filter-tag">
              {s}
              <button onClick={() => removeSkill(s)}>×</button>
            </span>
          ))}
          <button className="clear-all" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchSection;