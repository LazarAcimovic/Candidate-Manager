import { create } from "zustand";
import type { Candidate } from "../models/CandidateModel";
import { candidateService } from "../services/candidateService";

interface CandidateState {
  candidates: Candidate[];
  isLoading: boolean;
  error: string | null;
  
  fetchCandidates: () => Promise<void>;
  searchByName: (name: string) => Promise<void>;
  searchBySkills: (skills: string[]) => Promise<void>;
  removeCandidate: (id: number) => Promise<void>;
  
  clearError: () => void;
}

export const useCandidateStore = create<CandidateState>((set) => ({
  candidates: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCandidates: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await candidateService.getAll();
      set({ candidates: data, isLoading: false });
    } catch (err: any) {
      set({ error: "Failed to load candidates", isLoading: false });
    }
  },

  searchByName: async (name: string) => {
    if (!name.trim()) {
      const all = await candidateService.getAll();
      set({ candidates: all, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await candidateService.searchByName(name);
      set({ candidates: data, isLoading: false });
    } catch (err: any) {
      set({ 
        candidates: [], 
        error: err.response?.status === 404 
          ? `No candidates found with name containing: ${name}` 
          : "An error occurred during search", 
        isLoading: false 
      });
    }
  },

  searchBySkills: async (skills: string[]) => {
    if (skills.length === 0) {
      const all = await candidateService.getAll();
      set({ candidates: all, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await candidateService.searchBySkills(skills);
      set({ candidates: data, isLoading: false });
    } catch (err: any) {
      set({ 
        candidates: [], 
        error: err.response?.status === 404 
          ? "No candidates found with the specified skills" 
          : "An error occurred during skill search", 
        isLoading: false 
      });
    }
  },

  removeCandidate: async (id: number) => {
    set({ error: null });
    try {
      await candidateService.delete(id);
      set((state) => ({
        candidates: state.candidates.filter((c) => c.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.status === 404 
          ? `Candidate with ID ${id} could not be found for deletion.` 
          : "Failed to delete candidate. Please try again.",
        isLoading: false 
      });
    }
  },
}));