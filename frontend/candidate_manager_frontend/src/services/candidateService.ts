import axios from "axios";
import apiClient from "./apiClient";
import  type { Candidate, CandidateCreate, CandidateUpdate } from "../models/CandidateModel";

// Search endpoints respond with 404 when nothing matches; treat that as an empty result.
const searchOrEmpty = async (url: string): Promise<Candidate[]> => {
  try {
    const response = await apiClient.get(url);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return [];
    }
    throw err;
  }
};

export const candidateService = {
  getAll: async (): Promise<Candidate[]> => {
    const response = await apiClient.get("/candidates");
    return response.data;
  },

  getById: async (id: number): Promise<Candidate> => {
    const response = await apiClient.get(`/candidates/id/${id}`);
    return response.data;
  },

  create: async (candidate: CandidateCreate): Promise<Candidate> => {
    const response = await apiClient.post("/candidates/candidate", candidate);
    return response.data;
  },

  update: async (id: number, candidate: CandidateUpdate): Promise<Candidate> => {
    const response = await apiClient.put(`/candidates/id/${id}`, candidate);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/candidates/id/${id}`);
  },

  searchByName: (name: string): Promise<Candidate[]> =>
    searchOrEmpty(`/candidates/search/name?name=${encodeURIComponent(name)}`),

  searchBySkills: (skills: string[]): Promise<Candidate[]> =>
    searchOrEmpty(`/candidates/search/skills?skillNames=${skills.join(',')}`),

  addSkill: async (candidateId: number, skillName: string): Promise<Candidate> => {
    const response = await apiClient.post(`/candidates/${candidateId}/skill/${encodeURIComponent(skillName)}`);
    return response.data;
  },

  removeSkill: async (candidateId: number, skillId: number): Promise<Candidate> => {
    const response = await apiClient.delete(`/candidates/${candidateId}/skill/${skillId}`);
    return response.data;
  }
};