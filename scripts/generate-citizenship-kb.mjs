#!/usr/bin/env node
/**
 * One-off generator for Citizenship knowledge base topic files.
 * Run: node scripts/generate-citizenship-kb.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../assets/data/knowledge");

/**
 * Topic JSON schema (optional enrichment fields):
 * - keywords: string[] — high-weight match terms
 * - aliases: string[] — alternate topic names
 * - faqs: { patterns: string[], answer: string, levelMax?, levelMin? }[]
 * - slides: { [slideIndex]: { title?, terms?, hint?, script?, opener?, faqs? } }
 * - misconceptions: { wrong: string, correction: string, patterns?: string[] }[]
 * - commandWords: { [word]: { template: string, levelMin? } }
 */
function topic(meta, levels, enrichment = {}) {
  return { ...meta, ...enrichment, levels };
}

/** Shared enrichment for lesson-1 (hand-authored; extend per topic as needed). */
const BRITISH_IDENTITY_ENRICHMENT = {
  keywords: ["tolerance", "respect", "England", "Scotland", "Wales", "Northern Ireland", "identity", "British values", "community", "migration", "cohesion"],
  aliases: ["four nations", "four countries", "British values", "who am I", "life in modern Britain"],
  faqs: [
    { patterns: ["what is identity", "what does identity mean"], levelMax: 3, answer: "Identity means who you feel you are. It can include your roles, background, and the communities you belong to." },
    { patterns: ["what is tolerance", "what does tolerance mean"], levelMax: 4, answer: "Tolerance means accepting that other people may think, believe, or live differently from you, and treating them fairly anyway." },
    { patterns: ["four countries", "four nations"], answer: "The UK is made up of England, Scotland, Wales, and Northern Ireland." },
  ],
  commandWords: {
    define: { template: "To define a term: write one clear sentence for what it means, then give one example from UK life." },
    explain: { template: "To explain: state the idea, then say why it matters with a concrete example." },
    evaluate: { levelMin: 6, template: "To evaluate: give two sides of the argument, use evidence, then reach a clear judgement." },
  },
};

const NEW_TOPICS = [
  topic(
    {
      topicId: "equality-act-discrimination",
      topicTitle: "Respect, Discrimination, and the Equality Act 2010",
      moduleId: "module-1",
      lessonIds: ["lesson-2"],
    },
  {
    "1": {
      summary: "Discrimination means treating someone unfairly because of who they are. In the UK, the law says this is wrong.",
      keyPoints: [
        "Everyone deserves respect at school and in public.",
        "Bullying someone because of their skin, faith, or disability is unfair.",
        "Teachers and adults should help stop discrimination.",
      ],
      explainLike: "One idea: being mean to someone because they are different is not okay. The law agrees with that.",
    },
    "2": {
      summary: "The Equality Act 2010 protects people from discrimination. Protected characteristics include age, disability, gender, race, religion, and sexual orientation.",
      keyPoints: [
        "Direct discrimination = treating someone worse because of a protected characteristic.",
        "Indirect discrimination = a rule that looks fair but hurts one group more.",
        "Schools must follow equality law in admissions and behaviour policies.",
      ],
      explainLike: "Here is the pattern: name the unfair treatment, name the protected characteristic, say why the law protects them.",
    },
    "3": {
      summary: "The Equality Act helps people live together fairly. Harassment and victimisation are also illegal under the Act.",
      keyPoints: [
        "Harassment = unwanted behaviour that violates dignity or creates a hostile environment.",
        "Victimisation = punishing someone for complaining about discrimination.",
        "Positive action (not positive discrimination) can help disadvantaged groups access opportunities.",
      ],
      explainLike: "Because the Act lists protected characteristics, you can link one example to one legal term — that builds a clear answer.",
    },
    "4": {
      summary: "Apply the Equality Act to school, work, and service scenarios. Distinguish lawful positive action from unlawful positive discrimination.",
      keyPoints: [
        "Employers must make reasonable adjustments for disabled workers.",
        "Service providers (shops, hospitals) cannot refuse service based on protected characteristics.",
        "Gender pay gap reporting is one way law tackles workplace inequality.",
      ],
      explainLike: "Step 1: What happened? Step 2: Which protected characteristic? Step 3: Direct or indirect? That earns AO2 marks.",
    },
    "5": {
      summary: "Explain how anti-discrimination law supports community cohesion and individual rights in modern Britain.",
      keyPoints: [
        "Equality law backs British values of mutual respect and tolerance.",
        "Trade unions and citizens can challenge discrimination through tribunals and courts.",
        "Media representation affects whether minority groups feel included.",
      ],
      explainLike: "Use because/therefore: discrimination divides communities; therefore the Equality Act protects cohesion by giving legal remedies.",
    },
    "6": {
      summary: "Discuss whether UK equality law is effective, considering enforcement gaps, unconscious bias, and online hate.",
      keyPoints: [
        "EHRC (Equality and Human Rights Commission) promotes and enforces equality.",
        "Online abuse can be a hate crime when motivated by hostility to a protected group.",
        "Critics argue law alone cannot change attitudes without education.",
      ],
      explainLike: "Both sides: law gives rights and courts, but prejudice can persist — your judgement weighs evidence.",
    },
    "7": {
      summary: "Exam focus: define discrimination types (AO1), apply Equality Act to a scenario (AO2), evaluate effectiveness (AO3).",
      keyPoints: [
        "Command word 'explain' — point plus developed example from UK context.",
        "Use case-style facts: workplace, school uniform, service refusal.",
        "Sentence starter: 'This may constitute direct discrimination because…'",
      ],
      explainLike: "Nia tip: 4-mark explain = one legal term + one fact from the scenario + one sentence development.",
    },
    "8": {
      summary: "Analyse intersectionality — how overlapping characteristics (e.g. race and gender) shape discrimination experiences and policy responses.",
      keyPoints: [
        "Intersectional analysis examines compound disadvantage not visible in single-category law.",
        "Institutional racism (Macpherson report) showed systemic failures in public bodies.",
        "Evaluate whether single-characteristic law captures lived experience.",
      ],
      explainLike: "Weigh whether the Equality Act's structure fully addresses complex inequality — use evidence, not slogans.",
    },
    "9": {
      summary: "Evaluate the extent to which legal equality secures social equality in the UK, integrating British values, media, and active citizenship.",
      keyPoints: [
        "Substantiated judgement: law necessary but insufficient without cultural change.",
        "Compare formal rights with outcomes in employment, policing, and education data.",
        "Synthesis: link Equality Act to HRA, Prevent, and community cohesion debates.",
      ],
      explainLike: "Athena level: sustained argument across themes — rights on paper versus equality experienced — conclude with precision.",
    },
  }),

  topic(
    {
      topicId: "human-rights-sources",
      topicTitle: "Human Rights: Sources and Protection",
      moduleId: "module-1",
      lessonIds: ["lesson-3"],
    },
  {
    "1": {
      summary: "Human rights are basic freedoms every person should have, like being safe and treated fairly.",
      keyPoints: [
        "Rights belong to people because they are human — not because a government gives them.",
        "Examples: right to life, not to be hurt, to go to school.",
        "Governments should protect these rights.",
      ],
      explainLike: "One small step: human rights are rules about how everyone should be treated, everywhere.",
    },
    "2": {
      summary: "The Universal Declaration of Human Rights (1948) lists rights after the Second World War. The UK also protects rights in law.",
      keyPoints: [
        "UDHR is international — it influenced many countries.",
        "European Convention on Human Rights (ECHR, 1950) protects rights in Europe.",
        "Human Rights Act 1998 brings ECHR rights into UK law.",
      ],
      explainLike: "Copy the pattern: global rights (UDHR) → European rights (ECHR) → UK law (HRA).",
    },
    "3": {
      summary: "Key ECHR rights include life, liberty, fair trial, privacy, and freedom of expression. Rights can be limited in a democratic society.",
      keyPoints: [
        "Article 10 protects free speech but allows limits for public safety and others' rights.",
        "Article 8 protects private and family life.",
        "Limitations must be lawful, necessary, and proportionate.",
      ],
      explainLike: "Link one right to one limit: you can speak freely, but not to threaten violence — that is proportionate.",
    },
    "4": {
      summary: "The Human Rights Act lets UK courts apply ECHR rights. Public bodies must respect rights in their decisions.",
      keyPoints: [
        "Courts can issue a declaration of incompatibility if UK law breaches rights.",
        "Parliament remains sovereign — it can change law after such a declaration.",
        "Rights apply to NHS care, policing, schools, and local councils.",
      ],
      explainLike: "Four steps: name the right, name the public body, describe the breach, say what court can do.",
    },
    "5": {
      summary: "Explain why human rights matter in democracy and how UK law balances rights with community safety.",
      keyPoints: [
        "HRA strengthens accountability of state power.",
        "Rights protect minorities against majority opinion.",
        "Debate continues on reform or a British Bill of Rights.",
      ],
      explainLike: "GCSE vocabulary: proportionality, public authority, ECHR Article — apply each to a real UK example.",
    },
    "6": {
      summary: "Discuss tensions between security and liberty using counter-terrorism, surveillance, or protest scenarios.",
      keyPoints: [
        "TPIMs and terrorism legislation restrict some freedoms for security.",
        "Courts and Parliament debate whether limits are proportionate.",
        "Civil liberties groups argue rights should not be permanently eroded.",
      ],
      explainLike: "Theo style: security need on one side, liberty on the other — which evidence tips your judgement?",
    },
    "7": {
      summary: "AO labels: state Article number (AO1), apply to scenario facts (AO2), evaluate whether balance is fair (AO3).",
      keyPoints: [
        "'State' questions: Article 10 freedom of expression, Article 6 fair trial.",
        "Develop: right + legal limit + example from case or news.",
        "Evaluate starter: 'To a significant extent, however…'",
      ],
      explainLike: "Examiner thinking: generic 'human rights are good' earns little — tie Article to the scenario given.",
    },
    "8": {
      summary: "Analyse UK human rights architecture post-Brexit: retained EU law, ECHR membership, and reform proposals.",
      keyPoints: [
        "UK remains in ECHR — not an EU requirement.",
        "European Court of Human Rights in Strasbourg hears individual applications.",
        "Reform debates weigh sovereignty against protection standards.",
      ],
      explainLike: "Challenge assumptions: leaving the EU did not automatically leave the ECHR — analyse each institution separately.",
    },
    "9": {
      summary: "Evaluate whether the UK's human rights framework delivers justice for all citizens, with selective cross-theme synthesis.",
      keyPoints: [
        "Compare UDHR ideals with detention, asylum, and digital privacy practice.",
        "Weigh parliamentary sovereignty against judicial protection.",
        "Grade 8–9: coherent evaluative conclusion without contradiction.",
      ],
      explainLike: "Mastery: judge the system using rights theory, institutions, and lived outcomes — not a list of Articles.",
    },
  }),

  topic(
    {
      topicId: "local-councils",
      topicTitle: "Local Councils: Democracy in Your Area",
      moduleId: "module-1",
      lessonIds: ["lesson-5"],
    },
  {
    "1": {
      summary: "Your local council runs services near where you live, like bins, parks, and libraries.",
      keyPoints: [
        "Councillors are elected to represent your area.",
        "Council tax helps pay for local services.",
        "You can contact your councillor about local problems.",
      ],
      explainLike: "Your council is like the team that looks after your neighbourhood — roads, schools support, and leisure.",
    },
    "2": {
      summary: "UK local government includes county, district, and unitary councils. Councillors make decisions in committees and full council meetings.",
      keyPoints: [
        "Mayors (some cities) or council leaders head the executive.",
        "Council meetings are usually public — transparency in action.",
        "Local elections use different cycles to general elections.",
      ],
      explainLike: "Model answer: councillors are elected → they decide budgets → officers deliver services.",
    },
    "3": {
      summary: "Councils raise money through council tax, business rates, and central government grants. They must balance spending with local needs.",
      keyPoints: [
        "Council tax bands depend on property value.",
        "Adult social care and children's services are major costs.",
        "Devolution gives some regions more local spending power.",
      ],
      explainLike: "One reason, one example: council tax funds services like waste collection in your street.",
    },
    "4": {
      summary: "Local democracy lets citizens influence planning, transport, and youth services through consultations, petitions, and scrutiny committees.",
      keyPoints: [
        "Planning applications for new buildings go through council processes.",
        "Overview and scrutiny committees check executive decisions.",
        "Parish and town councils handle very local issues in some areas.",
      ],
      explainLike: "Structured steps: identify the service, name the council body, say how a citizen can respond.",
    },
    "5": {
      summary: "Explain how local government connects citizens to democracy between general elections.",
      keyPoints: [
        "Turnout in local elections is often lower than general elections — a participation challenge.",
        "Councils must publish spending and decisions for accountability.",
        "Youth councils give young people a voice before age 18.",
      ],
      explainLike: "Because local decisions affect daily life, therefore voting locally matters even when national politics feels distant.",
    },
    "6": {
      summary: "Discuss funding pressures on councils: austerity, social care demand, and whether council tax is fair.",
      keyPoints: [
        "Section 114 notices mean a council cannot balance its budget — rare but serious.",
        "Council tax rises are capped without referendums in England.",
        "Debate: richer areas vs deprived areas — equal services?",
      ],
      explainLike: "Both sides: local control is democratic, but uneven funding creates postcode lotteries.",
    },
    "7": {
      summary: "Exam technique: describe council roles (AO1), apply to a local issue scenario (AO2), evaluate democratic accountability (AO3).",
      keyPoints: [
        "Distinguish ceremonial mayor from elected metro mayors with devolved powers.",
        "Use 'explain' structure: service + council duty + citizen action.",
        "Evaluate low turnout — causes and solutions.",
      ],
      explainLike: "Nia: 2 marks for naming council function + 2 for developed local example.",
    },
    "8": {
      summary: "Analyse metro mayors, combined authorities, and devolution deals reshaping local power in England.",
      keyPoints: [
        "Greater Manchester and West Midlands have elected mayors with transport and skills budgets.",
        "Tension: central government control vs local autonomy.",
        "Compare English two-tier system with Scottish/Welsh unitary models.",
      ],
      explainLike: "Analyse who gains power — Whitehall, regional mayor, or district council — when structures change.",
    },
    "9": {
      summary: "Evaluate whether local government in the UK delivers effective, accountable democracy for diverse communities.",
      keyPoints: [
        "Integrate finance, representation, and active citizenship themes.",
        "Judgement on whether local voice is real or symbolic under austerity.",
        "Selective evidence — answer the question, not everything about councils.",
      ],
      explainLike: "Synthesis: local democracy as laboratory for participation — judge with evidence on outcomes, not ideals alone.",
    },
  }),
];

