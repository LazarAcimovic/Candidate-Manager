import { create } from "zustand";
import type { Candidate } from "../models/CandidateModel";
import { candidateService } from "../services/candidateService";

interface CandidateState {
  candidates: Candidate[];
  isLoading: boolean;
  error: string | null;
  nameFilter: string;
  skillsFilter: string[];

  fetchCandidates: () => Promise<void>;
  searchByName: (name: string) => Promise<void>;
  searchBySkills: (skills: string[]) => Promise<void>;
  removeCandidate: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useCandidateStore = create<CandidateState>((set, get) => ({
  candidates: [],
  isLoading: false,
  error: null,
  nameFilter: "",
  skillsFilter: [],

  clearError: () => set({ error: null }),

  fetchCandidates: async () => {
    const { nameFilter, skillsFilter } = get();
    set({ isLoading: true, error: null });

    try {
      let data: Candidate[];

      if (skillsFilter.length > 0) {
        const results = await candidateService.searchBySkills(skillsFilter);
        data = nameFilter.trim()
          ? results.filter((c) =>
              c.fullName.toLowerCase().includes(nameFilter.toLowerCase()),
            )
          : results;
      } else if (nameFilter.trim()) {
        data = await candidateService.searchByName(nameFilter);
      } else {
        data = await candidateService.getAll();
      }

      set({ candidates: data, isLoading: false });
    } catch (err: any) {
      set({ error: "Failed to load candidates", isLoading: false });
    }
  },

  searchByName: async (name: string) => {
    set({ nameFilter: name, isLoading: true, error: null });
    const { skillsFilter } = get();

    try {
      let data: Candidate[];
      if (skillsFilter.length > 0) {
        const resultsFromSkills =
          await candidateService.searchBySkills(skillsFilter);
        data = resultsFromSkills.filter((c) =>
          c.fullName.toLowerCase().includes(name.toLowerCase()),
        );
      } else if (name.trim()) {
        data = await candidateService.searchByName(name);
      } else {
        data = await candidateService.getAll();
      }
      set({ candidates: data, isLoading: false });
    } catch (err: any) {
      set({
        candidates: [],
        isLoading: false,
        error: "No candidates found with name specified",
      });
    }
  },

  searchBySkills: async (skills: string[]) => {
    set({ skillsFilter: skills, isLoading: true, error: null });
    const { nameFilter } = get();

    try {
      let data: Candidate[];
      if (skills.length > 0) {
        const resultsFromSkills = await candidateService.searchBySkills(skills);
        data = nameFilter.trim()
          ? resultsFromSkills.filter((c) =>
              c.fullName.toLowerCase().includes(nameFilter.toLowerCase()),
            )
          : resultsFromSkills;
      } else if (nameFilter.trim()) {
        data = await candidateService.searchByName(nameFilter);
      } else {
        data = await candidateService.getAll();
      }
      set({ candidates: data, isLoading: false });
    } catch (err: any) {
      set({ candidates: [], isLoading: false, error: "Skill search failed" });
    }
  },

  removeCandidate: async (id: number) => {
    set({ error: null });
    try {
      await candidateService.delete(id);
      set((state) => ({
        candidates: state.candidates.filter((c) => c.id !== id),
      }));
    } catch (err: any) {
      set({ error: "Failed to delete candidate", isLoading: false });
    }
  },
}));
