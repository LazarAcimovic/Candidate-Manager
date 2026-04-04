package candidateManager.controllers;

import candidateManager.DTOs.CandidateCreateDto;
import candidateManager.DTOs.CandidateDto;
import candidateManager.DTOs.CandidateUpdateDto;
import candidateManager.services.CandidateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/candidate")
@CrossOrigin
public class CandidateController {

    @Autowired
    private CandidateService candidateService;

    @GetMapping
    public List<CandidateDto> getAll() {
        return candidateService.getAllCandidates();
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<?> getCandidateById(@PathVariable int id) {
        Optional<CandidateDto> candidate = candidateService.getCandidateById(id);
        if (candidate.isPresent()) {
            return ResponseEntity.ok(candidate.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Candidate with requested ID: " + id + " does not exist");
    }

    @PostMapping
    public ResponseEntity<?> createCandidate(@RequestBody CandidateCreateDto dto) {
        CandidateDto savedCandidate = candidateService.saveCandidate(dto);
        URI uri = URI.create("/candidate/id/" + savedCandidate.getId());
        return ResponseEntity.created(uri).body(savedCandidate);
    }

    @PutMapping("/id/{id}")
    public ResponseEntity<?> updateCandidate(@PathVariable int id, @RequestBody CandidateUpdateDto dto) {
        Optional<CandidateDto> updated = candidateService.updateCandidate(id, dto);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Candidate with requested ID: " + id + " could not be updated because it doesn't exist");
    }

    @DeleteMapping("/id/{id}")
    public ResponseEntity<?> deleteCandidate(@PathVariable int id) {
        if (candidateService.deleteCandidate(id)) {
            return ResponseEntity.ok("Candidate with ID: " + id + " has been successfully deleted");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Candidate with requested ID: " + id + " could not be deleted because it doesn't exist");
    }

    @GetMapping("/search/name")
    public ResponseEntity<?> searchCandidateByName(@RequestParam String name) {
        List<CandidateDto> candidates = candidateService.searchByName(name);
        if (candidates.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No candidates found with name containing: " + name);
        }
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/search/skills")
    public ResponseEntity<?> searchCandidateBySkills(@RequestParam List<String> skillNames) {
        List<CandidateDto> candidates = candidateService.searchBySkills(skillNames);
        if (candidates.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No candidates found with the specified skills");
        }
        return ResponseEntity.ok(candidates);
    }

    @PostMapping("/{candidateId}/skill/{skillId}")
    public ResponseEntity<?> addSkillToCandidate(@PathVariable int candidateId, @PathVariable int skillId) {
        Optional<CandidateDto> updated = candidateService.addSkillToCandidate(candidateId, skillId);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Could not add skill. Candidate ID: " + candidateId + " or Skill ID: " + skillId + " not found");
    }

    @DeleteMapping("/{candidateId}/skill/{skillId}")
    public ResponseEntity<?> removeSkillFromCandidate(@PathVariable int candidateId, @PathVariable int skillId) {
        Optional<CandidateDto> updated = candidateService.removeSkillFromCandidate(candidateId, skillId);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Could not remove skill. Candidate ID: " + candidateId + " or Skill ID: " + skillId + " not found");
    }
}