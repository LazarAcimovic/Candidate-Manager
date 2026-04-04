package candidateManager.implementation;

import candidateManager.DTOs.SkillDTO;
import candidateManager.models.Skill;
import candidateManager.repository.SkillRepository;
import candidateManager.services.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SkillServiceImpl implements SkillService {

    @Autowired
    private SkillRepository skillRepository;

    @Override
    @Transactional
    public SkillDTO saveSkill(SkillDTO dto) {
        Skill skill = new Skill();
        skill.setName(dto.getName());
        
        return mapToDto(skillRepository.save(skill));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SkillDTO> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SkillDTO> getSkillById(int id) {
        return skillRepository.findById(id)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SkillDTO> getSkillByName(String name) {
        return skillRepository.findByName(name)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public Optional<SkillDTO> updateSkill(int id, SkillDTO dto) {
        return skillRepository.findById(id).map(existingSkill -> {
            existingSkill.setName(dto.getName());
            return mapToDto(skillRepository.save(existingSkill));
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SkillDTO> searchByPrefix(String prefix) {
        return skillRepository.findByPrefix(prefix).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean deleteSkill(int id) {
        if (skillRepository.existsById(id)) {
            skillRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(int id) {
        return skillRepository.existsById(id);
    }

    private SkillDTO mapToDto(Skill skill) {
        SkillDTO dto = new SkillDTO();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        return dto;
    }
}