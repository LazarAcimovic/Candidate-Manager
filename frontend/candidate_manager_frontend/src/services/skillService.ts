import apiClient from "./apiClient";
import type { Skill, SkillCreate, SkillUpdate } from "../models/SkillModel";

export const skillService = {
  getAll: async (): Promise<Skill[]> => {
    const response = await apiClient.get("/skills");
    return response.data;
  },

  getById: async (id: number): Promise<Skill> => {
    const response = await apiClient.get(`/skills/id/${id}`);
    return response.data;
  },

  searchByPrefix: async (prefix: string): Promise<Skill[]> => {
    const response = await apiClient.get(
      `/skills/search?prefix=${encodeURIComponent(prefix)}`,
    );
    return response.data;
  },

  create: async (skill: SkillCreate): Promise<Skill> => {
    const response = await apiClient.post("/skills/skill", skill);
    return response.data;
  },

  update: async (id: number, skill: SkillUpdate): Promise<Skill> => {
    const response = await apiClient.put(`/skills/id/${id}`, skill);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/skills/id/${id}`);
  },
};
