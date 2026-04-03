package candidateManager.models;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "candidate")
public class Candidate implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false)
    private String contactNumber;

    @Column(nullable = false, unique = true)
    private String email;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "candidate_skill",
        joinColumns = @JoinColumn(name = "candidate_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private List<Skill> skills;

    public Candidate() {}

    public int getId() { return id; }
    
    public void setId(int id) { this.id = id; }
    
    public String getFullName() { return fullName; }
    
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public String getContactNumber() { return contactNumber; }
    
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    
    public String getEmail() { return email; }
    
    public void setEmail(String email) { this.email = email; }
    
    public List<Skill> getSkills() { return skills; }
    
    public void setSkills(List<Skill> skills) { this.skills = skills; }
}