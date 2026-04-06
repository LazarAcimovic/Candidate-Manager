package candidateManager.services;

import candidateManager.DTOs.SkillCreateDto;
import candidateManager.DTOs.SkillDto;
import candidateManager.DTOs.SkillUpdateDto;
import candidateManager.implementation.SkillServiceImpl;
import candidateManager.models.Skill;
import candidateManager.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillServiceImplTest {

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private SkillServiceImpl skillService;

    @Test
    void testGetAllSkills() {
        when(skillRepository.findAll()).thenReturn(List.of(new Skill("Java")));
        List<SkillDto> result = skillService.getAllSkills();
        assertEquals(1, result.size());
    }

    @Test
    void testGetSkillById_Found() {
        Skill skill = new Skill("Java");
        skill.setId(1);
        when(skillRepository.findById(1)).thenReturn(Optional.of(skill));

        Optional<SkillDto> result = skillService.getSkillById(1);

        assertTrue(result.isPresent());
        assertEquals("Java", result.get().getName());
    }

    @Test
    void testGetSkillById_NotFound() {
        when(skillRepository.findById(1)).thenReturn(Optional.empty());

        Optional<SkillDto> result = skillService.getSkillById(1);

        assertFalse(result.isPresent());
    }

    @Test
    void testGetSkillByName_Found() {
        Skill skill = new Skill("Java");
        when(skillRepository.findByName("Java")).thenReturn(Optional.of(skill));

        Optional<SkillDto> result = skillService.getSkillByName("Java");

        assertTrue(result.isPresent());
        assertEquals("Java", result.get().getName());
    }

    @Test
    void testSaveSkill() {
        SkillCreateDto dto = new SkillCreateDto();
        dto.setName("SQL");
        Skill skill = new Skill("SQL");
        
        when(skillRepository.save(any())).thenReturn(skill);
        SkillDto result = skillService.saveSkill(dto);
        assertEquals("SQL", result.getName());
    }

    @Test
    void testUpdateSkill_Success() {
        SkillUpdateDto dto = new SkillUpdateDto();
        dto.setName("Updated Skill");
        Skill existingSkill = new Skill("Old Skill");
        existingSkill.setId(1);

        when(skillRepository.findById(1)).thenReturn(Optional.of(existingSkill));
        when(skillRepository.save(any())).thenReturn(existingSkill);

        Optional<SkillDto> result = skillService.updateSkill(1, dto);

        assertTrue(result.isPresent());
        assertEquals("Updated Skill", result.get().getName());
    }

    @Test
    void testUpdateSkill_NotFound() {
        SkillUpdateDto dto = new SkillUpdateDto();
        when(skillRepository.findById(1)).thenReturn(Optional.empty());

        Optional<SkillDto> result = skillService.updateSkill(1, dto);

        assertFalse(result.isPresent());
        verify(skillRepository, never()).save(any());
    }

    @Test
    void testSearchByPrefix() {
        Skill skill = new Skill("Java");
        when(skillRepository.findByPrefix("Jav")).thenReturn(List.of(skill));

        List<SkillDto> result = skillService.searchByPrefix("Jav");

        assertEquals(1, result.size());
        assertEquals("Java", result.get(0).getName());
    }

    @Test
    void testDeleteSkill_Exists() {
        when(skillRepository.existsById(1)).thenReturn(true);
        boolean deleted = skillService.deleteSkill(1);
        assertTrue(deleted);
        verify(skillRepository).deleteById(1);
    }

    @Test
    void testDeleteSkill_NotExists() {
        when(skillRepository.existsById(1)).thenReturn(false);
        boolean deleted = skillService.deleteSkill(1);
        assertFalse(deleted);
        verify(skillRepository, never()).deleteById(anyInt());
    }

    @Test
    void testExistsById() {
        when(skillRepository.existsById(1)).thenReturn(true);
        boolean exists = skillService.existsById(1);
        assertTrue(exists);
    }
}