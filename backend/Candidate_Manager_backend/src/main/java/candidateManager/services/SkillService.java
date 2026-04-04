package candidateManager.services;

import candidateManager.DTOs.SkillCreateDto;
import candidateManager.DTOs.SkillDto;
import candidateManager.DTOs.SkillUpdateDto;
import java.util.List;
import java.util.Optional;

public interface SkillService {

    SkillDto saveSkill(SkillCreateDto dto);

    List<SkillDto> getAllSkills();

    Optional<SkillDto> getSkillById(int id);

    Optional<SkillDto> updateSkill(int id, SkillUpdateDto dto);

    boolean deleteSkill(int id);

    boolean existsById(int id);

    Optional<SkillDto> getSkillByName(String name);
    
    List<SkillDto> searchByPrefix(String prefix);
}