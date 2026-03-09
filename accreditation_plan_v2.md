# Canvas LMS Accreditation Module — Functional Specification
**Universal Course Accreditation Tool**
Version 2.0 | March 2026

---

## Table of Contents
1. [Design Philosophy](#1-design-philosophy)
2. [Framework Layer](#2-framework-layer)
3. [Step-by-Step Workflow](#3-step-by-step-workflow)
4. [AI Standards Discovery Engine](#4-ai-standards-discovery-engine)
5. [Data Model](#5-data-model)
6. [AI Behavior Specifications](#6-ai-behavior-specifications)
7. [UI Integration in Canvas Bulk Editor](#7-ui-integration-in-canvas-bulk-editor)
8. [ASL / Deaf Ed / Interpreter Education — Reference Implementation](#8-asl--deaf-ed--interpreter-education--reference-implementation)
9. [Out of Scope / v2 Considerations](#9-out-of-scope--v2-considerations)

---

## 1. Design Philosophy

### What This Tool Is

This module implements a **standards-driven course design workflow** embedded within the Canvas LMS Bulk Editor. It works for **any academic discipline, at any institution level, in any delivery mode**. The system does not maintain a hardcoded library of accreditation standards. Instead, it uses AI to discover, retrieve, and apply the standards relevant to a specific course context at the time of use.

This matters for two reasons:

1. **Breadth:** There are hundreds of accreditation bodies across disciplines — AACSB (business), ABET (engineering), ACEN/CCNE (nursing), CAEP (teacher education), CSWE (social work), ABA (law), LCME (medicine), ACPE (pharmacy), NASD (art/design), and hundreds more — each with their own standards, sub-standards, and specialty tracks. No static lookup table can represent this accurately.

2. **Change:** Accreditation bodies update their standards on their own schedules, independent of any software release cycle. A tool that hardcodes standards will be wrong the moment any body publishes a revision. The AI discovery layer must retrieve current standards at the time of use, not from a cached internal registry.

### What This Tool Is Not

- It is not a periodic compliance audit tool
- It is not discipline-specific
- It is not a static rubric library
- It does not submit courses to accreditation bodies for review
- It does not replace institutional accreditation processes

### Core Pipeline

All design decisions flow through this dependency chain. Every layer depends on the layer above it. The data model must preserve these relationships — a course outcome cannot exist without a standards mapping, and a rubric criterion cannot exist without an outcome.

```
FRAMEWORK LAYER (always active)
    ├── QM     (course design quality framework)
    └── ACTFL  (proficiency framework — language disciplines only)
                        ↓
        AI DISCOVERS applicable accreditation standards
        based on discipline, level, delivery mode, institution type
                        ↓
            Course Outcomes  (mapped to discovered standards)
                        ↓
       Rubrics / Activity Descriptions  (derived from outcomes)
                        ↓
    Syllabus, Assignments, Assessments, Activities, Pages
                        ↓
            Accommodations  (applied at the content layer)
```

### Key Design Constraints

- **Standards are upstream of content.** A course imported from a previous semester must trigger a re-alignment check against current standards, not simply carry forward prior mappings.
- **The pipeline is a dependency chain, not a checklist.** Traceability from standard → outcome → evidence must be preserved at every step.
- **The system must handle unknown standards gracefully.** Any accreditation body, in any discipline, must be representable in the data model — including ones the system has never encountered before.
- **Standards change.** Every standards node carries a version and retrieval timestamp. Drift detection is a first-class feature.

---

## 2. Framework Layer

Two frameworks sit above all discipline-specific standards. They are not selected by the teacher — they are always present.

### 2.1 Quality Matters (QM)

**Role:** Course design quality framework. Governs how online and hybrid courses are structured regardless of discipline. The QM Higher Ed Rubric (7th Edition) provides 8 General Standards and 44 Specific Review Standards that run as a persistent alignment layer throughout the course-building experience.

**Activation:** QM activates automatically when the teacher selects Online or Hybrid delivery mode. It is not a selectable option.

**Scope:** QM is discipline-agnostic. It applies to a nursing course, a business course, an ASL course, and an engineering course identically. Its standards govern design quality, not content.

**Persistence:** Once activated, QM's Essential Standards run as a real-time background checklist throughout all subsequent steps. Every outcome written, every assignment designed, every page added is evaluated against QM alignment continuously — not as a post-hoc review.

**Copyright constraint:** The QM Rubric and its annotations are copyrighted by Quality Matters. The system must not embed or reproduce full rubric text. Store QM standard IDs and short descriptors as reference mappings only. Full annotated rubric access requires a QM institutional membership account.

**QM 7th Edition — 8 General Standards:**

| ID | General Standard |
|----|-----------------|
| QM-1 | Course Overview and Introduction |
| QM-2 | Learning Objectives (Competencies) |
| QM-3 | Assessment and Measurement |
| QM-4 | Instructional Materials |
| QM-5 | Learning Activities and Learner Interaction |
| QM-6 | Course Technology |
| QM-7 | Learner Support |
| QM-8 | Accessibility and Usability |

**QM Certification threshold:** All 22 Essential Standards (3-point SRS) must be met AND overall score ≥ 85% (86/101 points). Certification valid for 5 years.

> **Note for K-12:** QM Higher Ed Rubric applies to post-secondary online/hybrid courses only. K-12 online courses use the QM K-12 Rubric, which is a separate instrument. Institution level selection (Step 1) determines which QM rubric activates.

### 2.2 ACTFL (Language Disciplines Only)

**Role:** Parent proficiency framework for any course involving language acquisition or instruction. Proficiency descriptors (Novice / Intermediate / Advanced / Superior, with sub-levels) are the common language connecting all language proficiency assessment instruments to course outcomes.

**Activation:** ACTFL activates automatically when the AI identifies the course as involving language instruction or proficiency — spoken, signed, or written. It does not activate for non-language disciplines.

**Why it sits at the framework layer:** Every language proficiency assessment instrument — oral proficiency interviews, sign language proficiency interviews, state certification exams — is either derived from or aligned to the ACTFL/ETS framework. ACTFL is the root; the instruments are derived nodes.

---

## 3. Step-by-Step Workflow

### Step 1 — Select Institution Level

The teacher identifies the educational level at which the course will be delivered. This gates standards applicability and determines which QM rubric activates.

| Level | QM Rubric | Notes |
|-------|-----------|-------|
| Elementary (K–5) | QM K-12 Rubric | If online/hybrid |
| Middle School (6–8) | QM K-12 Rubric | If online/hybrid |
| High School (9–12) | QM K-12 Rubric | If online/hybrid |
| Post-Secondary (2-year) | QM Higher Ed 7th Ed | If online/hybrid |
| Post-Secondary (4-year) | QM Higher Ed 7th Ed | If online/hybrid |
| Graduate | QM Higher Ed 7th Ed | If online/hybrid |
| Continuing Education | QM Higher Ed 7th Ed | 7th Ed includes CE formats |

---

### Step 2 — Select Course Delivery Mode

Collected early because it activates QM and shapes the standards landscape.

| Mode | QM Status | Notes |
|------|-----------|-------|
| Face-to-Face | Best practices apply; certification not required | Discipline standards still fully apply |
| Online Asynchronous | **QM activated** | Full 8 General Standards, 44 Specific Review Standards |
| Online Synchronous | **QM activated** | 7th Ed explicitly includes synchronous formats |
| Hybrid / HyFlex | **QM activated** | Course Format Chart governs applicability |

---

### Step 3 — Describe the Course

The teacher provides course context that the AI uses to discover applicable standards. This is not a dropdown menu from a fixed list — it is descriptive input that the AI interprets.

**Required inputs:**
- **Discipline / Subject Area** — free text (e.g., "Nursing", "Civil Engineering", "American Sign Language", "Social Work", "Business Administration")
- **Degree / Certificate Program** — free text (e.g., "BSN", "MS in Structural Engineering", "AAS in Sign Language Interpreting")
- **Course Title and Description** — pulled from Canvas course metadata; editable
- **Institution Type** — Community College / 4-Year University / Graduate / K-12 / Vocational/Technical / Continuing Ed

**Optional inputs that improve AI accuracy:**
- Accreditation bodies the institution is already affiliated with (e.g., "We are AACSB-accredited")
- State or region (relevant for state-specific licensing standards)
- Whether the program leads to licensure or certification
- Specific certifications students are expected to pursue upon completion

---

### Step 4 — AI Standards Discovery

This is the core step. The AI uses the course context from Step 3 to discover, retrieve, and surface applicable accreditation standards. See [Section 4](#4-ai-standards-discovery-engine) for full AI engine specification.

**What the AI produces:**
- A ranked list of applicable accreditation bodies and their standards
- Classification of each standard as Required (based on program context) or Recommended
- Rationale for each recommendation
- Source URL and version/date for each standard retrieved
- Confidence indicator for each recommendation

**Teacher interaction:**
- Confirm required standards (pre-selected, but visible and reviewable)
- Accept, reject, or modify recommended standards
- Manually search for and add standards not surfaced by AI
- The full standards discovery interface is always accessible — AI suggestions are a starting point, not a ceiling

---

### Step 5 — Proficiency Target Selection (Language Disciplines)

*This step is skipped for non-language disciplines.*

For courses involving language instruction or proficiency, the teacher sets target proficiency levels. The AI pre-populates these based on course level and program context.

- Proficiency targets are expressed first in ACTFL terms (the common framework)
- Then mapped to the specific assessment instrument(s) relevant to the discipline and state
- Multiple instruments may be relevant (e.g., ASLPI for ASL teachers AND BEI Basic for interpreter program outcomes)

---

### Step 6 — Outcomes Generation

Based on confirmed standards, the AI drafts course-level and module-level learning outcomes. Each outcome must be:

- **Mapped** — linked to one or more specific standard IDs
- **Measurable** — phrased using Bloom's taxonomy action verbs; vague constructions ("understand", "appreciate", "be aware of") are flagged
- **Anchored** (language disciplines) — tied to a proficiency target in ACTFL terms and relevant instrument scale
- **QM-aligned** — satisfies QM 2.1 (course-level) and QM 2.2 (module-level) requirements when QM is active
- **Editable** — instructor modifies AI-generated outcomes and adds custom ones; standards traceability updates on save

---

### Step 7 — Content and Assessment Alignment

Using confirmed outcomes, the AI analyzes existing Canvas content items (for imported courses) and flags gaps where no content addresses a required standard or outcome.

**For new courses:** AI suggests content types and activities appropriate to each standard and outcome.

**For imported courses:** Existing items are analyzed against the current standard set. Items previously mapped to an outdated standard version are flagged for review.

**Gap detection produces:**
- Standards with no content item mapped to them
- Outcomes with no associated assessment
- Assessments that lack a rubric where one is feasible
- QM Essential Standard gaps
- Version drift flags on previously mapped items

---

### Step 8 — Rubric and Activity Description Generation

For each assessment or activity aligned to a standard, the system generates either a **rubric** or an **activity description**.

**Rubric** — when structured scoring criteria apply. Criteria rows are derived from the specific outcome and standard. Performance level columns are calibrated to the relevant scale (ACTFL, instrument-specific, accreditation body rubric descriptors).

**Activity Description** — when holistic or observational assessment is more appropriate. Includes: purpose statement, connection to standard(s), participation expectations, documentation requirements.

**Decision logic:**
- If the standard specifies measurable performance criteria → rubric
- If the standard specifies process, participation, or reflection → activity description
- If ambiguous → AI recommends rubric with a note that activity description is also appropriate; instructor chooses

---

## 4. AI Standards Discovery Engine

This section specifies how the AI finds, retrieves, and presents accreditation standards. This is the core differentiating capability of the tool.

### 4.1 Discovery Strategy

The AI must not rely on a static internal database of standards. Standards change, new accreditation bodies emerge, and the universe of disciplines is too broad for any hardcoded registry to be authoritative. The discovery process works as follows:

**Layer 1 — Institutional context matching**
If the institution has declared affiliation with specific accreditation bodies (provided in Step 3), those bodies' standards are retrieved first and marked as institutionally confirmed.

**Layer 2 — Discipline-to-accreditor mapping (AI inference)**
The AI identifies the most likely accreditation bodies for the stated discipline, degree level, and institution type. This inference is based on:
- Discipline / subject area text
- Degree type and level
- Whether the program leads to licensure or certification
- Institution type
- State / region (for state licensing boards)

**Layer 3 — Standards retrieval**
For each identified accreditation body, the AI retrieves current standards documentation. Retrieved standards are stored temporarily with source URL, version, and retrieval timestamp. They are not permanently cached — retrieval happens at the time of course setup to ensure currency.

**Layer 4 — Relevance ranking**
Retrieved standards are ranked by relevance to the specific course (not just the program). Course title, description, and learning level all influence ranking.

**Layer 5 — Teacher review**
The teacher reviews the ranked list, confirms selections, and has full ability to add standards not surfaced by the AI.

### 4.2 What the AI Must Communicate for Each Standard

Every standard surfaced to the teacher must include:

```
Standard ID:        [accreditor's own numbering]
Accreditation Body: [full name and abbreviation]
Standard Text:      [retrieved text or reference if copyrighted]
Domain / Category:  [the accreditor's own grouping]
Relevance Reason:   [why the AI is suggesting this for this course]
Confidence:         [High / Medium / Low]
Required or Recommended: [based on program context]
Source URL:         [direct link to standards document]
Version / Date:     [version string and publication date]
Copyright Status:   [Free to use / Restricted / Reference only]
```

### 4.3 Handling Unknown or Niche Accreditation Bodies

The AI must handle cases where:
- The discipline is highly specialized and the accreditor is obscure
- The institution uses a state-specific or regional body not widely indexed
- The teacher knows their accreditor but the AI did not surface it

In all these cases, the teacher can provide:
- The accreditation body name
- A URL to the standards document
- The AI then retrieves, parses, and integrates those standards into the course profile

The data model must accommodate any accreditation body — there is no closed enum of allowed sources.

### 4.4 Standards Versioning and Drift Detection

Every standards node stored in a course profile carries:
- The version string as published by the accreditor
- The retrieval date (when the AI fetched this version)
- A checksum or fingerprint of the retrieved content

When a course is re-opened, re-imported, or explicitly refreshed, the system checks whether any stored standard has a newer version available. If drift is detected:
1. Instructor is notified which standards have changed
2. Changed items are highlighted in the Content Alignment panel
3. Gap detection reruns against the new standard version
4. **Instructor must confirm all re-alignments** — nothing is automatically remapped

### 4.5 Copyright and Access Constraints

Some accreditation bodies restrict reproduction of their standards text (QM, NCLEX frameworks, some state licensing boards). The AI must:

- Flag copyright status for every retrieved standard
- For restricted standards: store only the standard ID, short descriptor, and source URL — never the full text
- For open standards: full text may be stored and searched
- Never reproduce copyrighted rubric text in generated rubric criteria — reference the standard ID and direct the instructor to the source

---

## 5. Data Model

The schema must encode **relationships** between standards, not just store them as flat records. It must accommodate any accreditation body, in any discipline, including bodies the system has never encountered before.

### 5.1 `AccreditationBody`

Dynamically created when a new accreditation body is encountered. Not a closed enum.

```typescript
interface AccreditationBody {
  id: UUID;
  name: string;                    // e.g., "American Association of Colleges of Nursing"
  abbreviation: string;            // e.g., "AACN"
  disciplineCategories: string[];  // e.g., ["Nursing", "Health Sciences"]
  website: string;
  standardsUrl: string;            // Direct URL to current standards document
  isFrameworkLayer: boolean;       // true for QM, ACTFL only
  notes: string | null;
}
```

### 5.2 `StandardsNode`

Flexible enough to represent any standard from any body, including ones never previously encountered.

```typescript
interface StandardsNode {
  id: UUID;
  accreditationBodyId: UUID;       // FK → AccreditationBody
  layer: 'FRAMEWORK' | 'INSTRUMENT' | 'CURRICULUM' | 'ETHICS' | 'PROFESSIONAL';
  domain: string;                  // Accreditor's own category/domain name
  standardId: string;              // Accreditor's own ID (e.g., "QM-2.1", "ABET-1a", "CSWE-2.3")
  text: string | null;             // null if copyrighted — store ID and reference only
  version: string;
  publicationDate: Date;
  retrievedAt: Date;               // When AI fetched this version
  sourceUrl: string;
  copyrightStatus: 'OPEN' | 'RESTRICTED' | 'REFERENCE_ONLY';
  programTracks: string[];         // Flexible — not a closed enum
  institutionLevels: string[];     // Flexible
  deliveryModes: string[];         // Flexible
  isRequired: boolean;
  parentStandardId: UUID | null;   // For hierarchical standards (e.g., sub-standards)
  parentFrameworkId: UUID | null;  // For instruments derived from ACTFL
  fingerprint: string;             // Hash of standard text for drift detection
}
```

### 5.3 `CourseAccreditationProfile`

```typescript
interface CourseAccreditationProfile {
  id: UUID;
  canvasCourseId: string;
  institutionLevel: string;        // Flexible string, not closed enum
  deliveryMode: 'FACE_TO_FACE' | 'ONLINE_ASYNC' | 'ONLINE_SYNC' | 'HYBRID' | 'HYFLEX';
  discipline: string;              // Free text as entered by teacher
  degreeProgram: string;           // Free text
  institutionType: string;
  isLanguageCourse: boolean;       // Triggers ACTFL framework layer
  leadsToCertificationOrLicensure: boolean;
  selectedStandardIds: UUID[];
  proficiencyTargets: {            // null for non-language courses
    actflLevel: string | null;
    instrumentTargets: Array<{
      instrumentName: string;
      level: string;
    }>;
  } | null;
  qmActive: boolean;               // true when delivery mode is online or hybrid
  lastAlignmentCheck: Date;
  standardsVersionSnapshot: Record<string, {
    version: string;
    retrievedAt: Date;
    fingerprint: string;
  }>;
}
```

### 5.4 `CourseOutcome`

```typescript
interface CourseOutcome {
  id: UUID;
  profileId: UUID;
  text: string;
  bloomsLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  standardsMappings: UUID[];       // FK[] → StandardsNode
  actflTarget: string | null;      // null for non-language courses
  instrumentTarget: {
    instrumentName: string;
    level: string;
  } | null;
  qmAlignment: string[];           // QM standard IDs satisfied, e.g. ["QM-2.1", "QM-2.2"]
  isAiGenerated: boolean;
  instructorModified: boolean;
}
```

### 5.5 `AlignedContentItem`

```typescript
interface AlignedContentItem {
  id: UUID;
  canvasItemId: string;
  canvasItemType: 'ASSIGNMENT' | 'PAGE' | 'QUIZ' | 'DISCUSSION' | 'ACTIVITY' | 'MODULE';
  outcomeIds: UUID[];
  standardIds: UUID[];
  assessmentType: 'RUBRIC' | 'ACTIVITY_DESCRIPTION' | 'NONE';
  rubricId: UUID | null;
  activityDescriptionId: UUID | null;
  gapFlags: UUID[];                // StandardsNode IDs not addressed by any content item
  versionDriftFlags: UUID[];       // StandardsNode IDs whose version has changed since mapping
}
```

### 5.6 `Rubric`

```typescript
interface Rubric {
  id: UUID;
  title: string;
  outcomeId: UUID;
  standardIds: UUID[];
  criteria: Array<{
    id: UUID;
    description: string;
    standardId: UUID;
    performanceLevels: Array<{
      label: string;               // e.g., "Advanced-Low", "ASLPI 3", "Meets Standard", "Exceeds Standard"
      description: string;
      points: number;
    }>;
  }>;
  isAiGenerated: boolean;
  instructorModified: boolean;
}
```

### 5.7 `ActivityDescription`

```typescript
interface ActivityDescription {
  id: UUID;
  title: string;
  outcomeId: UUID;
  standardIds: UUID[];
  purpose: string;
  standardsConnection: string;
  participationExpectations: string;
  documentationRequirements: string;
  isAiGenerated: boolean;
}
```

---

## 6. AI Behavior Specifications

### 6.1 Standards Discovery — Decision Logic

```
Given: discipline, degree level, institution type, delivery mode, state/region,
       leads-to-licensure flag, institutional accreditor affiliations

Step 1: If institutional affiliations provided → retrieve those bodies' standards first
        Mark as "Institutionally Confirmed"

Step 2: Infer likely accreditation bodies from discipline + degree level
        Examples:
          "Nursing" + "BSN" + "University"   → ACEN, CCNE, QSEN, state nursing board
          "Engineering" + "BS" + "University" → ABET, discipline-specific ABET program criteria
          "Business" + "MBA" + "University"  → AACSB, ACBSP, IACBE
          "Social Work" + "MSW"              → CSWE, state licensure board (LMSW/LCSW)
          "Education" + "MEd"                → CAEP, state DOE standards, InTASC
          "ASL" + "AAS" + "Community College"→ ASLTA/NCIEC, QM, ACTFL, CCIE (if interpreting)
          "Law" + "JD"                       → ABA Standards, state bar requirements
          "Medicine" + "MD"                  → LCME, ACGME
          "Art & Design" + "BFA"             → NASAD
          "Music" + "BM"                     → NASM
          [unknown discipline]               → AI searches for likely accreditors,
                                               presents with Low confidence,
                                               prompts teacher to verify

Step 3: Retrieve current standards documents from identified bodies

Step 4: Rank by relevance to specific course (not just program)

Step 5: Present to teacher with confidence levels and rationale
        Required → pre-selected, locked, visible
        Recommended → pre-selected, unlocked, with rationale
        Possible → not pre-selected, surfaced with explanation
```

### 6.2 QM Real-Time Alignment Checking

When QM is active, the following Essential Standards are checked continuously as content is created or modified:

| QM Standard | Trigger |
|------------|---------|
| QM-2.1 | No course-level learning objectives found |
| QM-2.2 | Module/unit objectives absent or not aligned to course-level |
| QM-3.1 | Assessment exists with no outcome mapping |
| QM-4.1 | Instructional material added with no outcome mapping |
| QM-5.1 | Activity added with no learning purpose or outcome link |
| QM-6.1 | Technology tool added with no accessibility or objective link |
| QM-8.1 | Media added without captions, alt text, or transcript |
| QM-3.4 | No academic integrity statement present in course |
| QM-1.4 | No course policies or policy links present |

### 6.3 Outcome Generation Guardrails

- All AI-generated outcomes must include a standards citation before being surfaced
- Vague constructions must be replaced with Bloom's action verbs:
  - "understand" → analyze, explain, compare, interpret
  - "be aware of" → identify, recognize, describe
  - "appreciate" → evaluate, reflect, justify
- For language courses: ACTFL proficiency level must appear in the outcome or its metadata
- For QM-active courses: every outcome must satisfy QM-2.1 or QM-2.2 before it can be saved
- For ethics/professional conduct standards: at least one outcome per module must map to the ethics standard if the module is designated as professional practice content

### 6.4 Gap Detection — Required Checks

After outcomes are confirmed, scan all content items and flag:

- Standards with no content item mapped to them
- Outcomes with no associated assessment
- Assessments that lack a rubric where one is feasible
- QM Essential Standard gaps (see 6.2)
- Version drift: content items previously mapped to a standard whose version has since changed
- For courses leading to licensure: flag if any licensure-specific competency has no assessment

### 6.5 Import Re-Alignment Detection

When a course is imported from a previous semester:

1. Compare `standardsVersionSnapshot` against current versions via fresh AI retrieval
2. Identify which standards have changed (version string or fingerprint mismatch)
3. Notify instructor with a summary of what changed and which content items are affected
4. Run full gap detection against updated standard versions
5. **Do not automatically remap** — instructor confirms all re-alignments
6. Allow instructor to dismiss drift warnings individually (with timestamp logged)

### 6.6 Handling Retrieval Failures

If the AI cannot retrieve a standard (network issue, paywalled document, retired standards URL):

- Flag the standard as `RETRIEVAL_FAILED` with timestamp
- Fall back to last successfully retrieved version if available
- Surface a warning to the instructor with the source URL so they can manually verify
- Never silently use stale data without surfacing a warning

---

## 7. UI Integration in Canvas Bulk Editor

### 7.1 Setup Wizard vs. Bulk Editor Tab

**Setup Wizard** (Steps 1–5) is a separate flow that precedes the Bulk Editor. It creates the `CourseAccreditationProfile`. This wizard runs:
- When a new course is created
- When a course is imported from a previous semester
- When a teacher explicitly requests a standards refresh

**Accreditation Tab in the Bulk Editor** is the ongoing working context. It assumes a profile exists and provides the alignment and verification layer throughout course construction.

### 7.2 Bulk Editor — Accreditation Tab Panels

**Standards Panel**
- All confirmed standards with version info and source links
- Required standards locked (cannot deselect without admin override)
- Optional standards toggleable
- Version drift warnings inline with direct links to what changed
- "Refresh Standards" button triggers re-retrieval and drift check

**Outcomes Panel**
- All course outcomes with standards mappings
- QM alignment status per outcome (when QM active)
- Proficiency targets shown for language courses
- Edit and add inline; traceability updates on save
- Flag indicator when an outcome has no associated assessment

**Content Alignment Panel**
- Bulk Editor table view
- Rows = Canvas content items
- Columns: standards alignment, outcome mapping, rubric/activity description status, QM status, gap flags, version drift flags
- Gap flags are actionable — click opens AI suggestion panel

### 7.3 Persistent Standards Context

Selected standards remain visible as a **persistent sidebar** while the instructor works. Standards are always in view — not a tab you visit and leave. The sidebar collapses but does not disappear.

### 7.4 Relationship to Accommodations Tab

The Accommodations tab is a sibling tab in the Bulk Editor. Both tabs share the same course content item list but operate on different pipeline layers:

- **Accreditation:** top-down (standards → outcomes → content)
- **Accommodations:** applied at the content layer directly

Do not merge the two tabs. Maintain clear separation.

---

## 8. ASL / Deaf Ed / Interpreter Education — Reference Implementation

This section documents how the universal tool applies to ASL-related programs. It serves as a reference implementation and test case, not as hardcoded behavior. The tool derives all of this through AI discovery — nothing in this section is stored as special-case logic.

### 8.1 How AI Discovery Resolves for This Discipline

When a teacher enters discipline context for an ASL/Deaf Ed/Interpreter program, the AI discovery engine is expected to surface the following standards bodies and instruments. This is the expected output — it should emerge from AI inference, not from hardcoded rules.

**Expected accreditation bodies surfaced:**

| Body | Abbreviation | Applies To |
|------|-------------|------------|
| Quality Matters | QM | All online/hybrid (Framework Layer) |
| American Council on the Teaching of Foreign Languages | ACTFL | All language courses (Framework Layer) |
| American Sign Language Teachers Association / NCIEC | ASLTA | All ASL courses |
| Commission on Collegiate Interpreter Education | CCIE | Interpreter Education programs |
| Council on Education of the Deaf | CED | Deaf Education programs |
| Council for Exceptional Children | CEC | Deaf Education programs (CED builds on CEC) |
| Board for Evaluation of Interpreters (Texas) | BEI | Interpreter programs in Texas and BEI-licensed states |
| Registry of Interpreters for the Deaf | RID | Interpreter programs (Code of Professional Conduct — referenced by BEI) |

**Expected assessment instruments surfaced (language layer):**

| Instrument | Administrator | Scale | Applies To |
|-----------|--------------|-------|------------|
| ASLPI | Gallaudet University | 0–5 (with + values) | ASL teacher certification |
| SLPI:ASL | NTID / RIT | 11 levels: No Functional Skills → Superior Plus | K-12 staff; diagnostic use |
| TASC | TEA / Pearson | Holistic performance levels | Texas Deaf Ed teacher candidates — any sign system |
| TASC-ASL | TEA / Pearson | Level C or higher | Texas ASL LOTE teacher candidates — ASL only |

### 8.2 TASC vs. TASC-ASL — Critical Distinction

The AI must correctly distinguish these two instruments based on program context. This is not a preference — it is determined by the program track.

- **TASC** — Deaf Ed teacher candidates. Assesses sign communication proficiency in **any** sign system (ASL, SEE, PSE, etc.). Teacher selects system at registration; may switch during exam.
- **TASC-ASL** — ASL LOTE teacher candidates and bilingual endorsement candidates. Assesses proficiency **in ASL only**. No system switching permitted. Passing score: Level C or higher.

### 8.3 BEI Dual-Node Structure

BEI occupies two nodes in the data model for this discipline. The AI must surface both as distinct standards:

- **BEI Skills Standards** → Layer: CURRICULUM. Competency definitions at Basic, Advanced, Master, Court, Medical, Trilingual, and Deaf Interpreter levels. These feed directly into course outcomes and rubric criteria.
- **BEI Code of Professional Conduct** → Layer: ETHICS. 7 tenets. Must be embedded as a curriculum thread — not isolated to a single ethics module. Referenced by BEI regulations even when RID certification is not the target outcome.

### 8.4 Expected ACTFL ↔ Instrument Crosswalk

| ACTFL Level | ASLPI Approx. | SLPI Approx. |
|-------------|--------------|-------------|
| Novice Low–High | 0–0.5 | No Functional Skills → Survival |
| Intermediate Low–High | 1–2+ | Survival Plus → Intermediate |
| Advanced Low–Mid | 3–3+ | Intermediate Plus → Advanced |
| Advanced High | 4 | Advanced Plus |
| Superior | 5 | Superior / Superior Plus |

---

## 9. Out of Scope / v2 Considerations

| Item | Notes |
|------|-------|
| Formal QM Official Course Review submission | External process. Tool supports design alignment only. |
| Formal accreditation body submissions | Tool generates evidence and documentation; does not submit to any accreditation body. |
| Multi-course program mapping | v1.0 is course-level. Program-wide standards mapping is v2. |
| Automated standards text parsing from PDFs | v1.0 assumes AI can retrieve structured standards. PDF parsing for unstructured documents is a v2 enhancement. |
| Real-time standards monitoring | v1.0 checks for drift on course open/import. Background monitoring for standard updates between sessions is v2. |
| Integration with institutional accreditation management systems (Watermark, Anthology, etc.) | Future integration consideration. |
| State licensing board standards beyond Texas | v1.0 supports BEI (Texas). Other state licensing boards discovered dynamically via AI. Curated state-by-state datasets are v2. |
| EIPA (Educational Interpreter Performance Assessment) | AI should surface this for K-12 educational interpreter tracks. No special-case handling needed — AI discovery handles it. |
| QM CRMS integration | QM's Course Review Management System interop is a future consideration. |
| Multilingual interface | Out of scope for v1.0. |

---

*End of Specification — Version 2.0*
