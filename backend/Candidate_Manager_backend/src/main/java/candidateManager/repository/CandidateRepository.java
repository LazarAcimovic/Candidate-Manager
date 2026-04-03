package candidateManager.repository;

import candidateManager.models.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Integer> {

    @Query(value = "SELECT * FROM candidate WHERE LOWER(full_name) LIKE LOWER('%' || :name || '%')", 
           nativeQuery = true)
    List<Candidate> findByFullNameContaining(@Param("name") String name);

    @Query(value = "SELECT DISTINCT c.* FROM candidate c " +
                   "JOIN candidate_skill cs ON c.id = cs.candidate_id " +
                   "JOIN skill s ON s.id = cs.skill_id " +
                   "WHERE LOWER(s.name) = LOWER(:skillName)", 
           nativeQuery = true)
    List<Candidate> findAllBySkillName(@Param("skillName") String skillName);
    
    @Query(value = "SELECT DISTINCT c.* FROM candidate c " +
                   "JOIN candidate_skill cs ON c.id = cs.candidate_id " +
                   "JOIN skill s ON s.id = cs.skill_id " +
                   "WHERE s.name IN :skillNames", 
           nativeQuery = true)
    List<Candidate> findAllByAnySkill(@Param("skillNames") List<String> skillNames);
}