# Stage 1 — build the executable jar
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY backend/Candidate_Manager_backend/pom.xml .
RUN mvn -q -B dependency:go-offline
COPY backend/Candidate_Manager_backend/src ./src
RUN mvn -q -B -DskipTests clean package

# Stage 2 — run it
FROM eclipse-temurin:17-jre 
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
# server.port=${PORT:${SERVER_PORT:8793}} in application.properties, so the
# app binds Railway's injected PORT automatically; 8793 is the local default.
EXPOSE 8793
ENTRYPOINT ["java", "-jar", "app.jar"]
