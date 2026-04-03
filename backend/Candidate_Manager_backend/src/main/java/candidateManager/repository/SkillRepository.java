package candidateManager.repository;

import candidateManager.models.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Integer> {

    @Query(value = "SELECT * FROM skill WHERE LOWER(name) = LOWER(:name)", nativeQuery = true)
    Optional<Skill> findByName(@Param("name") String name);

    @Query(value = "SELECT * FROM skill WHERE LOWER(name) LIKE LOWER(:prefix || '%')", nativeQuery = true)
    List<Skill> findByPrefix(@Param("prefix") String prefix);
}