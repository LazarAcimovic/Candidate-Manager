package candidateManager.implementation;

import candidateManager.DTOs.CandidateCreateDto;
import candidateManager.DTOs.CandidateDto;
import candidateManager.DTOs.CandidateUpdateDto;
import candidateManager.models.Candidate;
import candidateManager.models.Skill;
import candidateManager.repository.CandidateRepository;
import candidateManager.repository.SkillRepository;
import candidateManager.services.CandidateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CandidateServiceImpl implements CandidateService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Override
    @Transactional
    public CandidateDto saveCandidate(CandidateCreateDto dto) {
        Candidate candidate = new Candidate();
        candidate.setFullName(dto.getFullName());
        candidate.setContactNumber(dto.getContactNumber());
        candidate.setEmail(dto.getEmail());
        candidate.setDateOfBirth(dto.getDateOfBirth());

        if (dto.getSkillNames() != null) {
            List<Skill> skills = dto.getSkillNames().stream()
                    .map(name -> skillRepository.findByName(name)
                            .orElseGet(() -> skillRepository.save(new Skill(name))))
                    .collect(Collectors.toList());
            candidate.setSkills(skills);
        }

        return mapToDto(candidateRepository.save(candidate));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateDto> getAllCandidates() {
        return candidateRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CandidateDto> getCandidateById(int id) {
        return candidateRepository.findById(id)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public Optional<CandidateDto> updateCandidate(int id, CandidateUpdateDto dto) {
        return candidateRepository.findById(id).map(existingCandidate -> {
            existingCandidate.setFullName(dto.getFullName());
            existingCandidate.setContactNumber(dto.getContactNumber());
            existingCandidate.setEmail(dto.getEmail());
            existingCandidate.setDateOfBirth(dto.getDateOfBirth());

            if (dto.getSkillNames() != null) {
                List<Skill> skills = dto.getSkillNames().stream()
                        .map(name -> skillRepository.findByName(name)
                                .orElseGet(() -> skillRepository.save(new Skill(name))))
                        .collect(Collectors.toList());
                existingCandidate.setSkills(skills);
            }

            return mapToDto(candidateRepository.save(existingCandidate));
        });
    }

    @Override
    @Transactional
    public boolean deleteCandidate(int id) {
        if (candidateRepository.existsById(id)) {
            candidateRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateDto> searchByName(String name) {
        return candidateRepository.findByFullNameContaining(name).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateDto> searchBySkills(List<String> skillNames) {
    	
    		List<String> lowerCaseSkills = skillNames.stream()
    				.map(String::toLowerCase)
    				.toList();
    		
        return candidateRepository.findAllByAnySkill(lowerCaseSkills).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Optional<CandidateDto> addSkillToCandidate(int candidateId, String skillName) {
        Optional<Candidate> candidateOpt = candidateRepository.findById(candidateId);

        if (candidateOpt.isPresent()) {
            Candidate candidate = candidateOpt.get();

            Skill skill = skillRepository.findByName(skillName)
                    .orElseGet(() -> skillRepository.save(new Skill(skillName)));

            if (!candidate.getSkills().contains(skill)) {
                candidate.getSkills().add(skill);
                return Optional.of(mapToDto(candidateRepository.save(candidate)));
            }
            
            return Optional.of(mapToDto(candidate));
        }
        
        return Optional.empty();
    }

    @Override
    @Transactional
    public Optional<CandidateDto> removeSkillFromCandidate(int candidateId, int skillId) {
        Optional<Candidate> candidateOpt = candidateRepository.findById(candidateId);
        Optional<Skill> skillOpt = skillRepository.findById(skillId);

        if (candidateOpt.isPresent() && skillOpt.isPresent()) {
            Candidate candidate = candidateOpt.get();
            Skill skill = skillOpt.get();

            candidate.getSkills().remove(skill);
            return Optional.of(mapToDto(candidateRepository.save(candidate)));
        }
        return Optional.empty();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(int id) {
        return candidateRepository.existsById(id);
    }

    private CandidateDto mapToDto(Candidate candidate) {
        CandidateDto dto = new CandidateDto();
        
        dto.setId(candidate.getId());
        dto.setFullName(candidate.getFullName());
        dto.setEmail(candidate.getEmail());
        dto.setContactNumber(candidate.getContactNumber());
        dto.setDateOfBirth(candidate.getDateOfBirth());
        
        dto.setSkillNames(candidate.getSkills().stream()
                .map(Skill::getName)
                .collect(Collectors.toList()));
        
        return dto;
    }
}