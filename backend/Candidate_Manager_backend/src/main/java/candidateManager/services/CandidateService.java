package candidateManager.services;

import candidateManager.DTOs.CandidateCreateDto;
import candidateManager.DTOs.CandidateDto;
import candidateManager.DTOs.CandidateUpdateDto;
import java.util.List;
import java.util.Optional;

public interface CandidateService {

    CandidateDto saveCandidate(CandidateCreateDto dto);

    List<CandidateDto> getAllCandidates();

    Optional<CandidateDto> getCandidateById(int id);

    Optional<CandidateDto> updateCandidate(int id, CandidateUpdateDto dto);

    boolean deleteCandidate(int id);

    List<CandidateDto> searchByName(String name);

    List<CandidateDto> searchBySkills(List<String> skillNames);

    Optional<CandidateDto> addSkillToCandidate(int candidateId, int skillId);

    Optional<CandidateDto> removeSkillFromCandidate(int candidateId, int skillId);

    boolean existsById(int id);
}