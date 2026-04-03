package candidateManager.models;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "skill")
public class Skill implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, unique = true)
    private String name;

    @JsonIgnore
    @ManyToMany(mappedBy = "skills")
    private List<Candidate> candidates;

    public Skill() {}

    public Skill(String name) {
        this.name = name;
    }

    public int getId() { return id; }
    
    public void setId(int id) { this.id = id; }
    
    public String getName() { return name; }
    
    public void setName(String name) { this.name = name; }
    
    public List<Candidate> getCandidates() { return candidates; }
    
    public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }
}
