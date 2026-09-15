# AI Coach Styles Guide

GeoTrainer’s AI Coach can analyze the **same clue in different ways** depending on what you want to learn.

When you tap **Analyze Clue**, choose one of six coach styles. If Settings contains a preferred style, analysis starts with it immediately; **Always ask before analysis** shows this choice every time:

- ⚡ Quick Guess
- 🎯 Meta Coach
- 🚫 Elimination Coach
- 🌍 Deep Geography
- 🧠 Memory Coach
- 🏆 Pro Analyst

Each coach uses the same scene, but answers a different question.

---

## At a glance

| Coach | Main question | Best for | Typical length |
|---|---|---|---|
| ⚡ Quick Guess | “Where is this probably?” | Fast gameplay | Short |
| 🎯 Meta Coach | “Which clues actually matter in GeoGuessr?” | Learning metas and clue strength | Short–Medium |
| 🚫 Elimination Coach | “What can I rule out?” | No Move and difficult rounds | Medium |
| 🌍 Deep Geography | “Why does this place look like this?” | Deep study and geographic intuition | Medium–Long |
| 🧠 Memory Coach | “How do I make this stick?” | Review and spaced repetition | Medium |
| 🏆 Pro Analyst | “How much should I trust each clue?” | Advanced training | Medium–Long |

---

# ⚡ Quick Guess

## What it does

Quick Guess gives you a fast second opinion without turning the round into a lesson.

It focuses on:

- likely countries
- rough relative confidence
- strongest visible clues
- a concise conclusion

## Best for

- active gameplay
- quick checks
- rapid rounds
- when you do not want a long explanation

## Strengths

- fast
- easy to scan
- low interruption
- useful when you only want a prediction

## Weaknesses

- limited teaching
- may explain **what** fits without deeply explaining **why**
- weaker for long-term memory

## Example

### Scene
Alpine-looking valley, meadow, orchard trees, ordinary Central European houses, steep mountains behind.

### Quick Guess output

**Austria — 35%**  
**Slovenia — 30%**  
**Switzerland — 15%**

Strongest clues:

- steep Alpine relief
- Central European residential architecture
- lush meadow and orchard landscape

**Confidence:** Medium

**Regional read:** Southern Austria / northern Slovenia is plausible, but stronger road or sign evidence is needed.

---

# 🎯 Meta Coach

## What it does

Meta Coach teaches you which visible clues are actually useful in GeoGuessr.

It separates:

- country clues
- regional clues
- elimination clues
- supporting clues
- vibe

It also teaches **confusers** and clue strength.

GeoTrainer may use this clue scale:

- **S — Near-hard / extremely strong**
- **A — Strong**
- **B — Useful**
- **C — Supporting**
- **D — Weak / vibe**

This is a GeoTrainer teaching scale, not an official universal GeoGuessr ranking system.

## Best for

- No Move practice
- learning bollards, poles, road lines and signs
- understanding which clues deserve more weight
- stopping yourself from overcommitting to weak clues

## Strengths

- directly improves gameplay
- teaches clue hierarchy
- highlights confusers
- distinguishes national clues from regional ones

## Weaknesses

- can become memorization-heavy
- some metas change with Street View coverage
- not every distinctive object is a useful national clue

## Example

### Scene
Luxembourg-like forest road with a brown hiking sign and roadside delineator.

### Meta Coach output

### Brown recreational wayfinding sign

**Category:** Signage / recreation infrastructure  
**Strength:** A — Strong if the design is confidently recognized  
**Use:** Country / regional clue  
**Reliability:** Medium–High  
**Confusers:** Germany, Belgium, France

The generic forest is weak evidence. The **sign system** is much more useful because recreational signage can be standardized regionally.

### Roadside delineator

**Category:** Road infrastructure  
**Strength:** B — Useful  
**Use:** Country clue  
**Reliability:** Medium

The post may support Luxembourg, but Germany can be a close confuser depending on reflector details.

### Forest

**Strength:** C — Supporting  
**Use:** Vibe / regional environment

