import { useState, useEffect, useMemo } from "react";
import { useCandidateStore } from "../store/candidateStore";
import { skillService } from "../services/skillService";
import type { Skill } from "../models/SkillModel";

const SearchSection = () => {
  const { nameFilter, skillsFilter, searchByName, searchBySkills } =
    useCandidateStore();
  const [skillInput, setSkillInput] = useState("");
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    skillService.getAll().then(setAllSkills).catch(console.error);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!skillInput.trim()) return allSkills;
    return allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(skillInput.toLowerCase()) &&
        !skillsFilter.includes(s.name),
    );
  }, [allSkills, skillInput, skillsFilter]);

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
    setIsDropdownOpen(true);
  };

  const selectSkill = (skillName: string) => {
    if (!skillsFilter.includes(skillName)) {
      searchBySkills([...skillsFilter, skillName]);
    }
    setSkillInput("");
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim() !== "") {
      const trimmed = skillInput.trim();
      selectSkill(trimmed);
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

        <div className="custom-select-container">
          <input
            type="text"
            className="search-input"
            placeholder="Add skill filter..."
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
