package candidateManager.controllers;

import candidateManager.DTOs.SkillCreateDto;
import candidateManager.DTOs.SkillDto;
import candidateManager.DTOs.SkillUpdateDto;
import candidateManager.services.SkillService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SkillController.class)
class SkillControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SkillService skillService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetAllSkills() throws Exception {
        when(skillService.getAllSkills()).thenReturn(List.of(new SkillDto()));
        mockMvc.perform(get("/skills")).andExpect(status().isOk());
    }

    @Test
    void testGetSkillById_Found() throws Exception {
        SkillDto dto = new SkillDto();
        dto.setId(1);
        when(skillService.getSkillById(1)).thenReturn(Optional.of(dto));
        mockMvc.perform(get("/skills/id/1")).andExpect(status().isOk());
    }

    @Test
    void testGetSkillById_NotFound() throws Exception {
        when(skillService.getSkillById(1)).thenReturn(Optional.empty());
        mockMvc.perform(get("/skills/id/1")).andExpect(status().isNotFound());
    }

    @Test
    void testCreateSkill_Conflict() throws Exception {
        SkillCreateDto dto = new SkillCreateDto();
        dto.setName("Java");
        when(skillService.getSkillByName("Java")).thenReturn(Optional.of(new SkillDto()));

        mockMvc.perform(post("/skills/skill")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void testCreateSkill_Success() throws Exception {
        SkillCreateDto createDto = new SkillCreateDto();
        createDto.setName("NewSkill");
        SkillDto savedDto = new SkillDto();
        savedDto.setId(1);

        when(skillService.getSkillByName("NewSkill")).thenReturn(Optional.empty());
        when(skillService.saveSkill(any())).thenReturn(savedDto);

        mockMvc.perform(post("/skills/skill")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated());
    }

    @Test
    void testUpdateSkill_Success() throws Exception {
        SkillUpdateDto updateDto = new SkillUpdateDto();
        SkillDto resultDto = new SkillDto();
        resultDto.setId(1);

        when(skillService.updateSkill(eq(1), any())).thenReturn(Optional.of(resultDto));

        mockMvc.perform(put("/skills/id/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk());
    }

    @Test
    void testUpdateSkill_NotFound() throws Exception {
        when(skillService.updateSkill(eq(1), any())).thenReturn(Optional.empty());

        mockMvc.perform(put("/skills/id/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SkillUpdateDto())))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("could not be updated")));
    }

    @Test
    void testDeleteSkill_Success() throws Exception {
        when(skillService.deleteSkill(1)).thenReturn(true);
        mockMvc.perform(delete("/skills/id/1")).andExpect(status().isOk());
    }

    @Test
    void testDeleteSkill_NotFound() throws Exception {
        when(skillService.deleteSkill(1)).thenReturn(false);
        mockMvc.perform(delete("/skills/id/1"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("could not be deleted")));
    }

    @Test
    void testSearchByPrefix() throws Exception {
        when(skillService.searchByPrefix("jav")).thenReturn(List.of(new SkillDto()));
        mockMvc.perform(get("/skills/search").param("prefix", "jav"))
                .andExpect(status().isOk());
    }
}