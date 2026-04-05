import { useState, useEffect } from "react";
import { useCandidateStore } from "../store/candidateStore";
import { skillService } from "../services/skillService";
import type { Skill } from "../models/SkillModel";

const SearchSection = () => {
  const { searchByName, searchBySkills } = useCandidateStore();
  const [nameTerm, setNameTerm] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  useEffect(() => {
    skillService.getAll().then(setAllSkills).catch(console.error);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => searchByName(nameTerm), 300);
    return () => clearTimeout(delay);
  }, [nameTerm]);

  useEffect(() => {
    searchBySkills(selectedSkills);
  }, [selectedSkills]);

  const handleSkillInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const found = allSkills.find(
      (s) => s.name.toLowerCase() === val.toLowerCase(),
    );
    if (found && !selectedSkills.includes(found.name)) {
      setSelectedSkills([...selectedSkills, found.name]);
      setSkillInput("");
    } else {
      setSkillInput(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim() !== "") {
      const found = allSkills.find(
        (s) => s.name.toLowerCase() === skillInput.toLowerCase(),
      );

      if (!found) {
        setSelectedSkills([...selectedSkills, skillInput]);
        setSkillInput("");
      }
    }
  };

  return (
    <div className="search-section">
      <div className="search-inputs-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name..."
          value={nameTerm}
          onChange={(e) => setNameTerm(e.target.value)}
        />
        <div className="input-group">
          <input
            list="skills-options"
            type="text"
            className="search-input"
            placeholder="Add skill filter..."
            value={skillInput}
            onChange={handleSkillInput}
            onKeyDown={handleKeyDown}
          />
          <datalist id="skills-options">
            {allSkills.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>
      </div>

      {selectedSkills.length > 0 && (
        <div className="active-filters">
          {selectedSkills.map((s) => (
            <span key={s} className="filter-tag">
              {s}
              <button
                onClick={() =>
                  setSelectedSkills(selectedSkills.filter((x) => x !== s))
                }
              >
                ×
              </button>
            </span>
          ))}
          <button className="clear-all" onClick={() => setSelectedSkills([])}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchSection;
