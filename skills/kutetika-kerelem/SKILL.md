---
name: kutetika-kerelem
description: Prepare the ELTE TáTK KEAB ethics application by interviewing the researcher and continuously maintaining the keab/kerelem.md working draft in the submission language (hu/en), without creating Word files. Use when the researcher wants to "csináljuk meg a kérelmet", "prepare the application", fill the 7.1/7.2/7.4 forms, or produce the submission; also when the committee sent the application back and it must be revised ("visszaküldték", "megjött a bírálat", "átdolgozásra javasolt", "értékelőlap", "hiánypótlás"). Not for deciding whether approval is needed (use kutetika-engedely) and not for the adversarial review (kutetika-biralat).
---

# kutetika-kerelem — Prepare the KEAB application

You guide a researcher (not a developer) through preparing the ethics application for
the ELTE TáTK Kutatásintegritási, Etikai és Adatkezelési Bizottsága (KEAB). The
deterministic parts (Word files, word counts, formal checks, "mehet" state) belong to
the helper program at `keab/.eszkoz/bin/kutetika.js` — always call it through the CLI
protocol below; never write Word files yourself. Your job is the conversation and the
`keab/kerelem.md` working draft.


In Hungarian, address the researcher informally (tegezés), as the tool itself does.

## Core rules

- The single source of content is `keab/kerelem.md`. The researcher reads and edits it
  freely; you never edit Word files, and you never keep application content only in
  chat.
- Talk to the researcher in the language they use. The submission language is
  independent: ask it explicitly at the start ("Magyarul vagy angolul készüljön a
  beadvány?") and record the choice in `keab/dontesek.md`. All draft answers are
  written in the submission language.
- The researcher is responsible for every decision; warn, never block. Record decisions
  (machine suggestion vs. researcher decision) in `keab/dontesek.md`.

## Working draft lifecycle

- At the start of the session run `node keab/.eszkoz/bin/kutetika.js frissites .` and pass
  any `figyelmeztetesek` to the researcher in plain words (work can always continue).
- Create the empty skeleton with the helper, after the submission language is decided:
  `node keab/.eszkoz/bin/kutetika.js vaz . '{"nyelv":"hu"}'` (or `"en"`). It never
  overwrites an existing `keab/kerelem.md` (answer `mar-letezik`). Never type the
  skeleton by hand.
- After every answer, write it into the draft under the correct `## [id]` heading. Keep
  all `#` and `## [id]` heading lines untouched; the program locates answers by them.
  `<!-- … -->` comments are guidance and are ignored.
- For the participant table (7.1) write one person per line as `Név | Neptun | Szerepkör`
  (a Markdown table with a header row is also accepted).
- Write plain text, not Markdown formatting (`**`, bullet markup): it appears literally
  in the Word file.

## Interviewing

1. Read the project description and the research instruments first (see the data
   protection section below for what you may read).
2. Fill into the draft everything the description already answers — do not re-ask.
3. Ask only for what is missing, in small groups, in the researcher's language. Always
   explicitly ask about the points researchers typically forget:
   - who is the kutatásvezető (must have a PhD; doktorandusz cannot, except with a
     PhD szupervizor assigned by the department head),
   - the kutatásvezető's ELTE e-mail address (…@elte.hu or a faculty address such as
     …@tatk.elte.hu) for the 7.2 e-mail field. The committee asks for an ELTE address
     (this is its practice, not the text of the regulation). If the description or the
     answer gives a private address (e.g. gmail), say so and ask for the ELTE one. If
     the kutatásvezető has none (e.g. an external supervisor), write the existing
     address, record this in `keab/dontesek.md`, and suggest asking the KEAB
     titkárság,
   - institutional director's permission when the research happens in an institution
     (school, kindergarten, hospital) — also add it to the attachment list,
   - minor participants (parental consent forms),
   - data-processing services, especially AI transcription/translation of interviews —
     the service must appear in the 7.4 data processing plan,
   - where data are stored, how long, who has access, what happens after the research.
4. Respect word-count limits stated in the draft's field comments (Szószám) while
   writing answers; the formal check will flag violations.
5. Ask the submission language first, before creating the draft; write the
   `kutetika-kerelem nyelv=` marker accordingly.

## Helper commands

All commands: `node keab/.eszkoz/bin/kutetika.js <command> . '<JSON options>'`. They answer
with one line of JSON. On Windows (PowerShell) quotes inside the JSON may get lost:
write the options to `keab/.beallitas.json` and pass `@keab/.beallitas.json` instead.