// Write first batch (module 1 new topics) — more batches appended below via additional arrays
const BATCH2 = [
  topic(
    {
      topicId: "political-parties-government",
      topicTitle: "Political Parties and Forming a Government",
      moduleId: "module-2",
      lessonIds: ["lesson-7"],
    },
  {
    "1": {
      summary: "Political parties are groups with shared ideas who try to win elections and run the country.",
      keyPoints: ["The main UK parties include Conservatives, Labour, and Liberal Democrats.", "Party members choose policies and leaders.", "The party with most MPs usually forms the government."],
      explainLike: "Parties are teams with plans — voters pick which team's plan they prefer.",
    },
    "2": {
      summary: "After a general election, the monarch invites the leader of the largest party to become Prime Minister and form a government.",
      keyPoints: ["MPs from the governing party usually become ministers.", "The opposition parties scrutinise government.", "Coalitions form when no party has a majority."],
      explainLike: "Most MPs wins → their leader becomes PM → they pick a Cabinet to run departments.",
    },
    "3": {
      summary: "Parties raise money through membership, donations, and campaigning. Manifestos set out promises before elections.",
      keyPoints: ["Manifesto = policy programme voters can judge.", "Backbench MPs are party members not in the government.", "Whips encourage MPs to vote with party line."],
      explainLike: "Link manifesto promise to voter choice — one reason people pick a party.",
    },
    "4": {
      summary: "The UK party system is dominated by two main parties but includes national parties (SNP, Plaid Cymru) and smaller UK-wide parties.",
      keyPoints: ["FPTP helps large parties win seats.", "Hung parliament may need confidence-and-supply deals.", "Opposition holds government to account in PMQs and committees."],
      explainLike: "Step: election result → seat count → government formation → opposition role.",
    },
    "5": {
      summary: "Explain how parties link citizens to law-making and why party discipline affects parliamentary debate.",
      keyPoints: ["Parties aggregate diverse views into coherent programmes.", "Rebellions on key votes can threaten government majority.", "Select committees investigate policy across party lines."],
      explainLike: "Because parties organise votes, therefore they shape which laws pass — but MPs can sometimes break ranks.",
    },
    "6": {
      summary: "Discuss whether two-party politics serves UK democracy or whether smaller parties should have more influence.",
      keyPoints: ["Pro FPTP: stable government, clear accountability.", "Anti: wasted votes, under-representation (e.g. UKIP 2015 vote share vs seats).", "Reform options: AMS, STV in devolved elections."],
      explainLike: "Probe both sides — stability versus fairness of representation.",
    },
    "7": {
      summary: "AO focus: define hung parliament/coalition (AO1), apply to election scenarios (AO2), evaluate party system (AO3).",
      keyPoints: ["Sentence starter: 'A hung parliament occurs when…'", "2010 Conservative–Lib Dem coalition as AO2 example.", "Discuss questions need balanced paragraphs."],
      explainLike: "Turn a good point into full marks: name concept + election fact + consequence for government.",
    },
    "8": {
      summary: "Analyse party funding, lobbying, and media influence on democratic legitimacy.",
      keyPoints: ["Electoral Commission regulates party finance.", "Donor transparency debates — undue influence?", "Social media targeting changes campaign strategy."],
      explainLike: "Challenge assumption that more parties automatically means better democracy — examine money and access.",
    },
    "9": {
      summary: "Evaluate whether political parties remain the best vehicle for democratic participation in a fragmented media age.",
      keyPoints: ["Synthesis: parties, pressure groups, and direct action.", "Judgement on membership decline vs digital activism rise.", "Substantiated conclusion on representation quality."],
      explainLike: "Grade 8–9: weigh parties' organising role against disengagement and alternative participation channels.",
    },
  }),

  topic(
    {
      topicId: "parliament-law-making",
      topicTitle: "Parliament and How Laws Are Made",
      moduleId: "module-2",
      lessonIds: ["lesson-8"],
    },
  {
    "1": {
      summary: "Parliament is where MPs meet to debate and make laws for the UK.",
      keyPoints: ["House of Commons = elected MPs.", "House of Lords = appointed and hereditary members (being reformed).", "A bill becomes law when both Houses agree and the King gives Royal Assent."],
      explainLike: "A law starts as an idea (bill), gets debated, voted on, then the King signs it — then it is an Act.",
    },
    "2": {
      summary: "Most new laws start as bills introduced by government ministers. MPs and Lords can amend bills during readings and committee stages.",
      keyPoints: ["First Reading = bill introduced.", "Second Reading = principle debated.", "Committee Stage = detailed line-by-line scrutiny."],
      explainLike: "Follow the stages in order — each stage is a chance to change or block the bill.",
    },
    "3": {
      summary: "Private Members' Bills allow backbench MPs to propose laws. The Lords can delay but not permanently block most bills.",
      keyPoints: ["Parliamentary ping-pong when Houses disagree.", "Salisbury convention: Lords rarely block manifesto bills.", "Statutory instruments make detailed rules under Acts."],
      explainLike: "Because Commons is elected, therefore it has final say on money and most legislation.",
    },
    "4": {
      summary: "Law-making involves government, Parliament, and sometimes devolved legislatures. The Supreme Court interprets Acts.",
      keyPoints: ["Devolved matters: Scotland/Wales/NI make own laws in transferred areas.", "Reserved matters stay at Westminster.", "Judicial review checks lawfulness of government action."],
      explainLike: "Four-step law journey: proposal → draft bill → Parliament stages → Royal Assent → enforcement.",
    },
    "5": {
      summary: "Explain how Parliament holds government to account during law-making through debate, votes, and committees.",
      keyPoints: ["Opposition days and urgent questions.", "Public Bill Committees hear expert evidence.", "Lords expertise can improve draft law quality."],
      explainLike: "GCSE chain: scrutiny improves law because flaws are found before Royal Assent.",
    },
    "6": {
      summary: "Discuss whether the House of Lords should be elected or abolished.",
      keyPoints: ["Current strengths: experience, revision, less party pressure.", "Weaknesses: lack of democratic mandate, size, appointments.", "Reform attempts: Blair partial reform, ongoing debate."],
      explainLike: "Both-sides thinking with a reasoned conclusion — not just 'elect everyone'.",
    },
    "7": {
      summary: "Exam: outline legislative process (AO1), apply stages to a scenario bill (AO2), evaluate democratic legitimacy (AO3).",
      keyPoints: ["Command 'outline' — ordered stages with brief detail.", "Ping-pong as AO2 vocabulary.", "Evaluate: how much backbench influence is real?"],
      explainLike: "Nia: list stages for AO1 marks; add one example amendment for AO2.",
    },
    "8": {
      summary: "Analyse executive dominance in law-making — manifesto pledges, whips, and limited time for backbench bills.",
      keyPoints: ["Government controls timetable in Commons.", "Henry VIII powers in some bills allow ministers to change law without full debate.", "Parliament Acts 1911/1949 restrict Lords blocking power."],
      explainLike: "Examine whether Parliament legislates or mainly ratifies government plans.",
    },
    "9": {
      summary: "Evaluate the effectiveness of UK parliamentary law-making for representative democracy and rights protection.",
      keyPoints: ["Integrate HRA, devolution, and rule of law.", "Judgement on scrutiny versus speed in crises.", "Selective case: e.g. Online Safety Act passage."],
      explainLike: "Synthesis across democracy theme — law-making as heart of citizenship participation.",
    },
  }),

  topic(
    {
      topicId: "uk-constitution-monarchy",
      topicTitle: "The UK Constitution and the Monarchy",
      moduleId: "module-2",
      lessonIds: ["lesson-9"],
    },
  {
    "1": {
      summary: "The UK has a King as head of state, but elected politicians run the government day to day.",
      keyPoints: ["The King opens Parliament and meets the PM.", "Constitution = rules about how the country is run.", "UK constitution is mostly unwritten — in laws and conventions."],
      explainLike: "The King is a symbol; MPs and ministers make political decisions.",
    },
    "2": {
      summary: "Key constitutional principles include parliamentary sovereignty, rule of law, and constitutional monarchy.",
      keyPoints: ["Parliament can make or unmake any law.", "Monarch acts on advice of ministers — royal prerogative limited.", "Conventions are unwritten rules politicians follow."],
      explainLike: "Gap-fill pattern: sovereignty = Parliament supreme; monarchy = ceremonial + formal roles.",
    },
    "3": {
      summary: "Sources of the UK constitution include statutes (e.g. Parliament Acts), common law, conventions, and EU law (retained after Brexit).",
      keyPoints: ["Magna Carta (1215) symbolises limits on power — historical not operative alone.", "Uncodified = flexible but harder to see all rules at once.", "Cabinet manual explains government conventions."],
      explainLike: "One source, one example: Parliament Acts limit Lords — that is written constitutional law.",
    },
    "4": {
      summary: "The monarch's formal powers include granting Royal Assent and appointing PM; in practice ministers decide policy.",
      keyPoints: ["Bagehot: monarch has 'right to be consulted, to encourage, to warn'.", "Prerogative powers on treaties and defence exercised by PM/Cabinet.", "Supreme Court can review prerogative use (Miller cases)."],
      explainLike: "Apply: who really decides war or treaties? Executive using prerogative, scrutinised by Parliament and courts.",
    },
    "5": {
      summary: "Explain advantages and disadvantages of an uncodified constitution for democracy and rights.",
      keyPoints: ["Flexibility to adapt without difficult amendment process.", "Risk: executive power less visible; conventions can break.", "No single document citizens can easily read."],
      explainLike: "Because/therefore: flexible constitution adapts fast, therefore crises can be managed — but rights may be less entrenched.",
    },
    "6": {
      summary: "Discuss republic versus monarchy arguments in modern UK — cost, symbolism, democracy, tourism, Commonwealth role.",
      keyPoints: ["Republicans: hereditary head of state undemocratic.", "Monarchists: stability, continuity, non-partisan symbol.", "Crown neutrality in political debate."],
      explainLike: "Probing question: does monarchy help or hinder democratic equality in 2020s Britain?",
    },
    "7": {
      summary: "AO exam work: define sovereignty and prerogative (AO1), apply Miller judgement facts (AO2), evaluate uncodified system (AO3).",
      keyPoints: ["'Define parliamentary sovereignty' — 2 marks identification + development.", "Miller (2019): prorogation unlawful — courts check executive.", "Evaluate starter for 8-mark questions."],
      explainLike: "Examiner: credit conventions if explained with example — not just 'unwritten rules'.",
    },
    "8": {
      summary: "Analyse constitutional change pressures: devolution, Brexit, judicial review, and proposed reforms.",
      keyPoints: ["Brexit highlighted sovereignty debates with devolved nations.", "Bill of Rights proposals and HRA reform.", "Whether codification would strengthen accountability."],
      explainLike: "Weigh flexibility against clarity — use post-2016 events as evidence.",
    },
    "9": {
      summary: "Evaluate whether the UK's constitutional arrangements secure democratic accountability and citizen understanding.",
      keyPoints: ["Synthesis: monarchy, Parliament, courts, devolution.", "Judgement on citizen literacy about constitutional rules.", "Grade 8–9 sustained evaluative line."],
      explainLike: "Mastery: constitution as living practice — judge institutions, conventions, and public trust together.",
    },
  }),
];

