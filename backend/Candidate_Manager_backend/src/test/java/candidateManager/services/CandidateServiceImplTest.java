package candidateManager.services;

import candidateManager.DTOs.CandidateCreateDto;
import candidateManager.DTOs.CandidateDto;
import candidateManager.DTOs.CandidateUpdateDto;
import candidateManager.implementation.CandidateServiceImpl;
import candidateManager.models.Candidate;
import candidateManager.models.Skill;
import candidateManager.repository.CandidateRepository;
import candidateManager.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateServiceImplTest {

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private CandidateServiceImpl candidateService;

    @Test
    void testGetAllCandidates() {
        Candidate c = new Candidate();
        c.setId(1);
        c.setSkills(new ArrayList<>());
        when(candidateRepository.findAll()).thenReturn(List.of(c));

        List<CandidateDto> result = candidateService.getAllCandidates();

        assertEquals(1, result.size());
        verify(candidateRepository).findAll();
    }

    @Test
    void testGetCandidateById_Found() {
        Candidate c = new Candidate();
        c.setId(1);
        c.setSkills(new ArrayList<>());
        when(candidateRepository.findById(1)).thenReturn(Optional.of(c));

        Optional<CandidateDto> result = candidateService.getCandidateById(1);

        assertTrue(result.isPresent());
        assertEquals(1, result.get().getId());
    }

    @Test
    void testGetCandidateById_NotFound() {
        when(candidateRepository.findById(1)).thenReturn(Optional.empty());

        Optional<CandidateDto> result = candidateService.getCandidateById(1);

        assertFalse(result.isPresent());
    }

    @Test
    void testSaveCandidate_WithNewSkills() {
        CandidateCreateDto dto = new CandidateCreateDto();
        dto.setFullName("Lazar");
        dto.setSkillNames(List.of("Java"));

        Candidate candidate = new Candidate();
        candidate.setId(1);
        candidate.setFullName("Lazar");
        candidate.setSkills(new ArrayList<>());

        when(skillRepository.findByName("Java")).thenReturn(Optional.empty());
        when(skillRepository.save(any(Skill.class))).thenReturn(new Skill("Java"));
        when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

        CandidateDto result = candidateService.saveCandidate(dto);

        assertNotNull(result);
        assertEquals("Lazar", result.getFullName());
        verify(skillRepository).save(any());
    }

    @Test
    void testUpdateCandidate_Success_WithSkills() {
        CandidateUpdateDto dto = new CandidateUpdateDto();
        dto.setFullName("Updated");
        dto.setSkillNames(List.of("C#"));
        
        Candidate existing = new Candidate();
        existing.setId(1);
        existing.setSkills(new ArrayList<>());

        when(candidateRepository.findById(1)).thenReturn(Optional.of(existing));
        when(skillRepository.findByName("C#")).thenReturn(Optional.empty());
        when(skillRepository.save(any())).thenReturn(new Skill("C#"));
        when(candidateRepository.save(any())).thenReturn(existing);

        Optional<CandidateDto> result = candidateService.updateCandidate(1, dto);

        assertTrue(result.isPresent());
        assertEquals("Updated", result.get().getFullName());
        verify(skillRepository).save(any());
    }

    @Test
    void testDeleteCandidate_True() {
        when(candidateRepository.existsById(1)).thenReturn(true);
        
        boolean deleted = candidateService.deleteCandidate(1);

        assertTrue(deleted);
        verify(candidateRepository).deleteById(1);
    }

    @Test
    void testDeleteCandidate_False() {
        when(candidateRepository.existsById(1)).thenReturn(false);

        boolean deleted = candidateService.deleteCandidate(1);

        assertFalse(deleted);
        verify(candidateRepository, never()).deleteById(anyInt());
    }

    @Test
    void testSearchByName() {
        Candidate c = new Candidate();
        c.setFullName("Lazar");
        c.setSkills(new ArrayList<>());
        when(candidateRepository.findByFullNameContaining("Laz")).thenReturn(List.of(c));

        List<CandidateDto> result = candidateService.searchByName("Laz");

        assertEquals(1, result.size());
        assertEquals("Lazar", result.get(0).getFullName());
    }

    @Test
    void testSearchBySkills() {
        Candidate c = new Candidate();
        c.setSkills(new ArrayList<>());
        when(candidateRepository.findAllByAnySkill(anyList())).thenReturn(List.of(c));

        List<CandidateDto> result = candidateService.searchBySkills(List.of("Java"));

        assertEquals(1, result.size());
    }

    @Test
    void testAddSkillToCandidate_ExistingSkill() {
        Candidate candidate = new Candidate();
        candidate.setSkills(new ArrayList<>());
        Skill skill = new Skill("Java");

        when(candidateRepository.findById(1)).thenReturn(Optional.of(candidate));
        when(skillRepository.findByName("Java")).thenReturn(Optional.of(skill));
        when(candidateRepository.save(any())).thenReturn(candidate);

        Optional<CandidateDto> result = candidateService.addSkillToCandidate(1, "Java");

        assertTrue(result.isPresent());
        assertTrue(candidate.getSkills().contains(skill));
    }

    @Test
    void testAddSkillToCandidate_AlreadyHasSkill() {
        Skill skill = new Skill("Java");
        Candidate candidate = new Candidate();
        candidate.setSkills(new ArrayList<>(List.of(skill)));

        when(candidateRepository.findById(1)).thenReturn(Optional.of(candidate));
        when(skillRepository.findByName("Java")).thenReturn(Optional.of(skill));

        Optional<CandidateDto> result = candidateService.addSkillToCandidate(1, "Java");

        assertTrue(result.isPresent());
        verify(candidateRepository, never()).save(any());
    }

    @Test
    void testAddSkillToCandidate_NotFound() {
        when(candidateRepository.findById(1)).thenReturn(Optional.empty());

        Optional<CandidateDto> result = candidateService.addSkillToCandidate(1, "Java");

        assertFalse(result.isPresent());
    }

    @Test
    void testRemoveSkillFromCandidate_Success() {
        Candidate candidate = new Candidate();
        Skill skill = new Skill("Java");
        skill.setId(10);
        candidate.setSkills(new ArrayList<>(List.of(skill)));

        when(candidateRepository.findById(1)).thenReturn(Optional.of(candidate));
        when(skillRepository.findById(10)).thenReturn(Optional.of(skill));
        when(candidateRepository.save(any())).thenReturn(candidate);

        Optional<CandidateDto> result = candidateService.removeSkillFromCandidate(1, 10);

        assertTrue(result.isPresent());
        assertFalse(candidate.getSkills().contains(skill));
    }

    @Test
    void testRemoveSkillFromCandidate_NotFound() {
        when(candidateRepository.findById(1)).thenReturn(Optional.empty());

        Optional<CandidateDto> result = candidateService.removeSkillFromCandidate(1, 10);

        assertFalse(result.isPresent());
    }

    @Test
    void testExistsById() {
        when(candidateRepository.existsById(1)).thenReturn(true);
        
        boolean exists = candidateService.existsById(1);

        assertTrue(exists);
    }
    
    @Test
    void testSaveCandidate_EmailAlreadyExists() {
        CandidateCreateDto dto = new CandidateCreateDto();
        dto.setEmail("duplicate@example.com");
        dto.setFullName("Lazar");

        when(candidateRepository.existsByEmail("duplicate@example.com")).thenReturn(true);

        CandidateDto result = candidateService.saveCandidate(dto);

        assertNull(result);
        verify(candidateRepository, never()).save(any(Candidate.class));
        verify(skillRepository, never()).save(any());
    }
}