Do not identify Luxembourg from vegetation alone.

---

# 🚫 Elimination Coach

## What it does

Elimination Coach asks:

> **What can this NOT be?**

Instead of immediately forcing a country guess, it reduces the candidate pool and tells you what clue would resolve the ambiguity.

## Best for

- No Move
- difficult European rounds
- scenes with no obvious giveaway
- avoiding early anchoring

## Strengths

- teaches constraint solving
- makes negative evidence useful
- helps when several countries look similar
- teaches what to inspect next

## Weaknesses

- slower than direct guessing
- soft elimination rules can have exceptions
- users may accidentally treat tendencies as absolutes

## Example

### Scene
Irish-looking rural road with stone walls.

### Elimination Coach output

**Current candidates**

- Ireland
- western Scotland
- Wales

**Strongly argued against**

- Netherlands — road and field structure are a poor fit
- Belgium — landscape fit is weaker
- most of Germany — weak match for this rural environment

**Still unresolved**

Ireland vs western Great Britain

**Highest-value next clue**

Warning signs:

- **Ireland:** yellow diamond warnings
- **Great Britain:** red triangular warnings

The stone walls are not enough by themselves.

---

# 🌍 Deep Geography

## What it does

Deep Geography explains:

> **WHY does this place look like this?**

Instead of stopping at:

> “This clue is common in Austria.”

it tries to build a causal story:

**physical geography → human use → modern landscape → GeoGuessr value**

It may connect visible clues to:

- geology
- climate
- soils
- agriculture
- trade
- industry
- settlement
- history
- infrastructure
- land ownership
- transportation
- migration
- government policy

## Best for

- serious study
- building geographic intuition
- understanding unfamiliar environments
- learning why visual clues exist

## Strengths

- produces durable understanding
- connects GeoGuessr to real geography
- explains why metas and regional patterns exist
- makes clues easier to remember

## Weaknesses

- slower
- takes longer to read than a fast gameplay summary
- higher hallucination risk if uncertainty is ignored
- some causal stories cannot be proven from one image

## Example 1 — Austria / Slovenia Alpine scene

### Scene
A normal house and meadow sit directly below a dramatic mountain wall.

### Deep Geography output

The useful clue is not simply:

> “mountains = Austria.”

The scene shows a **vertical land-use pattern**.

**Steep mountain slopes**  
→ difficult to mechanize and cultivate  
→ forest remains common

**Flatter valley or basin floor**  
→ easier farming and access  
→ pasture, orchards, houses and roads concentrate there

So the scene becomes:

**rock → forest → meadow/orchard → settlement**

The architecture also fits the broader Central European cultural zone, which is why Austria and Slovenia can be difficult confusers.

**GeoGuessr lesson:**  
The mountains identify the Alpine environment. Infrastructure and national road standards are still needed to confidently separate Austria from Slovenia.

**Memory:**  
“Mountains decide where farming stops.”

---

## Example 2 — Western Ireland stone walls

### Deep Geography output

The important question is:

> Why are there so many stone walls?

In rocky agricultural areas, farmers clearing usable land repeatedly remove fieldstone.

Instead of transporting heavy stone far away:

**rocky field**  
→ stones removed  
→ stones stacked at boundaries  
→ livestock enclosure + field division  
→ generations of dry-stone walls

The walls are therefore both:

- evidence of the local physical environment
- evidence of how people adapted agriculture to that environment

**GeoGuessr value:**  
Useful for western Ireland, but not unique. Scotland and Wales are major confusers.

**Memory:**  
“The field supplied its own fence.”

---

## Example 3 — Belgium / Wallonia village

### Scene
Rough stone building beside brick houses with mixed slate-like and tile roofs.

### Deep Geography output

Do not memorize:

> “Belgium = brick.”

The more interesting pattern is that the village looks **accumulated over time**.

Older buildings may reflect locally available stone.

Later:

- brick becomes easier to manufacture
- transportation improves
- renovations happen without rebuilding the entire street

So one road can contain:

**old stone → later brick → renovated façades → modern additions**

Older European villages also developed before modern car-oriented planning, which is why houses may sit directly along the road instead of behind front lawns and driveways.

**Memory:**  
“Old villages accumulate rather than reset.”

---

# 🧠 Memory Coach

## What it does

Memory Coach turns clues into things you can recall later.

It uses:

- compact stories
- visual anchors
- contrast pairs
- cause-and-effect chains
- recall questions
- memorable one-line rules

## Best for

- review
- mistake correction
- spaced repetition
- clues you keep forgetting

## Strengths

- excellent retention
- converts observations into reusable memories
- pairs clues with confusers
- useful after mistakes

## Weaknesses

- memorable rules can become oversimplified
- a mnemonic should never replace actual evidence
- confusers and exceptions must still be included

## Example

### Scene
Western Ireland stone walls.

### Memory Coach output

**Anchor:** Western Ireland

**Problem:** rocky farmland  
**Need:** clear fields + contain livestock  
**Solution:** removed stones become boundaries

### Memory phrase

> **“The field supplied its own fence.”**

### Confuser

Western Scotland

### Separator

- Ireland → yellow diamond warning signs
- Great Britain → red triangular warning signs

### Recall question

Why can repeated dry-stone walls support western Ireland?

---

# 🏆 Pro Analyst

## What it does

Pro Analyst teaches evidence weighting.

It asks:

> **How much should I actually trust each clue?**

It focuses on:

- strong vs weak evidence
- contradictions
- correlated evidence
- independent evidence
- uncertainty
- alternative explanations
- confusers
- information gain

## Best for

- advanced players
- confidence calibration
- learning why a 90% guess may really be a 55% guess
- understanding which clue to search for next

## Strengths

- reduces overconfidence
- exposes weak assumptions
- discourages double-counting
- teaches expert-style evidence weighting

## Weaknesses

- slower to read
- less beginner-friendly
- percentages can create false precision
- requires disciplined uncertainty language

## Example

### Scene
Austria / Slovenia Alpine valley.

### Pro Analyst output

**Austria — 35%**  
**Slovenia — 30%**  
**Switzerland — 15%**  
**Other — 20%**

These are relative AI confidence estimates, not scientific probabilities.

### Positive evidence

+ Alpine mountain morphology — strong for the broader region  
+ Central European house style — moderate  
+ meadow/orchard land use — moderate

### Weak evidence

~ cloudy sky  
~ generic green grass  
~ red house color

### Main ambiguity

Austria and Slovenia can share:

- Alpine geology
- climate
- vegetation
- Habsburg-influenced architecture
- similar rural land use

### Highest-information next clues

1. road signs
2. bollards
3. plates
4. road markings
5. utility poles

### Calibration

The mountain identifies the **Alpine environment** much more strongly than it identifies **Austria specifically**.

---

# What the same scene looks like through every coach

Suppose the image shows:

- lush Alpine meadow
- ordinary Central European house
- orchard tree
- steep mountains behind

## ⚡ Quick Guess

> Austria 35%, Slovenia 30%, Switzerland 15%.  
> Alpine terrain + Central European architecture.

## 🎯 Meta Coach

> Mountains are broad regional evidence.  
> House style is supporting evidence.  
> Look for national road infrastructure.

## 🚫 Elimination Coach

> Northern Europe and lowland western Europe fall sharply.  
> Austria / Slovenia / Switzerland / northern Italy remain.

## 🌍 Deep Geography

> Steep land stays forested; flatter valley land becomes meadow, orchard and settlement.  
> This is why the landscape is vertically organized.

## 🧠 Memory Coach

> **“Mountains decide where farming stops.”**

## 🏆 Pro Analyst

> Alpine relief is strong regional evidence, but Austria vs Slovenia remains unresolved without administrative clues.

That is the point of AI Coach Styles:

**same image, different lesson.**

---

# Country clues vs regional clues

A clue can be visually distinctive without being nationally useful.

## Example: standardized roadside delineator