const BATCH3 = [
  topic({ topicId: "devolution", topicTitle: "Devolution: Scotland, Wales, and Northern Ireland", moduleId: "module-2", lessonIds: ["lesson-10"] }, {
    "1": { summary: "Devolution means some powers moved from London to Scotland, Wales, and Northern Ireland.", keyPoints: ["Each nation has its own parliament or assembly.", "They make laws on things like health and education in their area.", "The UK Parliament still controls defence and foreign policy."], explainLike: "London handles UK-wide issues; Edinburgh, Cardiff, and Belfast handle more local decisions." },
    "2": { summary: "Scotland has the Scottish Parliament; Wales has the Senedd; Northern Ireland has the Assembly. Each has different powers.", keyPoints: ["Scotland Act, Government of Wales Act, Northern Ireland Act set powers.", "Some taxes are devolved (e.g. Scottish income tax rates).", "MLAs, MSPs, and MSs are elected to devolved bodies."], explainLike: "Model: nation → devolved institution → examples of devolved policy (schools, NHS organisation)." },
    "3": { summary: "Devolution created multiple governments within one UK state. This affects identity, elections, and law.", keyPoints: ["West Lothian question: Scottish MPs vote on England-only laws at Westminster.", "Sewel convention: Westminster normally needs consent on devolved matters.", "Brexit strained devolution settlements."], explainLike: "One reason devolution matters: laws on education can differ in Cardiff and London." },
    "4": { summary: "Compare reserved and devolved matters. Explain how devolution interacts with UK-wide citizenship.", keyPoints: ["Reserved: immigration, defence, macroeconomic policy.", "Devolved: health, transport, some justice (Scotland).", "England has no separate parliament — English laws via UK Parliament."], explainLike: "Step: classify the policy area → name which legislature decides → give a real example." },
    "5": { summary: "Explain why devolution was introduced and its impact on democracy and national identity.", keyPoints: ["1997 referendums led to Scottish Parliament and Welsh Assembly.", "Good Friday Agreement (1998) restored NI Assembly.", "Devolution responds to nationalist and regional demands within union."], explainLike: "Because voters wanted local decisions, therefore power was shared — but the UK remains one state." },
    "6": { summary: "Discuss independence versus devolution debates in Scotland and Wales.", keyPoints: ["2014 Scottish independence referendum: 55% remain in UK.", "Arguments for independence: self-determination, policy control.", "Arguments against: economic union, shared institutions, complexity."], explainLike: "Both sides with evidence — not slogans — then a reasoned view on future of the union." },
    "7": { summary: "Exam: define devolution (AO1), apply to policy scenarios (AO2), evaluate union stability (AO3).", keyPoints: ["Distinguish federal (US) from devolved (UK) systems.", "Sentence starter: 'This matter is devolved because…'", "Evaluate: does devolution strengthen or weaken UK democracy?"], explainLike: "Nia: 4-mark explain needs named nation + institution + policy example." },
    "8": { summary: "Analyse asymmetric devolution and the English question — regional mayors without English Parliament.", keyPoints: ["NI power-sharing requires unionist/nationalist balance.", "Sewel/consent debates after Internal Market Act.", "Federalism proposals versus status quo."], explainLike: "Examine uneven power map — who is represented at which level?" },
    "9": { summary: "Evaluate whether devolution has improved democratic representation across the UK's nations.", keyPoints: ["Synthesis: identity, elections, Brexit, active citizenship.", "Judgement on democratic deficit in England.", "Selective use of referendum and turnout data."], explainLike: "Mastery: union as negotiated project — judge with evidence on voice and outcomes." },
  }),
  topic({ topicId: "taxation-budget", topicTitle: "Taxation and Government Spending", moduleId: "module-2", lessonIds: ["lesson-11"] }, {
    "1": { summary: "Government needs money from taxes to pay for schools, hospitals, and roads.", keyPoints: ["Income tax is taken from earnings.", "VAT is added to many purchases.", "National Insurance helps fund some benefits."], explainLike: "Taxes are how the country collects money to run services everyone uses." },
    "2": { summary: "The Chancellor presents the Budget. Parliament votes on tax and spending plans.", keyPoints: ["HM Treasury sets fiscal policy.", "Public spending includes NHS, defence, education.", "Borrowing covers gap when spending exceeds tax revenue."], explainLike: "Budget pattern: government plans spending → Commons approves → services funded." },
    "3": { summary: "Taxes can be direct (income tax) or indirect (VAT). Progressive taxes take a higher share from higher earners.", keyPoints: ["Income tax bands in England/Wales set at Budget.", "Council tax funds local services.", "Corporation tax on company profits."], explainLike: "Link tax type to who pays: income tax from workers, VAT from shoppers." },
    "4": { summary: "Government choices on tax and spend affect inequality, growth, and public services. Citizens debate fairness.", keyPoints: ["Redistribution via tax credits and benefits.", "Austerity (2010s) reduced some departmental budgets.", "Office for Budget Responsibility forecasts finances."], explainLike: "Four steps: policy choice → who pays → who benefits → citizenship opinion." },
    "5": { summary: "Explain why taxation is a citizenship issue linking rights to responsibilities.", keyPoints: ["Tax funds universal NHS and state education.", "Tax avoidance/evasion reduce money for public goods.", "Democratic consent: MPs approve Budget."], explainLike: "Because public services need funding, therefore paying tax is a shared responsibility." },
    "6": { summary: "Discuss whether higher taxes on wealth or income would improve fairness.", keyPoints: ["Pro: fund services, reduce inequality.", "Con: may discourage investment or business.", "Use examples: NHS funding crises, cost of living."], explainLike: "Theo: weigh economic arguments against social justice goals." },
    "7": { summary: "AO exam: identify taxes (AO1), apply Budget choices to scenario (AO2), evaluate fairness (AO3).", keyPoints: ["Define progressive/regressive tax.", "Develop: tax + service link + citizen impact.", "'Evaluate' needs supported judgement on trade-offs."], explainLike: "Examiner: name a tax, explain who bears burden, judge if system is fair." },
    "8": { summary: "Analyse fiscal devolution and Barnett formula funding for Scotland, Wales, NI.", keyPoints: ["Barnett determines changes in block grants.", "Debates on needs-based versus population formula.", "Devolved administrations set some taxes."], explainLike: "Challenge: is UK funding formula equitable across nations?" },
    "9": { summary: "Evaluate whether UK tax and spend policy delivers social justice in a citizenship framework.", keyPoints: ["Integrate rights, inequality data, political choices.", "Judgement on intergenerational debt and climate spend.", "Coherent evaluative conclusion."], explainLike: "Synthesis: wallet of the nation reflects values — judge whose interests prevail." },
  }),
  topic({ topicId: "purpose-of-law", topicTitle: "The Purpose of Law and Legal Age Limits", moduleId: "module-3", lessonIds: ["lesson-12"] }, {
    "1": { summary: "Laws are rules made by society to keep people safe and treat everyone fairly.", keyPoints: ["Laws say what you can and cannot do.", "Age limits protect young people — e.g. age to drive, vote, buy alcohol.", "Breaking criminal law can lead to punishment."], explainLike: "Laws are like school rules for the whole country — they protect and guide." },
    "2": { summary: "Law serves purposes: protect harm, resolve disputes, set standards, and protect rights.", keyPoints: ["Criminal law punishes behaviour harming society.", "Civil law settles disputes between people or organisations.", "Legal ages reflect when society thinks someone is ready."], explainLike: "Copy pattern: purpose → example law → age limit (16 work, 18 vote, 10 criminal responsibility in England)." },
    "3": { summary: "Age of criminal responsibility in England and Wales is 10. Other ages mark rights and responsibilities.", keyPoints: ["16: work, consent, lottery; 17: drive learner; 18: vote, buy alcohol, adult court.", "Laws change as society's views change.", "UN recommends higher minimum age for criminal responsibility."], explainLike: "One age, one right: 18 → vote — link number to citizenship duty." },
    "4": { summary: "Apply purposes of law to scenarios: harm prevention, contracts, consumer protection, online safety.", keyPoints: ["Sale of Goods Act protects buyers.", "Employment law sets minimum wage and working hours for young workers.", "Online harms laws aim to protect children."], explainLike: "Scenario steps: identify harm → name law purpose → say likely legal outcome." },
    "5": { summary: "Explain why societies need law and how it balances freedom with protection.", keyPoints: ["Without law, stronger groups could dominate.", "Law encodes moral standards but is not identical to morality.", "Reform campaigns change unjust laws over time."], explainLike: "GCSE chain: law limits liberty slightly to protect everyone's rights long term." },
    "6": { summary: "Discuss whether age 10 for criminal responsibility is appropriate.", keyPoints: ["Pro low age: accountability for serious harm.", "Con: child development, UNCRC, youth justice welfare.", "Compare with Scotland (12) and other countries."], explainLike: "Both sides — child welfare versus public protection — reasoned conclusion." },
    "7": { summary: "Exam: state purposes (AO1), apply to age-limit scenario (AO2), evaluate law's role (AO3).", keyPoints: ["Command 'give' — list purposes with brief expansion.", "Link UNCRC to youth law debates.", "Evaluate whether law always achieves justice."], explainLike: "Nia: 2 marks per developed purpose with example." },
    "8": { summary: "Analyse how law reflects and shapes social values — slavery abolition, equality reforms.", keyPoints: ["Law lagging behind social change (historical examples).", "Judges interpret law in changing contexts.", "Parliamentary law-making versus common law."], explainLike: "Examine whether law leads or follows public opinion." },
    "9": { summary: "Evaluate the extent to which UK law fulfils its purposes for young citizens.", keyPoints: ["Synthesis: rights, youth justice, participation.", "Judgement on protective versus punitive approach.", "Selective evidence on age limits."], explainLike: "Mastery: law as citizenship contract — judge for young people in practice." },
  }),
  topic({ topicId: "police-courts", topicTitle: "Police, Magistrates, and Judges", moduleId: "module-3", lessonIds: ["lesson-14"] }, {
    "1": { summary: "Police help keep people safe and investigate crimes. Courts decide if someone broke the law.", keyPoints: ["Call 999 in emergencies; 101 for non-emergencies.", "Magistrates are volunteers who hear many cases.", "Judges hear serious cases in Crown Court."], explainLike: "Police find facts; courts decide guilt and punishment fairly." },
    "2": { summary: "UK police forces are locally organised. CPS prosecutes criminal cases. Courts are independent.", keyPoints: ["Magistrates' Court: summary offences, some either-way.", "Crown Court: serious crimes, jury trials.", "Supreme Court is highest appeal court for UK law."], explainLike: "Model: crime reported → police investigate → CPS charges → court trial." },
    "3": { summary: "Police powers include arrest and stop and search — must be used lawfully. Defendants can have lawyers.", keyPoints: ["PACE 1984 regulates police powers.", "Legal aid may fund defence lawyers.", "Jury of 12 in Crown Court criminal trials."], explainLike: "Because police power is strong, therefore law limits how they use it." },
    "4": { summary: "Civil courts (County Court, High Court) handle disputes — different from criminal courts.", keyPoints: ["Claimant versus defendant in civil cases.", "Lower burden of proof in civil cases (balance of probabilities).", "Appeals go to Court of Appeal then Supreme Court."], explainLike: "Step: criminal (state v accused) versus civil (person v person) — different courts and outcomes." },
    "5": { summary: "Explain how independent courts uphold rule of law and fair trial rights.", keyPoints: ["Judiciary independent from government pressure.", "Open justice — public hearings where possible.", "HRA Article 6 right to fair trial."], explainLike: "Therefore independent judges protect fairness when government or police accuse citizens." },
    "6": { summary: "Discuss stop and search — crime prevention versus discrimination concerns.", keyPoints: ["Section 1 PACE requires reasonable grounds.", "Disproportionate use on minority communities criticised.", "Body-worn cameras increase accountability."], explainLike: "Weigh safety benefits against rights and equality impacts." },
    "7": { summary: "Exam: outline court structure (AO1), apply process to scenario (AO2), evaluate fairness (AO3).", keyPoints: ["Magistrates versus district judge.", "AO2: match offence seriousness to court.", "Evaluate access to justice and legal aid cuts."], explainLike: "Nia: diagram court hierarchy in words for describe questions." },
    "8": { summary: "Analyse court backlogs, digital justice, and diversity of judiciary.", keyPoints: ["Delays affect justice principle.", "Online pleas and video hearings post-COVID.", "Judicial diversity statistics — representation debates."], explainLike: "Examine whether system delivers equal justice in practice." },
    "9": { summary: "Evaluate whether UK policing and courts secure justice for all communities.", keyPoints: ["Synthesis: rule of law, equality, youth justice.", "Institutional bias evidence and reform proposals.", "Substantiated judgement."], explainLike: "Mastery: institutions on paper versus trust in communities." },
  }),
  topic({ topicId: "civil-criminal-law", topicTitle: "Civil Law and Criminal Law", moduleId: "module-3", lessonIds: ["lesson-15"] }, {
    "1": { summary: "Criminal law is about crimes against society. Civil law settles disputes between people or companies.", keyPoints: ["Criminal: theft, assault — police may be involved.", "Civil: broken contract, divorce, compensation claims.", "Criminal guilt can mean prison; civil usually means paying damages."], explainLike: "Criminal = breaking rules that hurt society; civil = disagreement between parties." },
    "2": { summary: "Criminal cases: prosecution must prove guilt beyond reasonable doubt. Civil: claimant proves on balance of probabilities.", keyPoints: ["Prosecution brought by state (CPS).", "Defendant may have solicitor/barrister.", "Civil remedies: compensation, injunctions."], explainLike: "Pattern: higher proof bar in criminal because liberty is at stake." },
    "3": { summary: "Types of offences: summary, either-way, indictable. Civil areas include tort, contract, family law.", keyPoints: ["Either-way offences can be heard in magistrates or Crown Court.", "Tort = civil wrong causing harm (e.g. negligence).", "Same act can be criminal and civil (e.g. assault)."], explainLike: "One scenario, two systems: attack someone → criminal charges and civil compensation claim." },
    "4": { summary: "Apply distinctions to scenarios: shoplifting, libel, unpaid debts, discrimination claims.", keyPoints: ["Employment tribunal for workplace disputes.", "Small claims track for lower-value civil cases.", "ACAS conciliation before some employment claims."], explainLike: "Four steps: facts → criminal or civil? → parties → likely outcome." },
    "5": { summary: "Explain why society treats criminal and civil law differently.", keyPoints: ["State monopoly on punishment protects order.", "Civil allows private dispute resolution.", "Human rights protect defendants in criminal process."], explainLike: "Because criminal conviction affects liberty, therefore proof standard is higher." },
    "6": { summary: "Discuss whether civil law is accessible enough for ordinary citizens.", keyPoints: ["Legal costs barrier for many claimants.", "Legal aid limited in civil cases.", "Alternative dispute resolution: mediation, arbitration."], explainLike: "Both sides: courts provide justice but cost may block access." },
    "7": { summary: "Exam: define terms (AO1), classify scenarios (AO2), evaluate access (AO3).", keyPoints: ["Beyond reasonable doubt vs balance of probabilities — must define accurately.", "Classify command: match facts to law type.", "Evaluate legal aid policy."], explainLike: "Examiner rewards precise vocabulary — do not swap criminal/civil processes." },
    "8": { summary: "Analyse overlap: corporate crime, regulatory enforcement, ombudsmen.", keyPoints: ["FCA, HSE can fine — regulatory not always criminal.", "Ombudsman schemes for public services complaints.", "Class actions emerging in UK civil justice."], explainLike: "Examine blurred lines — not every wrong is a crime." },
    "9": { summary: "Evaluate whether UK legal distinctions deliver fair outcomes for victims and defendants.", keyPoints: ["Synthesis: punishment aims, rights, youth justice.", "Judgement on two-tier access to justice.", "Coherent conclusion."], explainLike: "Mastery: dual system strengths and structural inequality." },
  }),
];

