package candidateManager.controllers;

import candidateManager.DTOs.SkillCreateDto;
import candidateManager.DTOs.SkillDto;
import candidateManager.DTOs.SkillUpdateDto;
import candidateManager.services.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/skills")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @GetMapping
    public List<SkillDto> getAllSkills() {
        return skillService.getAllSkills();
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<?> getSkillById(@PathVariable int id) {
        Optional<SkillDto> skill = skillService.getSkillById(id);
        if (skill.isPresent()) {
            return ResponseEntity.ok(skill.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Skill with requested ID: " + id + " does not exist");
    }

    @GetMapping("/search")
    public ResponseEntity<?> getSkillsByPrefix(@RequestParam String prefix) {
        List<SkillDto> skills = skillService.searchByPrefix(prefix);
        return ResponseEntity.ok(skills);
    }

    @PostMapping("/skill")
    public ResponseEntity<?> createSkill(@RequestBody SkillCreateDto dto) {
        if (skillService.getSkillByName(dto.getName()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Skill with name '" + dto.getName() + "' already exists");
        }
        SkillDto savedSkill = skillService.saveSkill(dto);
        URI uri = URI.create("/skill/id/" + savedSkill.getId());
        return ResponseEntity.created(uri).body(savedSkill);
    }

    @PutMapping("/id/{id}")
    public ResponseEntity<?> updateSkill(@PathVariable int id, @RequestBody SkillUpdateDto dto) {
        Optional<SkillDto> updated = skillService.updateSkill(id, dto);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Resource with requested ID: " + id + " could not be updated because it doesn't exist");
    }

    @DeleteMapping("/id/{id}")
    public ResponseEntity<?> deleteSkill(@PathVariable int id) {
        if (skillService.deleteSkill(id)) {
            return ResponseEntity.ok("Resource with ID: " + id + " has been successfully deleted");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Resource with requested ID: " + id + " could not be deleted because it doesn't exist");
    }
}