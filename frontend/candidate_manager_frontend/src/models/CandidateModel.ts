export interface Candidate {
  id: number;
  fullName: string;
  dateOfBirth: string; 
  contactNumber: string;
  email: string;
  skillNames: string[];
}

export interface CandidateCreate {
  fullName: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  skillNames: string[];
}

export interface CandidateUpdate {
  fullName: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  skillNames: string[];
}