const BATCH4 = [
  topic({ topicId: "youth-justice", topicTitle: "The Youth Justice System", moduleId: "module-3", lessonIds: ["lesson-16"] }, {
    "1": { summary: "Young people who break the law are often treated differently from adults to help them change.", keyPoints: ["Youth Offending Teams work with young offenders.", "Courts aim to prevent reoffending.", "Parents may be involved in hearings."], explainLike: "The system tries to guide young people back on track, not only punish." },
    "2": { summary: "Youth courts handle most cases against 10–17 year olds. Sentences include referrals, fines, and youth rehabilitation orders.", keyPoints: ["Youth court for less serious cases.", "Crown Court for very serious youth crimes.", "Anonymity protects young defendants."], explainLike: "Model: offence → youth court → sentence focused on rehabilitation." },
    "3": { summary: "Welfare principle: youth justice should consider child's best interests and UNCRC.", keyPoints: ["ASBOs largely replaced by civil injunctions.", "Diversion schemes avoid court for low-level cases.", "Custody is last resort for youth."], explainLike: "Because children are developing, therefore law emphasises support and education." },
    "4": { summary: "Apply youth justice stages: arrest, interview (appropriate adult), charge, bail, trial, sentence.", keyPoints: ["Appropriate adult required during police interview.", "Youth Detention Accommodation for custody.", "Victim-offender mediation in some cases."], explainLike: "Step through process — name each safeguard for young people." },
    "5": { summary: "Explain aims of youth justice: reduce reoffending, protect public, help rehabilitation.", keyPoints: ["Youth Justice Board oversees system in England/Wales.", "Education in custody matters for outcomes.", "Knife crime orders and prevention programmes."], explainLike: "GCSE therefore chain: rehabilitate → fewer future victims → safer communities." },
    "6": { summary: "Discuss whether young offenders should receive lighter treatment than adults.", keyPoints: ["Pro: maturity, education, lower reoffending if rehabilitated.", "Con: serious harm requires strong response.", "Age of criminal responsibility debate links here."], explainLike: "Both sides with examples — serious violence versus first minor offence." },
    "7": { summary: "Exam: describe youth court (AO1), apply process (AO2), evaluate effectiveness (AO3).", keyPoints: ["Name YOT and appropriate adult roles.", "Scenario: identify likely sentence.", "Evaluate reoffending rates and racial disproportionality."], explainLike: "Nia: link welfare principle to sentence choice in scenario." },
    "8": { summary: "Analyse disproportionality — BAME youth in stop and search and custody.", keyPoints: ["Lammy Review recommendations on youth justice.", "School exclusion links to criminalisation debates.", "Restorative justice models."], explainLike: "Examine whether system treats all young people equally." },
    "9": { summary: "Evaluate whether UK youth justice balances welfare and justice for society.", keyPoints: ["Synthesis: law purposes, punishment, rights.", "Judgement on prevention versus punishment.", "Selective statistics."], explainLike: "Mastery: youth justice as citizenship test — how society treats its young." },
  }),
  topic({ topicId: "punishment-aims", topicTitle: "Aims and Types of Punishment", moduleId: "module-3", lessonIds: ["lesson-17"] }, {
    "1": { summary: "Punishment is what happens when someone is found guilty of breaking the law.", keyPoints: ["Aims include stopping crime and protecting people.", "Types: fines, community service, prison.", "Punishment should be fair for the crime."], explainLike: "Punishment tries to protect society and show breaking rules has consequences." },
    "2": { summary: "Four main aims: retribution, deterrence, rehabilitation, and protection of the public.", keyPoints: ["Retribution = deserved payback.", "Deterrence = discourage offender and others.", "Rehabilitation = help change behaviour."], explainLike: "Gap-fill each aim with one sentence example." },
    "3": { summary: "Sentences must fit crime — proportionality. Judges use sentencing guidelines.", keyPoints: ["Community orders combine punishment and rehabilitation.", "Suspended sentences avoid immediate custody.", "Life sentences for most serious murders."], explainLike: "Link aim to sentence: community service → rehabilitation + some retribution." },
    "4": { summary: "Apply aims to scenarios: theft, violent crime, corporate fraud.", keyPoints: ["Custodial sentences costly — rehabilitation programmes inside.", "Fines proportionate to means where possible.", "Victim statements influence sentencing."], explainLike: "Scenario: identify aims judges might prioritise and why." },
    "5": { summary: "Explain debates on prison effectiveness and alternatives.", keyPoints: ["UK prison overcrowding concerns.", "Reoffending rates after short sentences.", "Restorative justice involves victim and offender meeting."], explainLike: "Because rehabilitation reduces reoffending, therefore investment in education in prison matters." },
    "6": { summary: "Discuss death penalty — UK abolished 1965; global human rights context.", keyPoints: ["ECHR Protocol 13 abolishes death penalty in Europe.", "Arguments for/against in other countries.", "UK opposes death penalty diplomatically."], explainLike: "Human rights lens — irreversible punishment and deterrence evidence debated." },
    "7": { summary: "Exam: state aims (AO1), apply to sentence choice (AO2), evaluate prison (AO3).", keyPoints: ["Define four aims precisely.", "Discuss question structure: paragraph per viewpoint.", "Use reoffending data cautiously."], explainLike: "Nia: 'evaluate' needs aim named + evidence + judgement." },
    "8": { summary: "Analyse whole-life orders, minimum sentences, and youth sentencing differences.", keyPoints: ["Mandatory minimums limit judicial discretion.", "Ethics of punishing young adults versus juveniles.", "Private prison debates."], explainLike: "Examine whether mandatory sentences improve justice or fairness." },
    "9": { summary: "Evaluate whether UK sentencing balances aims of punishment for victims and society.", keyPoints: ["Synthesis: rule of law, rights, youth justice.", "Judgement on restorative versus punitive culture.", "Substantiated conclusion."], explainLike: "Mastery: punishment policy reflects society's values — judge holistically." },
  }),
  topic({ topicId: "petitions-boycotts-media", topicTitle: "Petitions, Boycotts, and Digital Participation", moduleId: "module-4", lessonIds: ["lesson-18"] }, {
    "1": { summary: "Citizens can speak up by signing petitions, boycotting products, or posting on social media.", keyPoints: ["Petition asks leaders to change something.", "Boycott = refusing to buy to protest.", "Peaceful protest is a democratic right."], explainLike: "Three ways to be heard: ask (petition), spend (boycott), share (social media)." },
    "2": { summary: "UK Parliament considers petitions with 100,000+ signatures for debate. Local councils accept petitions too.", keyPoints: ["petition.parliament.uk is official.", "Boycotts target companies or countries.", "Social media can spread campaigns fast."], explainLike: "Model: issue → petition signatures → debate or government response." },
    "3": { summary: "Digital tools lower barriers to participation but raise misinformation risks.", keyPoints: ["Clicktivism may be shallow engagement.", "Hashtags coordinate global campaigns.", "Echo chambers reinforce one-sided views."], explainLike: "One benefit, one risk: fast reach versus false claims spreading." },
    "4": { summary: "Apply lawful participation limits: harassment, incitement, and defamation online.", keyPoints: ["Public Order Act limits violent protest.", "Online abuse can be criminal.", "Successful campaigns use evidence and allies."], explainLike: "Steps: goal → lawful tactic → audience → measure response." },
    "5": { summary: "Explain how petitions and boycotts influence decision-makers in democracy.", keyPoints: ["MPs track constituency petition numbers.", "Economic pressure can change corporate policy.", "Media coverage amplifies campaigns."], explainLike: "Therefore elected representatives respond when many voters care visibly." },
    "6": { summary: "Discuss whether online activism creates real change or only awareness.", keyPoints: ["Pro: mobilises youth, low cost, rapid.", "Con: slacktivism, algorithms, polarisation.", "Examples: climate strikes, consumer boycotts."], explainLike: "Weigh awareness versus concrete policy wins." },
    "7": { summary: "Exam: define boycott (AO1), apply tactics to scenario (AO2), evaluate digital democracy (AO3).", keyPoints: ["Distinguish petition from referendum.", "Suggest lawful actions for given issue.", "Evaluate representation of all groups online."], explainLike: "Nia: 'suggest' needs realistic, legal citizenship actions." },
    "8": { summary: "Analyse government e-petition responses and selective engagement.", keyPoints: ["Government may decline to act despite signatures.", "Astroturfing fake grassroots campaigns.", "Data protection in campaign apps."], explainLike: "Examine power imbalance between citizens and institutions." },
    "9": { summary: "Evaluate whether digital participation strengthens UK democracy.", keyPoints: ["Synthesis: media, pressure groups, active citizenship.", "Judgement on inclusion and manipulation.", "Coherent evaluative line."], explainLike: "Mastery: democracy in the feed — judge quality not just quantity of voice." },
  }),
  topic({ topicId: "pressure-groups-unions", topicTitle: "Pressure Groups and Trade Unions", moduleId: "module-4", lessonIds: ["lesson-19"] }, {
    "1": { summary: "Pressure groups try to change government policy without standing for election.", keyPoints: ["Insider groups work closely with government.", "Outsider groups use protests and media.", "Trade unions represent workers' pay and conditions."], explainLike: "Groups speak for one cause — like the environment or workers' rights." },
    "2": { summary: "Methods include lobbying, demonstrations, legal action, and strikes (unions).", keyPoints: ["CND, RSPCA, Greenpeace are examples.", "Unions: Unison, Unite negotiate with employers.", "Sectional groups represent interests; promotional groups represent causes."], explainLike: "Pattern: group → method → example success or failure." },
    "3": { summary: "Pluralist view: many groups compete so no single voice dominates. Critics cite unequal resources.", keyPoints: ["Business groups may have more access than small charities.", "Insider status can co-opt groups.", "Strike law regulates industrial action ballots."], explainLike: "Because wealthy groups lobby more, therefore influence may be uneven." },
    "4": { summary: "Apply group types to scenarios: NHS campaign, climate policy, teachers' pay dispute.", keyPoints: ["ACLU-style human rights groups use courts.", "Think tanks influence political parties.", "Minimum ballot turnout for lawful strikes."], explainLike: "Classify group, name method, predict government response." },
    "5": { summary: "Explain how pressure groups complement political parties in democracy.", keyPoints: ["Groups specialise deeply on one issue.", "Parties must cover wide manifesto.", "Direct action raises salience of neglected issues."], explainLike: "Therefore groups give citizens voice between elections." },
    "6": { summary: "Discuss whether insider groups undermine democracy or improve policy.", keyPoints: ["Pro: expertise, stable consultation.", "Con: opaque influence, corporate bias.", "Transparency registers for lobbyists."], explainLike: "Both sides — access versus accountability." },
    "7": { summary: "Exam: define insider/outsider (AO1), apply to case study (AO2), evaluate influence (AO3).", keyPoints: ["Trade union role in workplace rights.", "Compare sectional versus promotional.", "Evaluate with specific UK example."], explainLike: "Nia: case study answers need named group + action + outcome." },
    "8": { summary: "Analyse union membership decline and new movements (e.g. gig economy organising).", keyPoints: ["Anti-union laws and public sector pay disputes.", "Social media organising outside traditional unions.", "Human rights and employment law overlap."], explainLike: "Examine whether worker voice is weaker than in past decades." },
    "9": { summary: "Evaluate whether pressure groups and unions make UK democracy more representative.", keyPoints: ["Synthesis: media, petitions, Parliament.", "Judgement on pluralism versus elitism.", "Substantiated conclusion."], explainLike: "Mastery: who really influences policy — map power carefully." },
  }),
  topic({ topicId: "press-freedom-media", topicTitle: "Free Press and Media Power", moduleId: "module-4", lessonIds: ["lesson-20"] }, {
    "1": { summary: "A free press can report news and criticise government without being stopped.", keyPoints: ["Newspapers, TV, and websites inform the public.", "Media can investigate wrongdoing.", "Fake news means false stories spread as if true."], explainLike: "Free press is like a watchdog — it barks when powerful people do wrong." },
    "2": { summary: "UK media includes BBC (public service), private press, and social platforms. Regulation varies.", keyPoints: ["Ofcom regulates broadcasters.", "IPSO regulates most newspapers.", "BBC charter sets independence duties."], explainLike: "Model: source → regulator → why independence matters for democracy." },
    "3": { summary: "Media influences voting, opinions, and stereotypes. Bias can be political or commercial.", keyPoints: ["Tabloid versus broadsheet traditions.", "Ownership concentration — few companies own many titles.", "Social algorithms personalise news feeds."], explainLike: "One effect: media sets agenda — tells people what to think about." },
    "4": { summary: "Apply media literacy: check sources, compare reports, spot propaganda techniques.", keyPoints: ["Defamation law limits false harmful claims.", "Official Secrets Act protects some state information.", "Leveson Inquiry examined press ethics after phone hacking."], explainLike: "Steps to test a story: who wrote it, evidence, other outlets, expert checks." },
    "5": { summary: "Explain why free press supports democracy but needs ethical limits.", keyPoints: ["Informs voters before elections.", "Holds government to account.", "Harms: intrusion, hate, misinformation."], explainLike: "Therefore press freedom must balance with privacy and accuracy duties." },
    "6": { summary: "Discuss whether social media companies should regulate content more strictly.", keyPoints: ["Pro: reduce harm, foreign interference.", "Con: free speech, censorship fears.", "Online Safety Act duties on platforms."], explainLike: "Weigh harm prevention against open debate." },
    "7": { summary: "Exam: define free press (AO1), analyse source (AO2), evaluate media role (AO3).", keyPoints: ["Source questions: bias, purpose, audience.", "Command 'analyse' — effect on democracy.", "Use Leveson or BBC impartiality examples."], explainLike: "Nia: source answer = content + purpose + reliability judgement." },
    "8": { summary: "Analyse public service broadcasting versus commercial incentives.", keyPoints: ["BBC licence fee debate.", "Local news decline.", "Global streaming changes UK media landscape."], explainLike: "Examine whether market delivers informed citizenship." },
    "9": { summary: "Evaluate whether UK media serves democratic citizenship in the digital age.", keyPoints: ["Synthesis: participation, rights, globalisation.", "Judgement on misinformation resilience.", "Coherent conclusion."], explainLike: "Mastery: media ecology shapes democracy — judge with evidence." },
  }),
];

