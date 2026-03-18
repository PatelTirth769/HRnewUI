Create a single-page, interactive dashboard that visually presents all outcome-based content for the Department of Mechanical Engineering including Vision, Mission, PEOs, POs, PSOs, Course Outcomes, and CO-PO Mapping.

🗂️ Page Route:
/dashboard/outcome-board/mechanical

🧱 UI Structure Overview (Top to Bottom):
🔹 1. Department Dropdown
Select department (currently fixed: Mechanical Engineering)

🔽 Department: [Department of Mechanical Engineering ✅]

🔹 2. Institute Vision & Mission (Static Section)
📌 Vision:
“To emerge as a Centre of excellence in technical education with a blend of effective student-centric teaching-learning practices as well as research for the transformation of lives and community.”

📌 Mission:

M1: Provide the best class infrastructure to explore the field of engineering and research.

M2: Build a passionate and determined team of faculty with student-centric teaching, imbibing experiential and innovative skills.

M3: Imbibe lifelong learning skills, entrepreneurial skills and ethical values in students for addressing societal problems.

🔹 3. Department Vision & Mission
📌 Vision:
“To strive for making competent Mechanical Engineering Professionals to cater the real-time needs of Industry and Research Organizations of high repute with Entrepreneurial Skills and Ethical Values.”

📌 Mission:

M1: To train the students with State of Art Infrastructure to make them industry-ready professionals and to promote them for higher studies and research.

M2: To employ committed faculty for developing competent mechanical engineering graduates to deal with complex problems.

M3: To support the students in developing professionalism and make them socially committed mechanical engineers with morals and ethical values.

🔹 4. Program Educational Objectives (PEOs)
PEO1: Excel in profession with sound knowledge in mathematics and applied sciences.

PEO2: Demonstrate leadership qualities and team spirit in achieving goals.

PEO3: Pursue higher studies to ace in research and develop as entrepreneurs.

🔹 5. Program Specific Outcomes (PSOs)
PSO1: Apply knowledge of modern tools in manufacturing enabling to conquer the challenges of modern industry.

PSO2: Design various thermal engineering systems by applying the principles of thermal sciences.

PSO3: Design different mechanisms and machine components for transmission of power and automation in modern industry.

🔹 6. Program Outcomes (POs)
No.	Description
PO1	Apply knowledge of math, science, and engineering fundamentals to solve complex problems.
PO2	Identify, analyze, and conclude on complex problems using first principles.
PO3	Design solutions and systems considering public health, safety, and environment.
PO4	Conduct investigations using research-based methods and valid conclusions.
PO5	Use modern engineering tools, software, and equipment with understanding of limitations.
PO6	Apply contextual knowledge to assess societal, legal, and cultural issues.
PO7	Understand and demonstrate sustainable development practices.
PO8	Apply ethical principles and fulfill engineering responsibilities.
PO9	Work individually and in teams, including multidisciplinary settings.
PO10	Communicate effectively through reports, design docs, presentations.
PO11	Apply project and financial management knowledge in team projects.
PO12	Pursue lifelong learning amidst technological changes.

🔹 7. Course Outcomes (COs) — Operations Research (Open Elective - C314)
CO Code	Description
C314.1	Illustrate and solve linear programming problems.
C314.2	Solve transportation and assignment problems.
C314.3	Select a suitable sequencing and solve waiting line theory problems.
C314.4	Solve networking models and replacement problems.
C314.5	Analyze game theory & dynamic programming.

🔹 8. Mapping Table: COs → POs / PSOs
CO	PO1	PO2	PO3	PSO1
C314.1	3	3	2	3
C314.2	3	3	2	3
C314.3	3	3	2	3
C314.4	3	3	2	3
C314.5	3	3	2	3
Average	3.0	3.0	2.0	3.0

Legend:

3 = Strongly Correlated

2 = Moderately Correlated

1 = Weakly Correlated

🔹 9. CO Viewer Dropdown
Interactive dropdown with dynamic rendering of CO descriptions.

Dropdown Label: "Select CO"

Options:

C1 → shows C314.1

C2 → shows C314.2

C3 → shows C314.3

C4 → shows C314.4

C5 → shows C314.5

🛠️ Frontend & UI/UX (React + TailwindCSS)
Feature	Description
UI Design	Grid-based layout with sections wrapped in Tailwind cards and shadows
Responsive	Flex/grid layout collapses on mobile (stacked view)
Dropdowns	CO selector dropdown using @headlessui/react or simple select
Hover tooltips	For mapping table values and tabs
Animations	Smooth tab switch animations using Tailwind transition or Framer Motion
Componentized	Each section (Mission, COs, Mapping Table) is a separate reusable React component

🧩 Suggested React Component Tree
Copy
Edit
📁 OutcomeBoardPage
├── DepartmentDropdown.jsx
├── InstituteMission.jsx
├── DepartmentMission.jsx
├── PEOSection.jsx
├── PSOSection.jsx
├── POSection.jsx
├── COListSection.jsx
├── MappingTable.jsx
├── CODescriptionViewer.jsx
🧠 Notes for AI Developer:
All content is static for now, ideal to load from a JSON file or CMS/API in future.

Make all components fully reusable, with props-driven design.

Add basic accessibility (ARIA labels, keyboard support for dropdowns/tabs).

Use Tailwind utility classes only (no external CSS).

📌 Final Summary:
This single Outcome Board page for the Mechanical Department will:

Present all accreditation-relevant academic data

Help external evaluators and visitors easily explore content

Be modular and responsive

Require no authentication

Be a model page for other departments to follow later