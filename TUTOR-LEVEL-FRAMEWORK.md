# Tutor Level and GCSE Grade Framework

Reference for building tutor **requirements profiles** on the Evolution AI Platform. Maps nine platform tutor bands to GCSE Citizenship Studies expectations (grades 1 to 9, England). This document defines what students must demonstrate and how tutors should scaffold, question, and mark. It does **not** define tutor personality, backstory, or avatar copy.

**Structured data:** `assets/data/tutor-level-framework.json` (v2.0.0)  
**Visual map:** `CITIZENSHIP-ASSESSMENT-MAP.md`

---

## Disclaimer

This framework supports teaching, placement, chatbot delivery, and worksheet design on the Evolution AI Platform. It is **not** an official exam grade, certification, DfE endorsement, or Ofsted approval. Grade boundaries are set by exam boards each year and vary by paper. Use professional teacher judgement alongside platform suggestions. Teachers may override tutor band assignment regardless of diagnostic score.

---

## Citizenship Exam Structure

Assessment objectives and weightings are set by Ofqual and are **identical across AQA, Edexcel/Pearson, and OCR** GCSE Citizenship specifications.

| Component | Detail |
| --- | --- |
| Total scaled marks | 160 |
| Papers | 2 written exams, linear (all at end of course) |
| Duration per paper | 1 hour 45 minutes (all major boards) |
| Marks per paper | 80 (50% of GCSE each) |
| AO1 weight | 30% overall (15% per paper) |
| AO2 weight | 30% overall (15% per paper) |
| AO3 weight | 40% overall (20% per paper) |

### AQA GCSE Citizenship Studies (8100)

| Paper | Section | Content | Marks |
| --- | --- | --- | --- |
| Paper 1 | A | Active citizenship (others' actions + student's investigation) | 40 |
| Paper 1 | B | Politics and participation | 40 |
| Paper 2 | A | Life in modern Britain | 40 |
| Paper 2 | B | Rights and responsibilities | 40 |

Question types: multiple choice, short answer, source-based, extended answer.

**Active citizenship:** Assessed entirely through Paper 1 Section A written questions (~15% of total GCSE). Students undertake an investigation (research, action, reflection) during the course; the exam tests understanding of processes, not portfolio submission.

### Edexcel GCSE Citizenship Studies (1CS0)

| Paper | Sections | Notes |
| --- | --- | --- |
| Paper 1 | A: Living together in the UK; B: Democracy at work; C: Law and justice; D: Citizenship issues and debates | Section D ~31 marks (~21% of qualification); includes 12-mark and 15-mark extended parts |
| Paper 2 | Citizenship in perspective; Power and influence | Section B ~42 marks (~26%); includes 10-mark and 12-mark questions |