const BATCH5 = [
  topic({ topicId: "un-nato-commonwealth", topicTitle: "The UN, NATO, and the Commonwealth", moduleId: "module-4", lessonIds: ["lesson-21"] }, {
    "1": { summary: "Countries work together in organisations to keep peace, trade, and help each other.", keyPoints: ["UN = United Nations — nearly all countries.", "NATO = military alliance of European/North American allies.", "Commonwealth = mainly former British Empire members cooperating."], explainLike: "Three clubs of countries with different jobs — peace, defence, cooperation." },
    "2": { summary: "UN bodies include General Assembly and Security Council. UK is permanent five member with veto.", keyPoints: ["UN promotes human rights and development goals.", "NATO Article 5: attack on one is attack on all.", "Commonwealth Games and shared legal traditions."], explainLike: "Copy: UN peace → NATO defence → Commonwealth cultural/economic links." },
    "3": { summary: "UK foreign policy uses these forums. UN peacekeeping, NATO collective defence, Commonwealth soft power.", keyPoints: ["Security Council veto shapes responses to wars.", "UK meets NATO 2% GDP defence spending target (debated).", "Commonwealth heads of government meetings."], explainLike: "One UK role in each org — peacekeeping vote, NATO member, Commonwealth host." },
    "4": { summary: "Apply organisations to scenarios: humanitarian crisis, invasion of ally, climate cooperation.", keyPoints: ["UN agencies: UNICEF, WHO.", "NATO not automatic war — political decisions.", "Commonwealth lacks enforcement power — voluntary."], explainLike: "Match crisis to best organisation and explain limits." },
    "5": { summary: "Explain UK membership benefits and responsibilities in global governance.", keyPoints: ["UN Security Council seat gives influence.", "NATO commits UK forces to alliance.", "Soft power via Commonwealth English language links."], explainLike: "Therefore UK balances national interest with international obligations." },
    "6": { summary: "Discuss whether UN is effective at preventing war.", keyPoints: ["Veto blocks action (e.g. Syria debates).", "Successes: humanitarian aid, disease programmes.", "Reform proposals for Security Council."], explainLike: "Both sides — structure limits versus real achievements." },
    "7": { summary: "Exam: state roles (AO1), apply to conflict scenario (AO2), evaluate UN/NATO (AO3).", keyPoints: ["Distinguish UN versus NATO purposes.", "Use Ukraine or peacekeeping examples carefully.", "Evaluate with specific evidence."], explainLike: "Nia: do not confuse EU, UN, NATO, Council of Europe." },
    "8": { summary: "Analyse UK aid, arms sales, and ethical foreign policy tensions.", keyPoints: ["DFID merged into FCDO — aid budget debates.", "Arms to conflict zones criticised.", "International law and sovereignty."], explainLike: "Examine hypocrisy claims — rights rhetoric versus trade interests." },
    "9": { summary: "Evaluate UK's role in international organisations as global citizenship.", keyPoints: ["Synthesis: conflict, rights, media.", "Judgement on moral leadership versus interest.", "Substantiated conclusion."], explainLike: "Mastery: global actor ethics — judge consistently." },
  }),
  topic({ topicId: "council-of-europe", topicTitle: "Council of Europe and the European Convention on Human Rights", moduleId: "module-4", lessonIds: ["lesson-22"] }, {
    "1": { summary: "The Council of Europe protects human rights in Europe. It is separate from the European Union.", keyPoints: ["46 member states including UK.", "Created ECHR — European Convention on Human Rights.", "European Court of Human Rights in Strasbourg."], explainLike: "Council of Europe = rights club; EU = different economic/political union." },
    "2": { summary: "UK helped draft ECHR after WWII. Human Rights Act 1998 embeds Convention rights in UK courts.", keyPoints: ["Individuals can take UK to ECtHR after UK remedies exhausted.", "Not the same as European Court of Justice (EU — historical).", "Brexit did not end UK Council of Europe membership."], explainLike: "Pattern: ECHR rights → HRA in UK → Strasbourg court as backstop." },
    "3": { summary: "Key rights: life, torture ban, fair trial, privacy, expression. Margin of appreciation allows national variation.", keyPoints: ["Article 3 absolute ban on torture.", "Article 8 family life cases.", "Parliament must consider Strasbourg judgments."], explainLike: "One Article, one case type: Article 6 → unfair trial claims." },
    "4": { summary: "Apply distinction: Council of Europe (rights), EU (was economic union), UN (global).", keyPoints: ["ECHR enforcement via ECtHR judgments.", "UK compliance sometimes requires law change.", "Reform debates: British Bill of Rights."], explainLike: "Scenario: identify which body handles human rights breach claim." },
    "5": { summary: "Explain why UK remains in ECHR system and debates on leaving.", keyPoints: ["HRA allows domestic human rights cases.", "Some politicians criticise 'foreign court' overrides.", "Northern Ireland Good Friday Agreement references ECHR."], explainLike: "Therefore leaving ECHR would have constitutional and diplomatic consequences." },
    "6": { summary: "Discuss whether Strasbourg court should override UK Parliament.", keyPoints: ["Sovereignty arguments.", "Protection for minorities arguments.", "Examples: prisoner voting, deportation cases."], explainLike: "Weigh democracy versus rights protection." },
    "7": { summary: "Exam: define Council of Europe (AO1), apply HRA (AO2), evaluate membership (AO3).", keyPoints: ["Common confusion: Council of Europe ≠ EU Council.", "State difference between ECtHR and UK Supreme Court.", "Evaluate with NI peace process link."], explainLike: "Nia: precision on institution names earns AO1." },
    "8": { summary: "Analyse proposed HRA repeal/replace and impact on devolution settlements.", keyPoints: ["Scottish and Welsh continuity bills on rights.", "International reputation and trade deals.", "Select committee evidence on reforms."], explainLike: "Examine unintended consequences of rights reform." },
    "9": { summary: "Evaluate whether ECHR membership serves UK citizens and rule of law.", keyPoints: ["Synthesis: constitution, devolution, global role.", "Judgement on reform versus retention.", "Grade 8–9 argument."], explainLike: "Mastery: rights architecture as political choice — judge substantively." },
  }),
  topic({ topicId: "global-conflict-uk-response", topicTitle: "Global Conflict: UK Foreign Policy Responses", moduleId: "module-4", lessonIds: ["lesson-23"] }, {
    "1": { summary: "When wars or disasters happen abroad, the UK may send aid, impose sanctions, or work with allies.", keyPoints: ["Sanctions punish regimes economically.", "Humanitarian aid helps civilians.", "UK military action needs lawful authority."], explainLike: "UK toolbox: help people, pressure governments, sometimes use force with allies." },
    "2": { summary: "PM and Cabinet lead foreign policy. Parliament votes on major military action (convention).", keyPoints: ["UN authorisation sought for collective security.", "NATO Article 5 collective defence.", "Armed Forces Covenant supports veterans."], explainLike: "Model: crisis → diplomatic response → possible sanctions → military last resort." },
    "3": { summary: "Types of response: diplomacy, sanctions, peacekeeping, military intervention, refugee programmes.", keyPoints: ["Economic sanctions hit trade and finance.", "UN peacekeepers monitor ceasefires.", "Refugee resettlement schemes."], explainLike: "Match tool to goal: stop aggression versus help victims." },
    "4": { summary: "Apply just war principles and international law to UK action scenarios.", keyPoints: ["Legitimate authority, just cause, proportionality.", "Iraq 2003 and Libya 2011 debated in citizenship.", "War Powers reform calls."], explainLike: "Steps: legal basis, aim, likely harms, alternatives exhausted?" },
    "5": { summary: "Explain tensions between national interest, alliances, and human rights in UK responses.", keyPoints: ["Special relationship with USA influences choices.", "Aid budget versus domestic spending.", "Media and public opinion shape PM decisions."], explainLike: "Therefore UK policy balances ethics, security, and economy." },
    "6": { summary: "Discuss whether UK should intervene militarily in humanitarian crises.", keyPoints: ["Responsibility to Protect doctrine.", "Risk of escalation and civilian harm.", "Afghanistan evacuation lessons."], explainLike: "Both sides — save lives versus unintended consequences." },
    "7": { summary: "Exam: define sanctions (AO1), apply response options (AO2), evaluate intervention (AO3).", keyPoints: ["Distinguish bilateral versus UN sanctions.", "Use command 'evaluate' structure.", "Cite NATO/UN roles accurately."], explainLike: "Nia: scenario answers need one response + justification + limitation." },
    "8": { summary: "Analyse UK arms exports, intelligence sharing, and ethical foreign policy.", keyPoints: ["Licences scrutinised after Yemen debates.", "Five Eyes intelligence alliance.", "Soft power via BBC World Service."], explainLike: "Examine consistency between human rights rhetoric and trade." },
    "9": { summary: "Evaluate whether UK foreign policy promotes global citizenship values.", keyPoints: ["Synthesis: UN, media, rights, conflict.", "Judgement on historical and current record.", "Coherent conclusion."], explainLike: "Mastery: UK as global actor — judge with moral and strategic lenses." },
  }),
  topic({ topicId: "issue-selection-research", topicTitle: "Active Citizenship: Choosing and Researching an Issue", moduleId: "module-5", lessonIds: ["lesson-24"] }, {
    "1": { summary: "Active citizenship starts when you pick an issue you care about and learn the facts.", keyPoints: ["Choose something local and realistic.", "Ask: who is affected?", "Find reliable information — not just one website."], explainLike: "One step: pick a problem near you that you could actually help change." },
    "2": { summary: "GCSE active citizenship requires investigation: clear issue, research methods, and evidence.", keyPoints: ["Primary research: surveys, interviews.", "Secondary research: reports, news, statistics.", "Stakeholders = people affected or in power."], explainLike: "Model: issue → research question → gather evidence → note sources." },
    "3": { summary: "Good issues are specific, measurable, and linked to citizenship themes.", keyPoints: ["Avoid too broad ('world peace').", "Consider bias in sources.", "Ethics: consent for interviews, anonymity."], explainLike: "Because narrow issues have clear evidence, therefore your action can be focused." },
    "4": { summary: "Apply research methods to plan: sample size, question design, triangulation.", keyPoints: ["Triangulation = multiple sources agree.", "Government statistics (ONS) as secondary source.", "Document politicians' promises versus outcomes."], explainLike: "Four steps: method → why chosen → data collected → limitation admitted." },
    "5": { summary: "Explain how issue selection affects whether citizenship action succeeds.", keyPoints: ["Feasible scope for school timetable.", "Align with rights, democracy, or law theme.", "Identify decision-maker target (council, MP, headteacher)."], explainLike: "Therefore realistic targeting makes change more likely." },
    "6": { summary: "Discuss strengths and weaknesses of social media as research source.", keyPoints: ["Fast but unverified.", "Useful for young people's views.", "Must corroborate with official data."], explainLike: "Weigh convenience against reliability." },
    "7": { summary: "Exam (Paper 1 Section A): describe investigation (AO1), explain methods (AO2), evaluate reliability (AO3).", keyPoints: ["12-mark questions need investigation detail.", "Name method + justification + limitation.", "Link to citizenship concept (e.g. participation)."], explainLike: "Nia: examiners want YOUR project specifics — not generic textbook investigation." },
    "8": { summary: "Analyse how power mapping identifies who can change your issue.", keyPoints: ["Influence versus interest grid.", "Allies and opponents.", "Timing with elections or council meetings."], explainLike: "Examine whether research leads to realistic strategy." },
    "9": { summary: "Evaluate quality of investigative citizenship as preparation for democratic participation.", keyPoints: ["Synthesis: media literacy, rights, evaluation.", "Judgement on school-based action limits.", "Substantiated conclusion."], explainLike: "Mastery: research rigour underpins credible activism." },
  }),
  topic({ topicId: "campaigning-teamwork", topicTitle: "Campaigning, Teamwork, and Goals", moduleId: "module-5", lessonIds: ["lesson-25"] }, {
    "1": { summary: "A campaign is a planned effort to change something. Teams share jobs to get more done.", keyPoints: ["Set a clear goal.", "Split roles: research, posters, social media.", "Stay peaceful and lawful."], explainLike: "Like a group project: everyone knows the aim and their task." },
    "2": { summary: "SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound.", keyPoints: ["Campaign aims at a decision-maker.", "Tactics: petition, assembly, letter to MP.", "Risk assessment for events."], explainLike: "SMART pattern: what, how many, by when — write your goal that way." },
    "3": { summary: "Teamwork needs communication, deadlines, and resolving disagreement constructively.", keyPoints: ["Record decisions in meetings.", "Inclusive teams hear diverse voices.", "Adult supervision in school projects."], explainLike: "One role each person, one timeline — link to citizenship responsibility." },
    "4": { summary: "Apply campaign planning: message, audience, channel, evaluation metric.", keyPoints: ["Tailor message to audience values.", "Coalitions with other groups add strength.", "Media release template for local press."], explainLike: "Steps: stakeholder → message → tactic → success measure." },
    "5": { summary: "Explain how campaigning links to democratic participation beyond voting.", keyPoints: ["MPs respond to constituency pressure.", "Local councils consult on plans.", "Peaceful protest rights with limits."], explainLike: "Therefore organised campaigns turn research into political influence." },
    "6": { summary: "Discuss why some campaigns fail — poor aims, weak evidence, bad timing.", keyPoints: ["Unrealistic goals demotivate.", "Opposition mobilises better.", "Learning from failure improves citizenship."], explainLike: "Probe what makes change stick versus fade." },
    "7": { summary: "Exam: describe your action plan (AO1), explain choices (AO2), evaluate strategy (AO3).", keyPoints: ["Link tactic to issue and audience.", "Justify teamwork roles.", "12-mark structure: investigation + action + reflection preview."], explainLike: "Nia: every tactic needs 'because' linking to evidence gathered." },
    "8": { summary: "Analyse ethical campaigning — honesty, consent, not harming opponents.", keyPoints: ["Avoid defamation and harassment.", "Transparent funding if raising money.", "Digital consent for photos."], explainLike: "Examine whether ends justify means in citizenship." },
    "9": { summary: "Evaluate whether structured campaigning training strengthens youth democracy.", keyPoints: ["Synthesis: media, pressure groups, rights.", "Judgement on institutional support for youth voice.", "Coherent conclusion."], explainLike: "Mastery: campaigning as skill and responsibility — judge long-term impact." },
  }),
  topic({ topicId: "social-action-project", topicTitle: "Running a Social Action Project", moduleId: "module-5", lessonIds: ["lesson-26"] }, {
    "1": { summary: "Social action means doing something practical to help your community on an issue you studied.", keyPoints: ["Examples: awareness assembly, fundraiser, clean-up.", "Tell people what you learned.", "Work safely with teachers."], explainLike: "You researched the problem — now you do one real thing to help." },
    "2": { summary: "Deliver action then document it: photos (with consent), attendance numbers, feedback forms.", keyPoints: ["Primary evidence for GCSE portfolio/exam.", "Reflect what went well on the day.", "Adapt if weather or permissions change."], explainLike: "Model: plan → deliver → record evidence immediately." },
    "3": { summary: "Lawful action respects school rules, equality, and safety.", keyPoints: ["Permissions for public space events.", "Safeguarding for younger pupils involved.", "Inclusive messaging — avoid discriminating."], explainLike: "Because citizenship respects others, therefore action must be lawful and fair." },
    "4": { summary: "Apply communication skills: speeches, posters, digital posts, meetings with decision-makers.", keyPoints: ["Elevator pitch in 30 seconds.", "Data visualisation on posters.", "Follow-up email after MP meeting."], explainLike: "Match channel to audience: pupils assembly versus councillor briefing." },
    "5": { summary: "Explain how action creates change directly and indirectly.", keyPoints: ["Direct: policy change, money raised.", "Indirect: awareness shifts attitudes.", "Media multiplier effect."], explainLike: "Therefore even small actions can start bigger conversations." },
    "6": { summary: "Discuss obstacles: apathy, opposition, bureaucracy.", keyPoints: ["Build alliances early.", "Use data from research to answer critics.", "Persistence over one term."], explainLike: "Both sides — barriers are normal; strategy overcomes some." },
    "7": { summary: "Exam: describe action taken (AO1), explain impact (AO2), analyse effectiveness (AO3).", keyPoints: ["Specific evidence — numbers, quotes.", "Link back to original issue.", "Analyse others' actions too (exam requirement)."], explainLike: "Nia: vague 'we raised awareness' scores low — quantify and quote." },
    "8": { summary: "Analyse intersection with pressure groups and digital organising.", keyPoints: ["Partner with local charities.", "Hashtag analytics.", "Sustainability after you leave school."], explainLike: "Examine whether action survives beyond project deadline." },
    "9": { summary: "Evaluate whether your social action model could scale to national citizenship.", keyPoints: ["Synthesis: democracy, rights, evaluation.", "Judgement on youth agency limits.", "Substantiated conclusion."], explainLike: "Mastery: local action as democracy laboratory — judge transferability." },
  }),
  topic({ topicId: "evaluating-impact", topicTitle: "Reviewing Impact and Learning from Citizenship Action", moduleId: "module-5", lessonIds: ["lesson-27"] }, {
    "1": { summary: "After your project, ask: did we meet our goal? What did we learn?", keyPoints: ["Compare before and after.", "Listen to feedback.", "Celebrate success and note improvements."], explainLike: "Like reviewing a match — what worked, what to try next time." },
    "2": { summary: "Evaluation uses evidence: surveys, attendance, decision-maker responses, media coverage.", keyPoints: ["Intended versus unintended outcomes.", "Short-term outputs vs long-term change.", "Honest reflection strengthens grades."], explainLike: "Pattern: aim → evidence → met partly/fully → why." },
    "3": { summary: "GCSE requires evaluating your action and others' citizenship examples.", keyPoints: ["AO3 judgement with reasons.", "Compare similar campaigns nationally.", "Limitations: sample size, time constraints."], explainLike: "Because examiners want evaluation, therefore 'it went well' is not enough — prove it." },
    "4": { summary: "Apply evaluation frameworks: reach, depth, durability, influence on policy.", keyPoints: ["Reach = how many people affected.", "Durability = does change last?", "Use stakeholder quotes."], explainLike: "Four criteria scored with evidence from your project." },
    "5": { summary: "Explain difference between success in learning and success in changing policy.", keyPoints: ["Skills gained are valid outcomes.", "Policy change may take years.", "Citizenship builds habits for life."], explainLike: "Therefore partial policy success plus strong learning can still be valuable." },
    "6": { summary: "Discuss how to evaluate another group's campaign fairly.", keyPoints: ["Use their stated aims.", "Evidence not assumptions.", "Acknowledge context differences."], explainLike: "Weigh their methods and results without bias." },
    "7": { summary: "Exam: 12–16 mark evaluation of active citizenship — structure and command words.", keyPoints: ["Intro issue + action summary.", "Paragraphs: success, limitation, comparison.", "Conclude with substantiated judgement.", "Command 'evaluate' / 'assess' / 'to what extent'."], explainLike: "Nia: top band needs sustained judgement throughout, not bolted-on conclusion." },
    "8": { summary: "Analyse how evaluation feeds next cycle of participation — iterative democracy.", keyPoints: ["Lessons for school council.", "Public dashboards for local projects.", "Critical friendship peer review."], explainLike: "Examine evaluation as civic skill not just exam box." },
    "9": { summary: "Evaluate the extent to which active citizenship in schools prepares young people for democratic life.", keyPoints: ["Synthesis across all GCSE themes.", "Counter: tokenism versus empowerment.", "Grade 8–9 nuanced line."], explainLike: "Athena: judge school citizenship against real democratic challenges — insight and precision." },
  }),
];

