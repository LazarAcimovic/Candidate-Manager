-- Idempotent sample data for local development.
-- Running this script again always yields the same clean result, so it
-- also repairs corrupted local data. Table/column names per docs/DB.md §2
-- (all singular). Ids are left to auto-generate; RESTART IDENTITY makes
-- them deterministic (skills 1..6, candidates 1..5).

TRUNCATE TABLE candidate_skill, candidate, skill RESTART IDENTITY CASCADE;

INSERT INTO skill (name) VALUES
  ('Java'),
  ('Spring Boot'),
  ('PostgreSQL'),
  ('React'),
  ('TypeScript'),
  ('Docker');

INSERT INTO candidate (full_name, date_of_birth, contact_number, email) VALUES
  ('Ana Markovic',      '1994-03-12', '+381641234567', 'ana.markovic@example.com'),
  ('Marko Petrovic',    '1990-07-25', '+381651234568', 'marko.petrovic@example.com'),
  ('Jelena Nikolic',    '1998-11-02', '+381661234569', 'jelena.nikolic@example.com'),
  ('Stefan Jovanovic',  '1988-01-19', '+381671234570', 'stefan.jovanovic@example.com'),
  ('Milica Ilic',       '1996-05-30', '+381681234571', 'milica.ilic@example.com');

-- (candidate_id, skill_id) links; ids match the deterministic insert order.
INSERT INTO candidate_skill (candidate_id, skill_id) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 1), (2, 6),
  (3, 4), (3, 5),
  (4, 1), (4, 2), (4, 3), (4, 6),
  (5, 4), (5, 5), (5, 6);
