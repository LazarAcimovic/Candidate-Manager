import apiClient from "./apiClient";
import  type { Candidate, CandidateCreate, CandidateUpdate } from "../models/CandidateModel";

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

  searchByName: async (name: string): Promise<Candidate[]> => {
    const response = await apiClient.get(`/candidates/search/name?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  searchBySkills: async (skills: string[]): Promise<Candidate[]> => {
    const response = await apiClient.get(`/candidates/search/skills?skillNames=${skills.join(',')}`);
    return response.data;
  },

  addSkill: async (candidateId: number, skillName: string): Promise<Candidate> => {
    const response = await apiClient.post(`/candidates/${candidateId}/skill/${encodeURIComponent(skillName)}`);
    return response.data;
  },

  removeSkill: async (candidateId: number, skillId: number): Promise<Candidate> => {
    const response = await apiClient.delete(`/candidates/${candidateId}/skill/${skillId}`);
    return response.data;
  }
};