| Command | When | Options |
|---|---|---|
| `frissites` | start of session | `{}` or `{"force":true}` |
| `vaz` | create the empty draft | `{"nyelv":"hu"\|"en"}` |
| `atdolgozas-kezd` | start a revision: save the previous submission and the evaluation sheet | `{"ertekelolap":…,"datum":"ÉÉÉÉ-HH-NN","beadott":[…],"azonosito":…,"dontes":…,"visszakuldes":…}` |
| `beolvas` | revision of an application not made with this tool: fill the draft from the submitted Word forms | `{"nyelv":"hu"\|"en","fajlok":{"7.2":…,"7.4":…,"7.1":…}}` |
| `munkaanyag-biralat` | "nézd át" before any Word file exists; never gives "mehet" | `{"asszisztens":…,"subagent":…,"mellekletek":[…]}` |
| `eloallit` | produce the submission | `{"asszisztens":…,"subagent":…,"mellekletek":[…]}` (+ `felulirasMegerosites`) |
| `biralat-rogzit` | record the reviewer's JSON result | the reviewer's JSON as is |
| `biralat-folytat` | the review handoff was lost or interrupted; hand it over again | `{"asszisztens":…,"subagent":…}` |
| `felulbiral` | the researcher overrides objections after a finished review | `{"token":…,"dontesek":[{"azonosito":…,"indok":…}]}` |
| `allapot` | before saying anything about "mehet" | `{}` |

- `asszisztens` is the assistant you are: `"claude"`, `"codex"` or `"copilot"`.
- `subagent` is `true` if you can start a subagent with a clean context (no access to
  this conversation); otherwise `false`.

## Producing the submission

When the researcher asks to produce the submission ("állítsd elő a beadványt"), run in
one step, for example:

```bash
node keab/.eszkoz/bin/kutetika.js eloallit . '{"asszisztens":"claude","subagent":true,"mellekletek":[]}'
```

- `mellekletek` is the agreed attachment list, each item
  `{"fajl":"keab/<name>","hely":"<draft field>","tipus":"kutatasi-eszkoz|tajekoztato|hozzajarulas|toborzas","nemNyersAdat":true}`.
  Agree this list with the researcher first (kutatási eszközök, tájékoztató,
  hozzájáruló nyilatkozatok, toborzó szöveg, igazolások). If there are no attachments,
  pass `[]`. Never list raw research data files.
- The command runs, in order: update check, Word generation from the draft, formal
  checks, and hands the result to the independent reviewer. There is no separate way
  to write Word files — do not try to.
- If it answers `feluliras-megerositest-ker`: a Word file was edited by hand. Tell the
  researcher the manual edit will be lost, suggest moving the fix into `kerelem.md`,
  and only after explicit agreement re-run with the given `felulirasMegerosites`
  token.
- If the answer is `engedelyre-var`, another assistant on this computer could review
  independently. Before anything is sent, explain in plain words what the `tajekoztatas`
  text says: what the second AI provider receives, and how strictly it is confined
  (Claude Code: technically limited to the review folder; Codex: only instructed, it
  could technically read other files on the computer). Ask for an explicit yes or no,
  then run `kulso-engedely` with `{"asszisztens":<the other one>,"engedely":true|false}`
  and `biralat-folytat`. A no is fine: then you review as described below.
- Reviewer handoff, `keres.mod`:
  - `kulso`: the other assistant has already reviewed (this takes a few minutes, tell
    the researcher to wait). If `biralat.allapot` is `sikertelen-biralat`, tell the
    researcher the reason in `biralat.ok` in plain words (e.g. the other assistant is
    not logged in or hit its usage limit). Offer to retry later with `biralat-folytat`,
    or to withdraw the permission (`kulso-engedely` with `false`) so that you review.
  - `subagent`: start a subagent with a clean context, give it only the staging folder
    (`keres.mappa`) and the instruction in `keres.utasitas`; it follows
    `biralo/SKILL.md` there. Record its JSON with `biralat-rogzit`.
  - `uj-beszelgetes`: you cannot review independently here. Tell the researcher in
    plain words: open a new conversation in their assistant, and paste the message you
    prepare for them (the staging folder path and the `keres.utasitas` text). The
    reviewer there returns a JSON block; the researcher copies it back here, and you
    record it with `biralat-rogzit`.
- Objections: explain each in plain words and fix them in `kerelem.md`, then produce
  again. If the researcher decides to keep something despite an objection, ask for
  their reason and record it with `felulbiral` (it is logged in `keab/dontesek.md`).
- If a command answers `Egy másik kutetika-művelet még fut`, wait and retry; do not
  delete files in `keab/`.
- Before submitting, run `node keab/.eszkoz/bin/kutetika.js allapot .` and only report
  "mehet" when the tool itself reports `mehet: true`.

## Revision after the committee's evaluation (átdolgozás)

Use this when the researcher says the committee sent the application back
("visszaküldték", "megjött a bírálat", "átdolgozásra javasolt", "hiánypótlás",
"értékelőlap"). Never search or read the researcher's mailbox: ask for the evaluation
sheet (értékelőlap) as a file in the project folder, or as pasted text.

1. **Read the evaluation sheet** and tell the researcher its decision in plain words.
   If it is a rejection (elutasítás), not a request for revision, say so, cite the
   regulation, and point to the KEAB titkárság (keab@tatk.elte.hu); start a revision
   only if the researcher wants to submit a new application.