function writeTopic(t) {
  const file = `${t.topicId}.json`;
  writeFileSync(join(OUT, file), JSON.stringify(t, null, 2) + "\n");
  console.log("Wrote", file);
}

[...NEW_TOPICS, ...BATCH2, ...BATCH3, ...BATCH4, ...BATCH5].forEach(writeTopic);

const INDEX = {
  version: "1.1.0",
  description: "Topic index for level-differentiated Citizenship knowledge. Each topic file holds content keyed by tutor band (levels 1–9). One topic per lesson across 5 modules.",
  topics: [
    { topicId: "british-identity-values", topicTitle: "British Identity and Values", file: "british-identity-values.json", moduleId: "module-1", lessonIds: ["lesson-1"], themes: ["Life in modern Britain", "identity", "British values"] },
    { topicId: "equality-act-discrimination", topicTitle: "Respect, Discrimination, and the Equality Act 2010", file: "equality-act-discrimination.json", moduleId: "module-1", lessonIds: ["lesson-2"], themes: ["Life in modern Britain", "equality", "discrimination"] },
    { topicId: "human-rights-sources", topicTitle: "Human Rights: Sources and Protection", file: "human-rights-sources.json", moduleId: "module-1", lessonIds: ["lesson-3"], themes: ["Rights and responsibilities", "Human Rights Act", "ECHR"] },
    { topicId: "rights-responsibilities", topicTitle: "Rights and Responsibilities", file: "rights-responsibilities.json", moduleId: "module-1", lessonIds: ["lesson-4"], themes: ["Rights and responsibilities", "citizenship in practice"] },
    { topicId: "local-councils", topicTitle: "Local Councils: Democracy in Your Area", file: "local-councils.json", moduleId: "module-1", lessonIds: ["lesson-5"], themes: ["Democracy and participation", "local government"] },
    { topicId: "elections-voting", topicTitle: "Elections and Voting", file: "elections-voting.json", moduleId: "module-2", lessonIds: ["lesson-6"], themes: ["Democracy and participation", "electoral systems"] },
    { topicId: "political-parties-government", topicTitle: "Political Parties and Forming a Government", file: "political-parties-government.json", moduleId: "module-2", lessonIds: ["lesson-7"], themes: ["Democracy and participation", "political parties"] },
    { topicId: "parliament-law-making", topicTitle: "Parliament and How Laws Are Made", file: "parliament-law-making.json", moduleId: "module-2", lessonIds: ["lesson-8"], themes: ["Democracy and participation", "Parliament", "legislation"] },
    { topicId: "uk-constitution-monarchy", topicTitle: "The UK Constitution and the Monarchy", file: "uk-constitution-monarchy.json", moduleId: "module-2", lessonIds: ["lesson-9"], themes: ["Democracy and participation", "constitution", "monarchy"] },
    { topicId: "devolution", topicTitle: "Devolution: Scotland, Wales, and Northern Ireland", file: "devolution.json", moduleId: "module-2", lessonIds: ["lesson-10"], themes: ["Democracy and participation", "devolution"] },
    { topicId: "taxation-budget", topicTitle: "Taxation and Government Spending", file: "taxation-budget.json", moduleId: "module-2", lessonIds: ["lesson-11"], themes: ["Democracy and participation", "taxation", "budget"] },
    { topicId: "purpose-of-law", topicTitle: "The Purpose of Law and Legal Age Limits", file: "purpose-of-law.json", moduleId: "module-3", lessonIds: ["lesson-12"], themes: ["Law and justice", "legal ages"] },
    { topicId: "rule-of-law", topicTitle: "The Rule of Law", file: "rule-of-law.json", moduleId: "module-3", lessonIds: ["lesson-13"], themes: ["Law and justice", "fair trial", "constitutional principles"] },
    { topicId: "police-courts", topicTitle: "Police, Magistrates, and Judges", file: "police-courts.json", moduleId: "module-3", lessonIds: ["lesson-14"], themes: ["Law and justice", "courts", "police"] },
    { topicId: "civil-criminal-law", topicTitle: "Civil Law and Criminal Law", file: "civil-criminal-law.json", moduleId: "module-3", lessonIds: ["lesson-15"], themes: ["Law and justice", "civil and criminal law"] },
    { topicId: "youth-justice", topicTitle: "The Youth Justice System", file: "youth-justice.json", moduleId: "module-3", lessonIds: ["lesson-16"], themes: ["Law and justice", "youth justice"] },
    { topicId: "punishment-aims", topicTitle: "Aims and Types of Punishment", file: "punishment-aims.json", moduleId: "module-3", lessonIds: ["lesson-17"], themes: ["Law and justice", "sentencing"] },
    { topicId: "petitions-boycotts-media", topicTitle: "Petitions, Boycotts, and Digital Participation", file: "petitions-boycotts-media.json", moduleId: "module-4", lessonIds: ["lesson-18"], themes: ["Power and influence", "participation", "digital citizenship"] },
    { topicId: "pressure-groups-unions", topicTitle: "Pressure Groups and Trade Unions", file: "pressure-groups-unions.json", moduleId: "module-4", lessonIds: ["lesson-19"], themes: ["Power and influence", "pressure groups", "trade unions"] },
    { topicId: "press-freedom-media", topicTitle: "Free Press and Media Power", file: "press-freedom-media.json", moduleId: "module-4", lessonIds: ["lesson-20"], themes: ["Power and influence", "media", "free press"] },
    { topicId: "un-nato-commonwealth", topicTitle: "The UN, NATO, and the Commonwealth", file: "un-nato-commonwealth.json", moduleId: "module-4", lessonIds: ["lesson-21"], themes: ["Power and influence", "international organisations"] },
    { topicId: "council-of-europe", topicTitle: "Council of Europe and the European Convention on Human Rights", file: "council-of-europe.json", moduleId: "module-4", lessonIds: ["lesson-22"], themes: ["Rights and responsibilities", "Council of Europe", "ECHR"] },
    { topicId: "global-conflict-uk-response", topicTitle: "Global Conflict: UK Foreign Policy Responses", file: "global-conflict-uk-response.json", moduleId: "module-4", lessonIds: ["lesson-23"], themes: ["Power and influence", "foreign policy", "conflict"] },
    { topicId: "issue-selection-research", topicTitle: "Active Citizenship: Choosing and Researching an Issue", file: "issue-selection-research.json", moduleId: "module-5", lessonIds: ["lesson-24"], themes: ["Active citizenship", "investigation", "research"] },
    { topicId: "campaigning-teamwork", topicTitle: "Campaigning, Teamwork, and Goals", file: "campaigning-teamwork.json", moduleId: "module-5", lessonIds: ["lesson-25"], themes: ["Active citizenship", "campaigning"] },
    { topicId: "social-action-project", topicTitle: "Running a Social Action Project", file: "social-action-project.json", moduleId: "module-5", lessonIds: ["lesson-26"], themes: ["Active citizenship", "social action"] },
    { topicId: "evaluating-impact", topicTitle: "Reviewing Impact and Learning from Citizenship Action", file: "evaluating-impact.json", moduleId: "module-5", lessonIds: ["lesson-27"], themes: ["Active citizenship", "evaluation", "impact"] },
  ],
};

writeFileSync(join(OUT, "index.json"), JSON.stringify(INDEX, null, 2) + "\n");
console.log("Updated index.json with", INDEX.topics.length, "topics");
