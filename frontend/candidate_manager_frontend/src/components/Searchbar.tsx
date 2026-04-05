import { useCandidateStore } from "../store/candidateStore";
import { useEffect, useState } from "react";

const SearchBar = () => {
  const searchByName = useCandidateStore((state) => state.searchByName);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchByName(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchByName]);

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search candidates by name..."
      />
    </div>
  );
};

export default SearchBar;
