package candidateManager.controllers;

import candidateManager.DTOs.CandidateCreateDto;
import candidateManager.DTOs.CandidateDto;
import candidateManager.DTOs.CandidateUpdateDto;
import candidateManager.repository.CandidateRepository;
import candidateManager.services.CandidateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CandidateController.class)
class CandidateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CandidateService candidateService;
    
    @MockBean
    private CandidateRepository candidateRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetAll() throws Exception {
        CandidateDto dto = new CandidateDto();
        dto.setId(1);
        dto.setFullName("Lazar Acimovic");
        
        when(candidateService.getAllCandidates()).thenReturn(List.of(dto));

        mockMvc.perform(get("/candidates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Lazar Acimovic"));
    }

    @Test
    void testGetCandidateById_Found() throws Exception {
        CandidateDto dto = new CandidateDto();
        dto.setId(1);
        when(candidateService.getCandidateById(1)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/candidates/id/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void testGetCandidateById_NotFound() throws Exception {
        when(candidateService.getCandidateById(1)).thenReturn(Optional.empty());

        mockMvc.perform(get("/candidates/id/1"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("does not exist")));
    }

    @Test
    void testCreateCandidate() throws Exception {
        CandidateCreateDto createDto = new CandidateCreateDto();
        createDto.setFullName("Test");
        createDto.setEmail("test@gmail.com");     
        CandidateDto savedDto = new CandidateDto();
        savedDto.setId(1);
        savedDto.setFullName("Test");

        when(candidateService.saveCandidate(any())).thenReturn(savedDto);

        mockMvc.perform(post("/candidates/candidate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/candidate/1")); 
    }
    @Test
    void testUpdateCandidate_Success() throws Exception {
        CandidateUpdateDto updateDto = new CandidateUpdateDto();
        CandidateDto resultDto = new CandidateDto();
        resultDto.setId(1);

        when(candidateService.updateCandidate(eq(1), any())).thenReturn(Optional.of(resultDto));

        mockMvc.perform(put("/candidates/id/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk());
    }

    @Test
    void testUpdateCandidate_NotFound() throws Exception {
        when(candidateService.updateCandidate(eq(1), any())).thenReturn(Optional.empty());

        mockMvc.perform(put("/candidates/id/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CandidateUpdateDto())))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteCandidate_Success() throws Exception {
        when(candidateService.deleteCandidate(1)).thenReturn(true);

        mockMvc.perform(delete("/candidates/id/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testDeleteCandidate_NotFound() throws Exception {
        when(candidateService.deleteCandidate(1)).thenReturn(false);

        mockMvc.perform(delete("/candidates/id/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testSearchByName_Found() throws Exception {
        when(candidateService.searchByName("Lazar")).thenReturn(List.of(new CandidateDto()));

        mockMvc.perform(get("/candidates/search/name").param("name", "Lazar"))
                .andExpect(status().isOk());
    }

    @Test
    void testSearchByName_Empty() throws Exception {
        when(candidateService.searchByName("Lazar")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/candidates/search/name").param("name", "Lazar"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testSearchBySkills_Found() throws Exception {
        when(candidateService.searchBySkills(anyList())).thenReturn(List.of(new CandidateDto()));

        mockMvc.perform(get("/candidates/search/skills").param("skillNames", "Java,React"))
                .andExpect(status().isOk());
    }

    @Test
    void testSearchBySkills_Empty() throws Exception {
        when(candidateService.searchBySkills(anyList())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/candidates/search/skills").param("skillNames", "NonExistent"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("No candidates found")));
    }

    @Test
    void testAddSkill_Success() throws Exception {
        when(candidateService.addSkillToCandidate(1, "Java")).thenReturn(Optional.of(new CandidateDto()));

        mockMvc.perform(post("/candidates/1/skill/Java"))
                .andExpect(status().isOk());
    }

    @Test
    void testRemoveSkill_Success() throws Exception {
        when(candidateService.removeSkillFromCandidate(1, 10)).thenReturn(Optional.of(new CandidateDto()));

        mockMvc.perform(delete("/candidates/1/skill/10"))
                .andExpect(status().isOk());
    }

    @Test
    void testRemoveSkill_NotFound() throws Exception {
        when(candidateService.removeSkillFromCandidate(1, 10)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/candidates/1/skill/10"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("Could not remove skill")));
    }
    
    @Test
    void testAddSkill_CandidateNotFound() throws Exception {
        when(candidateService.addSkillToCandidate(eq(1), anyString())).thenReturn(Optional.empty());

        mockMvc.perform(post("/candidates/1/skill/Java"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("Candidate with ID: 1 not found")));
    }
    
    
}