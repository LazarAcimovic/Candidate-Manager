package candidateManager.implementation;

import candidateManager.DTOs.SkillDto;
import candidateManager.DTOs.SkillUpdateDto;
import candidateManager.DTOs.SkillCreateDto;
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
    public SkillDto saveSkill(SkillCreateDto dto) {
        Skill skill = new Skill();
        skill.setName(dto.getName());
        
        return mapToDto(skillRepository.save(skill));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SkillDto> getSkillById(int id) {
        return skillRepository.findById(id)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SkillDto> getSkillByName(String name) {
        return skillRepository.findByName(name)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public Optional<SkillDto> updateSkill(int id, SkillUpdateDto dto) {
        return skillRepository.findById(id).map(existingSkill -> {
            existingSkill.setName(dto.getName());
            return mapToDto(skillRepository.save(existingSkill));
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SkillDto> searchByPrefix(String prefix) {
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

    private SkillDto mapToDto(Skill skill) {
        SkillDto dto = new SkillDto();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        return dto;
    }
}