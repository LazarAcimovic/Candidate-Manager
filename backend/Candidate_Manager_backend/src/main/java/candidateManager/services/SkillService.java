package candidateManager.services;

import candidateManager.DTOs.SkillDTO;
import java.util.List;
import java.util.Optional;

public interface SkillService {

    SkillDTO saveSkill(SkillDTO dto);

    List<SkillDTO> getAllSkills();

    Optional<SkillDTO> getSkillById(int id);

    Optional<SkillDTO> updateSkill(int id, SkillDTO dto);

    boolean deleteSkill(int id);

    boolean existsById(int id);

    Optional<SkillDTO> getSkillByName(String name);
    
    List<SkillDTO> searchByPrefix(String prefix);
}