Edexcel provides examiner commentary emphasising that **explain** questions require development beyond a simple statement to access full marks (2023 examiners' report).

### OCR GCSE Citizenship Studies (J270)

| Paper | Title | Focus |
| --- | --- | --- |
| J270/01 | Citizenship in perspective | Concepts, issues, debates |
| J270/02 | Citizenship in action | Planning, taking, evaluating citizenship actions |

OCR uses the same Ofqual AOs; wording in mark schemes may refer to "recall, select and communicate" (AO1) and citizenship action planning/evaluation (AO2).

---

## GCSE Citizenship Assessment Objectives

| AO | Requirement | Weighting |
| --- | --- | --- |
| **AO1** | Demonstrate knowledge and understanding of citizenship concepts, terms, and issues | 30% |
| **AO2** | Apply knowledge and understanding of citizenship concepts, terms, and issues to contexts and actions | 30% |
| **AO3** | Analyse and evaluate a range of evidence relating to citizenship issues, debates, and actions, including different viewpoints, to develop reasoned, coherent arguments and make substantiated judgements | 40% |

**Key terms (Ofqual subject guidance):**

- **Concepts:** underlying ideas (democracy, rights, responsibilities, equality, justice, participation)
- **Terms:** subject definitions (common law, tribunal, jury, constituency)
- **Issues:** questions arising from concepts (voting age, press freedom, community cohesion)
- **Contexts:** local, national, and global settings
- **Actions:** practical participation aimed at change (campaigns, volunteering, citizenship action projects)

**AO2 split (Ofqual guidance):** Application to **contexts** and application to **actions** should both be covered across the qualification. Actions include commenting on others' actions, suggesting how to act, and reflecting on own citizenship action.

---

## Mark Scheme Anatomy

Understanding how examiners award marks is essential for tutor band design. GCSE Citizenship uses two main marking models.

### Point marking (typically 1 to 4 marks)

Used for short-answer questions: define, name, identify, explain (short), apply (short).

| Marks | Typical examiner instruction | Student behaviour required |
| --- | --- | --- |
| **1** | "Award one mark for..." | Correct identification, naming, or valid point |
| **2** | "Award 1 mark for... and 1 mark for developing..." | Point + development, example, or linked explanation |
| **3-4** | Multiple point/develop pairs OR levels-lite | Two developed points, or one well-developed point with application |

**AQA examples (live mark schemes):**

- Define: "Award 1 mark for a correct definition and 1 mark for developing definition/example."
- Explain: "Award 1 mark for identifying a valid reason and 1 mark for developing an explanation."
- Identify two: "Award one mark for each correct answer up to a maximum of two."

**Edexcel examiner report (2023):** A response such as "people may choose to support a campaign that helps vulnerable people" suits name/give/identify. For **explain**, the same idea needs development: "...because they may not have opportunities to participate because of their vulnerability."

### Levels-based marking (typically 6 to 16+ marks)

Used for discuss, evaluate, analyse, examine, and active citizenship extended responses.

**Standard 8-mark levels (AQA Paper 2 style):**

| Level | Marks | Descriptor (summary) |
| --- | --- | --- |
| 4 | 7-8 | Developed sustained analysis; wide range of evidence and views; reasoned justifications; coherent argument |
| 3 | 5-6 | Analysis of range of evidence; arguments not always fully developed or evaluated; conclusion may lack coherence |
| 2 | 3-4 | Basic analysis; limited range; weak arguments; limited viewpoints; some concluding attempt |
| 1 | 1-2 | Limited evidence; insufficient viewpoints; little analysis or integration |
| 0 | 0 | Nothing to credit |

**12-mark active citizenship (AQA Paper 1 style):**

| Level | Marks | Descriptor (summary) |
| --- | --- | --- |
| 4 | 10-12 | Clear precise analysis with well chosen investigation evidence; developed, justified, evaluated within citizenship action context |
| 3 | 7-9 | Good application; analyses not always fully developed or evaluated |
| 2 | 4-6 | Some evidence; weak arguments; analysis not always relevant to context |
| 1 | 1-3 | Basic application; little analysis or integration |

**Examiner procedure:**

1. **Determine level** using best-fit (start at lowest level, ladder up)
2. **Determine mark within level** using variability guidance (top of level if strong; bottom if barely meets)
3. **Credit valid alternatives** not listed in indicative content
4. **Do not require** all indicative content points for full marks

### Active citizenship: what examiners credit

From AQA sample mark schemes and investigation guidance:

| Investigation stage | Examiner looks for | AO |
| --- | --- | --- |
| Research | Primary/secondary sources named; how source assisted investigation | AO1 |
| Planning | Clear aims; realistic action plan | AO2 |
| Action | Linkage between aims, research results, and action taken | AO2 |
| Reflection | Success/difficulty discussed with evidence | AO2, AO3 |
| Evaluation | Usefulness of evidence; order of importance; conclusions linked to hypothesis | AO3 |
| Analysis of citizenship action | Justification why activity counts as citizenship action; range of valid reasons embedded in student's own participation | AO2, AO3 |

**Edexcel citizenship action planning:** Six criteria for viable action proposals (clear goal, spec-linked topic, impact potential, sufficient resources, links to concepts/terms, measurable success).

---

## GCSE Grades 1 to 9

Ofqual publishes **indicative** grade descriptors at grades **2, 5, and 8** only. Intermediate grades are inferred.

| Grade | Performance band | Citizenship indicators |
| --- | --- | --- |
| **9** | Exceptional | Beyond grade 8: insight, precision, sustained argument without drift; selective comprehensive knowledge |
| **8** | Very strong (anchor) | Comprehensive knowledge; perceptive convincing arguments; variety of viewpoints; well-substantiated conclusions; critical evaluation of action outcomes |
| **7** | Strong | Secure knowledge; coherent arguments with several viewpoints; sustained evidence-based reasoning |
| **6** | Above average | Mostly accurate knowledge; clear application; developing argument with some viewpoint comparison |
| **5** | Strong pass (anchor) | Mostly accurate knowledge of a **range** of aspects; reasoned arguments with **some** differing viewpoints; evidence-based conclusions; credible enquiries; evaluation of participation |
| **4** | Standard pass | Adequate core knowledge; basic application to familiar contexts; simple reasoning; limited viewpoint awareness |
| **3** | Below pass | Partial knowledge; inconsistent application; brief or unsupported responses |
| **2** | Low (anchor) | Knowledge of **some** aspects; basic reasoning with **some** viewpoint awareness; judgement with **limited** evidence; basic enquiries; reflection on **some** action outcomes |
| **1** | Minimal | Fragmented recall; little application; no sustained argument |

Grade **U** sits below grade 1. Nova Access supports students working toward grade 1.

---

## Platform Mapping Table

| Index | Tutor | Level | GCSE grades | Combined score | Primary AO |
| --- | --- | --- | --- | --- | --- |
| 0 | Nova | Access | 1 | 0.0-0.9 | AO1 entry |
| 1 | Milo | Foundation | 1-2 | 1.0-1.9 | AO1 core terms |
| 2 | Ava | Building Confidence | 2-3 | 2.0-2.9 | AO1 + early AO2 |
| 3 | Kai | Developing | 3-4 | 3.0-3.9 | AO1 + AO2 structured |
| 4 | Zara | Secure | 4-5 | 4.0-4.9 | AO2 + AO1 reinforcement |
| 5 | Theo | Confident | 5-6 | 5.0-5.9 | AO2 + emerging AO3 |
| 6 | Nia | Exam Ready | 6-7 | 6.0-6.9 | AO2 + AO3 mark-scheme aware |
| 7 | Elias | Advanced | 7-8 | 7.0-7.9 | AO3 evaluation + strong AO2 |
| 8 | Athena | Mastery | 8-9 | 8.0-10.0 | AO3 synthesis across themes |

---

## Command Word Matrix by Grade Band

Based on AQA GCSE Citizenship command words (Ofqual list plus board additions). See `CITIZENSHIP-ASSESSMENT-MAP.md` for full table.

```
identify / name / state / give / define     [grades 1-3]  Nova, Milo
describe / outline / summarise              [grades 2-4]  Milo, Ava, Kai
explain                                     [grades 3-6]  Ava through Theo
apply / suggest                             [grades 4-6]  Kai through Theo
analyse / examine                           [grades 5-8]  Theo through Elias
discuss / debate / compare / consider       [grades 5-9]  Zara upward
evaluate / assess / justify / argue         [grades 6-9]  Nia upward
conclude                                    [grades 7-9]  Elias, Athena
```

| Command | Definition | Low band example (grades 1-3) | Mid band example (grades 4-6) | High band example (grades 7-9) |
| --- | --- | --- | --- | --- |
| **Identify** | Name or characterise | Identify one way citizens can vote | Identify two ways pressure groups differ from parties | Identify the most relevant evidence in Source A for evaluating media bias |
| **Define** | Specify meaning | Define "democracy" with word bank | Define "advocacy" with example | Define "rule of law" and use precisely in evaluative argument |
| **Describe** | Set out characteristics | Describe one feature of Parliament | Describe how a general election works | Describe is rarely standalone at high band; embedded in analysis |
| **Explain** | Set out purposes or reasons | Explain one reason people pay taxes | Explain two ways MPs represent constituents | Explain is embedded in developed evaluative chains |
| **Apply** | Put into effect | Apply "responsibility" to school rules scenario | Apply human rights to stop and search scenario | Apply concepts to novel cross-theme scenario under timed conditions |
| **Analyse** | Separate into components | Not targeted below grade 5 | Analyse how Source A shows bias about young voters | Analyse how two campaigns used different strategies for change |
| **Discuss** | Key points, strengths/weaknesses | Not targeted below grade 4 | Discuss benefits and drawbacks of voting at 16 | Discuss is superseded by evaluate/debate at highest bands |
| **Evaluate** | Judge from evidence | Not targeted below grade 5 | Evaluate success of a local citizenship campaign | Evaluate the extent to which digital citizenship has transformed participation |
| **Assess** | Informed judgement | Not targeted below grade 6 | Assess importance of rule of law | Assess whether national interest justifies limiting human rights |

---

## Teacher Practice Notes (Cross-Band)

From Association for Citizenship Teaching CPD, exam board guidance, and typical UK citizenship department practice:

### All bands

- Secure **foundational knowledge** before critical thinking (students cannot analyse what they do not know)
- Use **gradual release**: I do, we do, you do
- Bridge **active citizenship project** with exam technique explicitly
- **Retrieval practice** spaced across units; interleave themes
- Structured talk before extended writing
- Modelling with **worked examples**; remove scaffolds as knowledge secures

### Foundation and access (Nova, Milo, Ava)

- ROG/colour banding: Red = identify/name; Orange = describe/explain one reason; Green = extended
- Writing frames and sentence starters **available**
- Pre-teach vocabulary with visuals; oracy before literacy
- TA/peer reading support for source text
- Exit tickets: low mark ceiling (1-2 marks) for confidence

### Mid band (Kai, Zara, Theo)

- Explicit **point + development** marking language in feedback
- Modelling "this earns 1 mark... this earns the 2nd mark"
- Chunk sources: read, highlight, then answer
- Introduce discuss/evaluate with **both sides required** before marking complete
- Link Paper 1 active citizenship vocabulary to Paper 2 themes

### Exam readiness and above (Nia, Elias, Athena)

- Mark schemes and level descriptors on desk during mocks
- Timed practice building to full paper pace
- Peer marking with examiner training approach
- **Best-fit level** discussion using exemplars
- Push **selective knowledge** (answer the question) not knowledge dumps
- Grade 8 descriptor as stretch; grade 9 = insight and precision beyond secure 8

---

## Level-by-Level Requirements Profiles

Each profile defines **requirements**, not personality. Load corresponding JSON fields for machine use.

---

### 1. Nova (Access) | Grade 1

**GCSE grade range:** 1 (U to 1 entry) | **Combined score:** 0.0-0.9

**What student MUST demonstrate**

- Recognise 3 to 5 high-frequency citizenship terms with support
- Select correct label from word bank or binary choice
- Complete one-step tasks only
- Attempt engagement with very short tasks

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 1 | Correct selection or naming from options |
| 2 | Not targeted |
| 4+ | Not targeted |

**Example question stems:** "Name one word for choosing MPs." / "Identify which is a right: A or B?" / "Give one school rule."

**Scaffolding rules (chatbot):** One idea per message; word bank always; max 8-word sentences; celebrate attempts; glossary pinned.

**Worksheet exit task:** Circle correct word from three options (rights/rules).

**Ready to move up when:** 80%+ accuracy with word bank over 3 sessions; names one term without options in 2 topics.

**Citizenship topics:** Rights = match everyday examples; democracy = label vote/election; law = sort allowed/not allowed; active citizenship = recognise campaign/petition from images.

**Teacher practice:** Visuals first; oracy before writing; Red band tasks only; TA support for reading.

---

### 2. Milo (Foundation) | Grades 1-2

**GCSE grade range:** 1 to 2 | **Combined score:** 1.0-1.9

**What student MUST demonstrate**

- Define core terms with model shown first (1+1 mark pattern)
- Name one valid example from familiar topic
- Describe one feature in 1 to 2 sentences
- Follow two-step read-then-answer instructions

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 1 | Correct point or identification |
| 2 | Point + example OR definition + development |
| 4+ | Not targeted |

**Example question stems:** "Define democracy." / "Name one responsibility of a UK citizen." / "Describe one feature of Parliament."

**Scaffolding rules:** Model answer then your turn; gap-fill with keyword bank; one new term per block; name the mark earned in feedback.

**Worksheet exit task:** Define "right" + one school example (2 marks).

**Ready to move up when:** 1+1 define without model in 2+ topics; describes with own words in full sentence.

**Citizenship topics:** Rights = define HRA example; democracy = define + name participation method; law = define law simply; active citizenship = define campaign.

**Teacher practice:** I do/we do/you do; weekly 10-term retrieval; foundation exit tickets name/define only.

---

### 3. Ava (Building Confidence) | Grades 2-3

**GCSE grade range:** 2 to 3 (near grade 2 anchor) | **Combined score:** 2.0-2.9

**What student MUST demonstrate**

- Describe 2 linked features of familiar institution
- Explain one reason with "because" in local/school context
- Apply concept with sentence frame
- State one other viewpoint when prompted

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 1 | Single valid feature or reason |
| 2 | Developed link to context (grade 2: basic reasoning, limited evidence) |
| 4 | Emerging; likely 1-2 without full development |

**Example question stems:** "Describe how a school council gives students a voice." / "Explain why voting matters locally." / "Apply responsibility to a litter scenario."

**Scaffolding rules:** Because/This means/For example frames; school/local contexts only; praise partial; one follow-up max.

**Worksheet exit task:** Explain one reason to join a youth club (2 marks).

**Ready to move up when:** Consistent 2/2 on familiar explain; applies to new similar scenario with 2 reasons.

**Citizenship topics:** Rights = free speech limits in school; democracy = local council; law = youth justice outline; active citizenship = describe one investigation stage.

**Teacher practice:** Grade 2 descriptor on board; structured talk for "because" clauses; Orange band tasks.

---

### 4. Kai (Developing) | Grades 3-4

**GCSE grade range:** 3 to 4 | **Combined score:** 3.0-3.9

**What student MUST demonstrate**

- Explain with developed reason (3-4 mark questions)
- Apply rights/responsibilities to unseen short scenario
- Use PEE/PEEL when templated
- Use one source line when directed

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 1 | Point without development |
| 2 | Point + development (explain needs more than simple statement) |
| 4 | Two developed points OR one well-developed + application |

**Example question stems:** "Explain two ways Parliament holds government to account." / "Apply human rights to stop and search scenario." / "Consider whether this source supports fair media."

**Scaffolding rules:** PEE with citizenship labels; scenario in steps; highlight source lines first; remove stems gradually.

**Worksheet exit task:** Explain two ways to influence local planning (4 marks).

**Ready to move up when:** 3+/4 without frame; national context with accurate terms; unprompted source use.

**Citizenship topics:** Rights = HRA scenario; democracy = MPs vs Lords; law = civil vs criminal outline; active citizenship = explain how research helped.

**Teacher practice:** Model 1 mark vs 2 mark; chunk sources; 3/4 band with optional frames.

---

### 5. Zara (Secure) | Grades 4-5

**GCSE grade range:** 4 to 5 (grade 5 trajectory) | **Combined score:** 4.0-4.9

**What student MUST demonstrate**

- Mostly accurate knowledge across 2+ themes
- Reasoned paragraph with viewpoint + evidence
- Compare/discuss with brief counter-view
- Link citizenship action to outcome

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 1-2 | Developed point with terminology |
| 4-6 | Reasoned points; some evidence; grade 5: some differing viewpoints |
| 6 | Level 2-3 on 6-mark source: evidence selected; not always fully developed |

**Example question stems:** "Discuss benefit and drawback of voting at 16." / "Compare two sources on immigration." / "Explain whether your issue was local, national, or global."

**Scaffolding rules:** Structure suggested not filled; discuss requires both sides; precise terms over vague language.

**Worksheet exit task:** Discuss social media and political participation (6 marks).

**Ready to move up when:** Grade 5 elements in 2+ tasks; independent two-viewpoint weigh; 6-mark at level 2-3.

**Citizenship topics:** Rights = privacy vs security discuss; democracy = voting systems; law = stop and search balance; active citizenship = discuss successful investigation stage.

**Teacher practice:** Grade 5 rubric; model counter-argument; peer assess identify+develop.

---

### 6. Theo (Confident) | Grades 5-6

**GCSE grade range:** 5 to 6 (grade 5 secure) | **Combined score:** 5.0-5.9

**What student MUST demonstrate**

- Balanced discuss with conclusion (grade 5 anchor)
- Analyse source for bias/purpose with quote
- Evaluate action outcome with named criterion
- Integrate knowledge into argument (not lists)

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 6-8 | Level 3 (5-6): range of evidence; arguments not always fully evaluated |
| 8 | Approaching level 4: sustained analysis beginning |

**Example question stems:** "Analyse bias in Source A about young voters." / "Evaluate success of a litter campaign." / "Examine why a pressure group campaign might fail."

**Scaffolding rules:** Planning box only; challenge vague claims; require evaluative criteria; quote source detail.

**Worksheet exit task:** Evaluate school citizenship action (8 marks).

**Ready to move up when:** Level 3+ on 8-mark x3; maps answer to AOs in review; explicit strengths/limitations.

**Citizenship topics:** Rights = evaluate HRA reform; democracy = analyse turnout; law = evaluate sentencing aims; active citizenship = evaluate methodology.

**Teacher practice:** Real mark schemes in lessons; teach bias/purpose/reliability; timed half-exam sections.

---

### 7. Nia (Exam Ready) | Grades 6-7

**GCSE grade range:** 6 to 7 | **Combined score:** 6.0-6.9

**What student MUST demonstrate**

- Level 2-3 consistently on 8-12 mark questions
- Select knowledge for question focus
- Justify with substantiated evidence
- Active citizenship: aims, research, action, reflection linked

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 8 | Best-fit level 3; coherent arguments forming |
| 12 | Level 3 (7-9) on active citizenship: good application; not always fully evaluated |

**Example question stems:** "Assess importance of rule of law." / "Analyse how your investigation exemplified citizenship action." / "To what extent does UK media support democracy?"

**Scaffolding rules:** Timed mode; "what gains the next mark?" coaching; level descriptor feedback; no hints after planning in timed mode.

**Worksheet exit task:** 12-mark timed: link research to action (15 min).

**Ready to move up when:** Level 3+ on 8 and 12-mark x4; exam timing secure; self-identifies missing developed point.

**Citizenship topics:** Full Paper 1 Section A style across all active citizenship question types.

**Teacher practice:** Mock marking with descriptors; interleave exam Qs; peer mark scheme training.

---

### 8. Elias (Advanced) | Grades 7-8

**GCSE grade range:** 7 to 8 (grade 8 trajectory) | **Combined score:** 7.0-7.9

**What student MUST demonstrate**

- Level 4 on 8-mark: developed sustained analysis, coherent argument
- Variety of viewpoints (grade 8 anchor)
- Critical evaluation of citizenship action outcomes
- Well-substantiated conclusion from evidence

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 8 | Level 4 (7-8): wide range evidence; reasoned justifications; coherent |
| 12 | Level 4 (10-12): well-judged coherent conclusion on action |
| 16 | Level 3-4: perceptive; approaching synthesis |

**Example question stems:** "Evaluate extent citizens influence government." / "Debate economic sanctions as global citizenship." / "Conclude whether your action achieved its aims."

**Scaffolding rules:** Student-led plan; Socratic probes only; cross-theme links rewarded; no sentence starters.

**Worksheet exit task:** 16-mark evaluate protest and democracy (20 min timed).

**Ready to move up when:** Level 4 regular; grade 8 mock; cross-theme synthesis per unit.

**Teacher practice:** Compare L3 vs L4 exemplars; synoptic starters; student-led seminars.

---

### 9. Athena (Mastery) | Grades 8-9

**GCSE grade range:** 8 to 9 | **Combined score:** 8.0-10.0

**What student MUST demonstrate**

- Grade 8 secure plus grade 9 insight, precision, no drift
- Synthesise 2+ themes in unified argument
- Nuanced trade-offs in evaluation
- Examiner-ready QWC and specialist vocabulary

**Mark scheme behaviours**

| Marks | Behaviour |
| --- | --- |
| 8+ | Top of level 4: as good as can be expected in band |
| 16+ | Selective comprehensive knowledge; perceptive cross-viewpoint synthesis |
| 20+ | Sustained synoptic without drift |

**Example question stems:** "Evaluate extent digital citizenship transformed participation." / "Argue for/against written constitution using rights, democracy, law." / "Assess whether citizenship action addresses structural inequality."

**Scaffolding rules:** None by default; extension counter-arguments; meta-reflection on argument quality; optional full paper sections.

**Worksheet exit task:** Synoptic 20-mark essay combining rights, democracy, active citizenship.

**Ready to move up when:** Ceiling band; maintain grade 8-9 under full exam conditions.

**Teacher practice:** Student as examiner; full timed papers monthly; selective not exhaustive knowledge.

---

## Citizenship Topic Progression Summary

| Theme | Nova-Milo | Ava-Kai | Zara-Theo | Nia-Athena |
| --- | --- | --- | --- | --- |
| **Rights and responsibilities** | Match, name, define rights | Explain and apply in school/local scenarios | Discuss balances (privacy, security) | Assess, evaluate, synoptic rights debates |
| **Democracy and participation** | Label vote, election, MP | Explain why vote; describe institutions | Analyse turnout; discuss voting systems | Evaluate representation; constitutional debate |
| **Law and justice** | Sort legal/illegal; define law | Outline justice system; explain sentencing aim | Evaluate youth justice; analyse legal aid sources | Critical evaluation of reform; law + rights synthesis |
| **Active citizenship** | Image recognition of action types | Describe investigation stages | Evaluate research; discuss success | Full exam Section A; critical methodological evaluation |
| **Life in modern Britain** | British values word match | Describe media role simply | Analyse source bias on identity/media | Evaluate UK global role synoptically |

---

## Question Type Progression Summary

| Question type | From band | AO focus |
| --- | --- | --- |
| Multiple choice | Nova | AO1 |
| Fill / gap fill | Nova, Milo | AO1 |
| Name / identify | Nova, Milo | AO1 |
| Define (2 mark) | Milo, Ava | AO1 |
| Describe (single/multi) | Milo, Ava, Kai | AO1 |
| Explain (short 2-4 mark) | Ava, Kai, Zara | AO1 + AO2 |
| Apply scenario | Kai, Zara | AO2 |
| Source highlight + explain | Kai, Zara | AO2 + AO3 |
| Discuss (6 mark) | Zara, Theo | AO3 |
| Analyse source (6-8 mark) | Theo, Nia | AO3 |
| Evaluate / assess (8+ mark) | Theo, Nia, Elias, Athena | AO3 |
| Active citizenship extended (12 mark) | Nia, Elias, Athena | AO2 + AO3 |
| Extended synoptic (16+ mark) | Elias, Athena | AO1 + AO2 + AO3 |

---

## Using This Framework

When building tutor delivery logic:

1. Pick band (Nova to Athena) from placement or teacher assignment
2. Load `gradeRange`, `commandWords`, `aoExpectations`, `markSchemeBehaviours`, `scaffoldingRules`, `exampleQuestionStems` from JSON
3. Set worksheet difficulty from `worksheetStyle` and chat scaffolding from `scaffoldingRules`
4. Use `readinessToMoveUp` for band progression suggestions (teacher confirms)
5. Do **not** claim tutor band equals awarded GCSE grade
6. Keep **requirements separate from persona/avatar copy**

---

## References and Sources

### Official specifications and guidance

- [GCSE Citizenship grade descriptors (grades 2, 5, 8)](https://www.gov.uk/government/publications/grade-descriptors-for-gcses-graded-9-to-1/grade-descriptors-for-gcses-graded-9-to-1-citizenship-studies)
- [GCSE assessment objectives including Citizenship](https://www.gov.uk/government/publications/assessment-objectives-ancient-languages-geography-and-mfl/gcse-as-and-a-level-assessment-objectives)
- [GCSE Subject Level Guidance for Citizenship Studies (Ofqual)](https://assets.publishing.service.gov.uk/media/5a7f3806ed915d74e62291c9/gcse-subject-level-guidance-for-citizenship-studies.pdf)
- [DfE GCSE Citizenship subject content (May 2022)](https://assets.publishing.service.gov.uk/media/6287a835d3bf7f1f433ae19a/GCSE_subject_content_citizenship_studies_May_2022.pdf)

### AQA 8100

- [Scheme of assessment](https://www.aqa.org.uk/subjects/citizenship-studies/gcse/citizenship-studies-8100/specification/scheme-of-assessment)
- [Specification at a glance](https://www.aqa.org.uk/subjects/citizenship-studies/gcse/citizenship-studies-8100/specification/specification-at-a-glance)
- [Active citizenship subject content](https://www.aqa.org.uk/subjects/citizenship-studies/gcse/citizenship-studies-8100/specification/subject-content/active-citizenship)
- [Command words](https://www.aqa.org.uk/resources/citizenship-studies/gcse/citizenship-studies/teach/command-words)
- [Paper 1 sample mark scheme](https://filestore.aqa.org.uk/resources/citizenship/AQA-81001-SMS.PDF)
- [Paper 2 sample mark scheme](https://filestore.aqa.org.uk/resources/citizenship/AQA-81002-SMS.PDF)
- [Paper 1 mark scheme November 2021](https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/2021/november/AQA-81001-MS-NOV21.PDF)
- [Investigation portfolio guidance](https://filestore.aqa.org.uk/resources/citizenship/AQA-8100-INVESTIGATION.PDF)

### Edexcel 1CS0

- [Specification (Issue 2)](https://qualifications.pearson.com/content/dam/pdf/GCSE/Citizenship%20Studies/2016/Specification%20and%20sample%20assessments/specification-gcse-l1-l2-in-citizenship.pdf)
- [Exemplars and level marking guidance (Paper 2)](https://qualifications.pearson.com/content/dam/pdf/GCSE/Citizenship%20Studies/2016/teaching-and-learning-materials/GCSE-Citizenship-Exemplars-Paper-2.pdf)
- [Examiners' report June 2023 (Paper 2)](https://qualifications.pearson.com/content/dam/pdf/GCSE/Citizenship%20Studies/2016/Exam-materials/1cs0-02-pef-20230824.pdf)
- [6-mark source question exemplars (2024)](https://qualifications.pearson.com/content/dam/secure/silver/all-uk-and-international/gcse/citizenship-studies/2016/teaching-and-learning-materials/edexcel-gcse-citizenship-studies-2024-6-mark-source-question-exemplars.pdf)

### OCR J270

- [Assessment materials and mark schemes](https://www.ocr.org.uk/qualifications/gcse/citizenship-studies-j270-from-2016/assessment/)

### Teacher practice

- [Association for Citizenship Teaching: Successful GCSE Citizenship Teaching](https://www.teachingcitizenship.org.uk/event/successful-citizenship-teaching-level-2/)
- [ACT: Teaching GCSE Citizenship for the first time (CPD)](https://www.teachingcitizenship.org.uk/event/on-demand-cpd-teaching-gcse-citizenship-studies-for-the-first-time/)

---

*Machine-readable data: `assets/data/tutor-level-framework.json`. Visual map: `CITIZENSHIP-ASSESSMENT-MAP.md`. Integrated in `student.html` under `assessmentFramework.tutorBands`.*