2. **Save the previous submission** with `atdolgozas-kezd`:
   - `ertekelolap`: the sheet's path inside the project (ask the researcher to copy it
     into `keab/` if it is elsewhere, e.g. in Letöltések);
   - `datum`: the date the previous version was submitted (ÉÉÉÉ-HH-NN);
   - `beadott`: the submitted files, if the researcher has them in the project; leave
     it out if the last production of this tool was what they submitted (then say so);
   - `azonosito` (e.g. `2026_007_01`), `dontes` (the committee's decision, verbatim) and
     `visszakuldes` (only if the sheet says whom and how to send the revision to).
   The files go to `keab/elozmeny/<date>/` and are never changed afterwards.
3. **No `keab/kerelem.md` yet** (the application was not made with this tool): ask for
   the submitted language and run `beolvas` with the submitted 7.2, 7.4 and 7.1 Word
   files (use the copies in `keab/elozmeny/…`). It fills the draft from the forms and
   returns the fields it could not read reliably (`ellenorizendo`). Name those fields
   to the researcher in plain words; they are marked in the draft with
   `<!-- kutetika: ellenőrizendő: … -->`. After the researcher checks a field, delete
   its marker. Add the other submitted documents (consent form, questionnaire) to the
   attachment list of the next production.
4. **Split the sheet into points** in `keab/atdolgozas.md` (the helper created the
   skeleton). One point per request; a bulleted list in one paragraph is several
   points. For each point: `## [n] short title`, `Állapot: nyitott`, `Érintett:` the
   draft fields (like `7.2/[5]`) and attachments, and under `### A bizottság szövege`
   the committee's words verbatim. Then ask the researcher to compare the list with the
   sheet before you continue. If a request can be read in several ways (e.g. „ELTE-s cím
   megadása szükséges”: e-mail or postal address), list the readings, ask, and if the
   researcher is unsure, suggest asking the titkárság; record the decision in
   `keab/dontesek.md`.
5. **Go through the points one by one**, the weightiest first (kutatásvezető, consent,
   data protection, conflict of interest, then missing attachments and formalities).
   For each: propose a fix, and after the researcher decides, make it in
   `keab/kerelem.md` or as a new attachment. Then set the point's state:
   - `Állapot: javítva` and under `### Mi változott` what changed and where (form and
     question);
   - `Állapot: nem teljesíthető` and under `### Indoklás` the researcher's reason, after
     you have told them the likely consequence. Also record it in `keab/dontesek.md`.
   Write `Mi változott`, `Indoklás` and the optional `# Kísérőszöveg` (a short opening
   for the letter) in the submission language: the response letter is built from them.
   Do not argue with the committee on the researcher's behalf, and never say that
   fixing the points guarantees approval.
   - If the kutatásvezető must change (no PhD), cite the regulation's definition, list
     the options (e.g. the témavezető as kutatásvezető), update every affected field in
     all three forms, and tell the researcher that the new kutatásvezető sends the
     application.
6. **Produce** with `eloallit` as usual. The tool builds the response letter
   (`keab/valaszlevel.md` and a Word file) from `keab/atdolgozas.md`, adds it to the
   attachments, flags open points and missing explanations as formal objections, and
   gives the reviewer the evaluation sheet and the letter so that it can check every
   point. `keab/bead.md` names the previous procedure and how to send the revision.
   If the file names changed (e.g. a new kutatásvezető), the old Word files stay in
   `keab/` and are flagged as earlier outputs. Their copy is safe in
   `keab/elozmeny/…`; tell the researcher, and delete them only after they agree.

## bead.md and sending

The tool writes `keab/bead.md` (recipient, attachments, versions, review result).
Sending is the kutatásvezető's job, digitally signed, from their own address. Never
send anything yourself, and never promise the application will be approved.

## Research data protection

This rule is binding, in this skill and everywhere in this project:

- You may freely read the project description and the research instruments
  (questionnaire, interview guide, information sheet, recruitment text).
- Do not read raw research data by default. Where it is kept is listed in the
  kutetika block of `AGENTS.md` (from `keab/beallitasok.json`). If it has not been
  recorded yet, ask the researcher which folders or files contain raw data and record
  the answer with `node keab/.eszkoz/bin/kutetika.js nyers-adat . '{"helyek":[…]}'`
  (an empty list if there is none). Any other file with responses, recordings,
  transcripts or datasets is raw data too.
- If the ethics application genuinely needs something from raw data (e.g. whether a
  dataset is truly anonymous, or what kinds of data it contains): first tell the
  researcher which file you want to read and why, and that its content will be sent to
  the AI provider. Read it only after the researcher explicitly agrees for this
  occasion and this file. Read only what is needed (e.g. column names, not responses).
- If the researcher declines, do not read it; ask questions instead.
- Record every such permission in `keab/dontesek.md`.
- If the data may contain personal data, warn the researcher that sending it to the AI
  provider is itself data processing and must appear in the data processing plan (7.4).

## Facultative and ethics boundaries

- Do not give legal advice; cite the regulation
  (`keab/.eszkoz/dokumentumok/szabalyzat-*.md`) and point to the KEAB titkárság
  (keab@tatk.elte.hu) for legal questions.
- The 7.5 investigation form is out of scope; so is the 7.3 evaluator form.
- Talk in the researcher's language; write the draft in the submission language.
