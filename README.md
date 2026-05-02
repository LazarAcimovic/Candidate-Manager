# Candidate Manager

A fullstack HR platform for adding and monitoring job candidates and their skills in order to facilitate HR processes within a company. The main goal was to enable adding, updating, deleting and searching job candidates and their skills.

---

## Technology Stack

| Layer                 | Technology                       |
| --------------------- | -------------------------------- |
| **Backend**           | Java 17+, Spring Boot 3.x, Maven |
| **Database**          | PostgreSQL                       |
| **API Documentation** | Swagger / OpenAPI                |
| **Testing**           | JUnit 5, Mockito                 |
| **Frontend**          | React.js, TypeScript             |
| **Global State**      | Zustand                          |
| **API Communication** | Axios                            |

---

## What It Does

The system manages two core entities - **Candidates** and **Skills** - with a many-to-many relationship between them.

Each candidate holds: full name, date of birth, contact number, email, and a list of skills. Skills are reusable across candidates.

### REST API Operations

| Operation                     | Endpoint                                   |
| ----------------------------- | ------------------------------------------ |
| Add candidate                 | `POST /candidates`                         |
| Update candidate              | `PUT /candidates/{id}`                     |
| Delete candidate              | `DELETE /candidates/{id}`                  |
| Add skill                     | `POST /skills`                             |
| Add skill to candidate        | `PUT /candidates/{id}/skills/{skillId}`    |
| Remove skill from candidate   | `DELETE /candidates/{id}/skills/{skillId}` |
| Search candidate by name      | `GET /candidates/search?name=`             |
| Search candidates by skill(s) | `GET /candidates/search?skills=`           |

All endpoints are documented and testable via the **Swagger UI** at `http://localhost:8080/swagger-ui.html`.

---

## Implementation Insights & Challenges

Two problems ended up requiring the most thought on this project - not because they were complicated in the same way, but because each forced a different kind of thinking.

### 1. Synchronized Multi-Criteria Filtering (Name & Skills)

The filtering system originally treated name and skill searches as completely separate operations with no awareness of each other. The problem showed up during testing pretty quickly: searching for "Lazar" and then adding "React" as a skill filter would just drop the name - suddenly you're looking at every React developer regardless of a name.

The fix was to stop letting either filter work in isolation. I brought in **Zustand** as a centralized store holding both `nameFilter` and `skillsFilter` at all times, so every search action has the full picture before it does anything.

The way it works now: skill-based queries still hit the server, but if a name filter is present, it gets applied on the client side immediately after the results come back. It's a small distinction, but it means the two filters always produce an intersection rather than overwriting each other.

I chose this approach because filters that reset each other are frustrating - the whole point of multiple criteria is to narrow things down _together_. It also pushed me to think more carefully about where state lives and how different parts of the UI stay in sync, which turned out to be one of the more useful things I worked through on this project.

### 2. Persistent Filter State During Navigation

Filter state was originally stored inside the `SearchSection` component, which seemed fine at first. The issue appeared during navigation - filter for specific candidates, click into a details page, hit back, and everything's gone. The component had unmounted and taken all filter context with it. From a user's perspective, the app just forgot what you were doing.

The fix was an architectural one: move the source of truth for filters out of the component entirely and into the global **Zustand** store. Lifting `nameFilter` and `skillsFilter` into `candidateStore` means those values now outlive the component and navigation doesn't have an impact on them.

The other half was making `fetchCandidates` aware of the store's current state - instead of always running a plain `getAll()`, it now reads the existing filter values on initialization. So when a user comes back from a details page, the store still holds their previous criteria and the filtered fetch runs automatically.

Storing UI intent locally inside a component always felt like the wrong place for something that needed to survive navigation. Moving it to the global store also cleaned up the component itself and made the filtering logic reusable across the app rather than tied to one specific component. It was one of those decisions that felt like extra work upfront but made everything simpler afterward.

---

## Testing Strategy

Tests are written at two levels:

- **Service layer** - unit tests using Mockito to mock repository dependencies, covering business logic in isolation
- **REST layer** - integration tests using `@SpringBootTest` and `MockMvc`, covering controller behavior and HTTP response codes

---

## Project demo
