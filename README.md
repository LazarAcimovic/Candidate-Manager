# Candidate Manager

A full-stack HR platform for adding, monitoring, and searching job candidates and their skills, built to streamline a company's recruitment workflow. The core goal was clean CRUD over candidates and skills, plus fast multi-criteria search by name and skill set.

---

## Technology Stack

| Layer                 | Technology                                      |
| --------------------- | ----------------------------------------------- |
| **Backend**           | Java 17, Spring Boot 3.2, Maven                 |
| **Persistence**       | Spring Data JPA (Hibernate)                     |
| **Database**          | PostgreSQL                                      |
| **API Documentation** | springdoc OpenAPI / Swagger UI                  |
| **Testing**           | JUnit 5, Mockito, Spring MockMvc                |
| **Frontend**          | React 18, TypeScript, Vite                      |
| **Global State**      | Zustand                                         |
| **Routing**           | React Router                                    |
| **API Communication** | Axios                                           |

---

## What It Does

The system manages two core entities — **Candidates** and **Skills** — in a **many-to-many** relationship.

Each candidate holds a full name, date of birth, contact number, email (unique), and a list of skills. Skills are reusable across candidates.

Key capabilities:

- Create, read, update, and delete candidates and skills.
- Attach skills to candidates and remove them.
- Search candidates by name (partial match) or by one or more required skills.
- Skill prefix search to power type-ahead on the client.
- Synchronized, navigation-persistent filtering across name and skills (see [Implementation Insights](#implementation-insights--challenges)).

---

## Architecture

### Backend — layered

A conventional Spring Boot layering with interfaces separating contracts from implementations:

```
Controller → Service (interface + impl) → Repository (Spring Data JPA) → PostgreSQL
```

- **Controllers** (`CandidateController`, `SkillController`) — REST endpoints returning appropriate HTTP status codes (`404` for missing resources, `409` on duplicate email/skill name).
- **Services** (`CandidateService` / `CandidateServiceImpl`, `SkillService` / `SkillServiceImpl`) — business logic, coded against interfaces.
- **Repositories** — Spring Data JPA interfaces over the entities.
- **DTOs** — separate create / update / read DTOs keep the JPA entities out of the API surface.
- **Config** — `OpenApiConfig` (Swagger metadata) and `WebConfig` (CORS for the Vite dev origin).
- Schema is managed by Hibernate (`spring.jpa.hibernate.ddl-auto=update`).

### Frontend — service-oriented SPA

Pages (`Home`, `AddCandidate`, `CandidateDetails`) consume a thin service layer (`services/candidateService.ts`, `services/skillService.ts`) built on a shared Axios client. Cross-cutting filter state lives in a Zustand store (`candidateStore`) rather than in components, so it survives navigation and keeps the name and skill filters in sync.

---

## Data Model

| Table | Columns |
| --- | --- |
| **candidate** | `id`, `full_name`, `date_of_birth`, `contact_number`, `email` (unique) |
| **skill** | `id`, `name` (unique) |
| **candidate_skill** | join table (`candidate_id`, `skill_id`) — the many-to-many link |

---

## REST API

Base URL (development): `http://localhost:8793`

### Candidates

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/candidates` | List all candidates |
| `GET` | `/candidates/id/{id}` | Get a candidate by ID |
| `POST` | `/candidates/candidate` | Create a candidate (`409` if the email exists) |
| `PUT` | `/candidates/id/{id}` | Update a candidate |
| `DELETE` | `/candidates/id/{id}` | Delete a candidate |
| `GET` | `/candidates/search/name?name=` | Search candidates by name (partial match) |
| `GET` | `/candidates/search/skills?skillNames=` | Search candidates by one or more skills |
| `POST` | `/candidates/{candidateId}/skill/{skillName}` | Add a skill to a candidate |
| `DELETE` | `/candidates/{candidateId}/skill/{skillId}` | Remove a skill from a candidate |

### Skills

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/skills` | List all skills |
| `GET` | `/skills/id/{id}` | Get a skill by ID |
| `GET` | `/skills/search?prefix=` | Prefix search (type-ahead) |
| `POST` | `/skills/skill` | Create a skill (`409` if the name exists) |
| `PUT` | `/skills/id/{id}` | Update a skill |
| `DELETE` | `/skills/id/{id}` | Delete a skill |

All endpoints are documented and testable via **Swagger UI** at `http://localhost:8793/swagger-ui.html`.

---

## Getting Started

### Prerequisites

- [JDK 17+](https://adoptium.net/)
- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/)

### 1. Database

Create a PostgreSQL database named `hr_platform`. Hibernate creates and updates the tables on startup (`ddl-auto=update`). Adjust the datasource in `backend/Candidate_Manager_backend/src/main/resources/application.properties` if your credentials differ:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/hr_platform
spring.datasource.username=postgres
spring.datasource.password=postgres
```

### 2. Backend

```bash
cd backend/Candidate_Manager_backend
./mvnw spring-boot:run
```

The API starts on `http://localhost:8793`, with Swagger UI at `http://localhost:8793/swagger-ui.html`.

### 3. Frontend

```bash
cd frontend/candidate_manager_frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` (the origin allowed by the backend's CORS configuration). The API base URL is configured in `src/services/apiClient.ts`.

---

## Implementation Insights & Challenges

Two problems required the most thought on this project — not because they were complicated in the same way, but because each forced a different kind of thinking.

### 1. Synchronized multi-criteria filtering (name & skills)

The filtering system originally treated name and skill searches as completely separate operations with no awareness of each other. The problem surfaced quickly during testing: searching for "Lazar" and then adding "React" as a skill filter would drop the name entirely — suddenly you were looking at every React developer, regardless of name.

The fix was to stop letting either filter work in isolation. **Zustand** holds both `nameFilter` and `skillsFilter` in a centralized store at all times, so every search action has the full picture before it does anything.

How it works now: skill-based queries still hit the server, but if a name filter is present it is applied on the client immediately after the results come back. It's a small distinction, but it means the two filters always produce an **intersection** rather than overwriting each other.

I chose this approach because filters that reset one another are frustrating — the whole point of multiple criteria is to narrow things down *together*. It also pushed me to think more carefully about where state lives and how different parts of the UI stay in sync.

### 2. Persistent filter state during navigation

Filter state was originally stored inside the `SearchSection` component, which seemed fine at first. The issue appeared during navigation: filter for specific candidates, click into a details page, hit back — and everything was gone. The component had unmounted and taken all filter context with it. From the user's perspective, the app simply forgot what they were doing.

The fix was architectural: move the source of truth for filters out of the component and into the global **Zustand** store. Lifting `nameFilter` and `skillsFilter` into `candidateStore` means those values outlive the component, so navigation no longer clears them.

The other half was making `fetchCandidates` aware of the store's current state — instead of always running a plain `getAll()`, it reads the existing filter values on initialization. So when a user returns from a details page, the store still holds their previous criteria and the filtered fetch runs automatically.

Storing UI intent locally in a component always felt like the wrong place for something that needed to survive navigation. Moving it to the global store also simplified the component and made the filtering logic reusable across the app rather than tied to one place.

---

## Testing Strategy

Tests are written at two levels:

- **Service layer** — unit tests using Mockito to mock repository dependencies, covering business logic in isolation.
- **REST layer** — integration tests using `@SpringBootTest` and `MockMvc`, covering controller behavior and HTTP response codes.

---

## Project demo

https://github.com/user-attachments/assets/5492a444-57b1-466d-b6b8-c0cf211c9183

https://github.com/user-attachments/assets/d62a659f-74cc-4120-b315-5a148f8c023b