**Strength:** A — Strong  
**Use:** Country clue

Why?

National road standards can change sharply at political borders.

## Example: random green municipal flexible bollard

**Strength:** C — Supporting  
**Use:** Local / regional clue

Why?

Municipalities can purchase many different traffic-calming objects.

Do not treat every bollard-shaped object as national bollard meta.

---

# Nature vs bureaucracy

A useful GeoGuessr principle:

> **Nature fades across borders. Bureaucracy snaps across them.**

Forests, mountains, soils and climate usually change gradually.

But:

- road signs
- bollards
- plates
- road lines
- utility standards

can change immediately at a national border.

This is why a forest may only tell you:

> “Western/Central Europe”

while a roadside delineator may separate two neighboring countries.

---

# Regional reads

When the evidence supports it, AI Coach may include:

**Regional read:**  
Müllerthal / eastern Luxembourg — Low confidence

or:

**Regional read:**  
Villach / southern Austrian Alpine environment — Medium confidence

If there is not enough evidence:

**Regional read:** Insufficient evidence

The coach should never invent a region just because the field exists.

---

# Confusers

Good coaching should teach **decision boundaries**, not isolated associations.

Examples:

- Ireland ↔ western Scotland ↔ Wales
- Austria ↔ Slovenia
- Belgium ↔ northern France ↔ Luxembourg
- Argentina ↔ Uruguay
- Indonesia ↔ Malaysia
- Botswana ↔ South Africa

Instead of:

> “This clue means Ireland.”

Prefer:

> “This supports Ireland, but Scotland can produce the same pattern. Here is what separates them.”

---

# Observation, inference and speculation

The AI should distinguish between:

## 🟢 Observed

Directly visible.

> A brown directional sign with white lettering.

## 🟡 Inferred

Reasonable interpretation.

> Likely a recreational or hiking wayfinding sign.

## 🔴 Speculative

Not confirmed.

> Exact regional signage system cannot be identified confidently.

Speculation should not silently become country evidence.

---

# Explanation depth

Explanation Depth is separate from Coach style. It changes how much relevant detail appears without changing the lesson or automatically switching styles.

| Depth | Best for | What changes |
|---|---|---|
| Short | Active gameplay | Two to five major clues and a quickly readable conclusion |
| Normal | Gameplay plus learning | Major clues, confusers, a short explanation and one takeaway |
| Deep | Study and review | Relevant causal context, several confusers and clearer strong-versus-weak evidence |

Deep still prioritizes relevance. It should not create a wall of generic text when the image has little useful evidence.

---

# Which coach should I use?

Choose **Quick Guess** when:

> “I just want help with the round.”

Choose **Meta Coach** when:

> “Teach me which objects matter.”

Choose **Elimination Coach** when:

> “I have several candidates and need to narrow them.”

Choose **Deep Geography** when:

> “I want to understand why this place physically and historically looks this way.”

Choose **Memory Coach** when:

> “I want to remember this clue next month.”

Choose **Pro Analyst** when:

> “I want to understand whether my confidence is actually justified.”

---

# Recommended study workflow

A useful manual study loop is:

**1. Quick Guess**  
See what the AI thinks.

**2. Deep Geography**  
Understand why the landscape exists.

**3. Meta Coach**  
Translate that understanding into actual GeoGuessr clues.

**4. Pro Analyst**  
Check whether those clues truly justify the guess.

**5. Memory Coach**  
Save one durable takeaway.

You do not need to run all five every time.

The point is that **Analyze Clue** can answer different questions depending on what you want to learn.

---

# Core principle

AI Coach should never become:

> “This is common in Austria.”

when it can instead teach:

> “This is an Alpine valley. Steep terrain pushes agriculture and settlement onto flatter land, while forests remain on slopes. That explains the meadow, orchard and houses below the mountain. Austria is plausible, but Slovenia shares the same physical and historical system, so road infrastructure is needed to separate them.”

The goal is not only to guess more countries.

The goal is to gradually understand **why the world looks the way it does**.
