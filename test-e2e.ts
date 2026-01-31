#!/usr/bin/env bun
import { initSchema, closeDb } from "./src/db"
import * as service from "./src/service"
import * as render from "./src/render"

async function test() {
  console.log("🧪 E2E Test for bizcanvas\n")

  // Initialize
  await initSchema()
  console.log("✓ Database initialized\n")

  // 1. Create personas for PlateIQ
  console.log("Creating personas...")

  const coachMike = await service.createNote("persona", "Coach Mike", "Youth baseball coach focused on player development", {
    role: "Little League Coach",
    goals: ["Improve team batting average", "Track player progress", "Make practice more efficient"],
    painPoints: ["No time to analyze video", "Hard to spot swing issues", "Players forget feedback"],
    demographics: { age: "45", location: "Austin, TX", experience: "10 years coaching" },
    quote: "I wish I could give each kid the attention they deserve"
  })
  console.log(`  ✓ Created persona: ${coachMike.title} (${coachMike.id.slice(0,8)})`)

  const parentSarah = await service.createNote("persona", "Parent Sarah", "Baseball mom wanting to help her kid improve", {
    role: "Baseball Parent",
    goals: ["Help son improve batting", "Understand what coaches see", "Track progress over season"],
    painPoints: ["Don't know baseball well", "Can't afford private lessons", "No way to practice at home effectively"],
    demographics: { age: "38", location: "Dallas, TX", kids: "2 (ages 10, 7)" },
    quote: "I just want to help but I don't know what I'm looking at"
  })
  console.log(`  ✓ Created persona: ${parentSarah.title} (${parentSarah.id.slice(0,8)})`)

  // 2. Create ideas
  console.log("\nCreating ideas...")

  const aiAnalysis = await service.createNote("idea", "AI Swing Analysis", "Use computer vision to analyze batting swings from phone video")
  const progressDashboard = await service.createNote("idea", "Progress Dashboard", "Visual dashboard showing improvement over time")
  const drillSuggestions = await service.createNote("idea", "Smart Drill Suggestions", "AI recommends specific drills based on swing issues detected")

  console.log(`  ✓ Created ${3} ideas`)

  // 3. Create pain points
  console.log("\nCreating pain points...")

  const noTimeForVideo = await service.createNote("painpoint", "No time to review video", "Coaches don't have hours to watch game film")
  const expensiveLessons = await service.createNote("painpoint", "Private lessons are expensive", "$50-100/hour puts quality coaching out of reach")
  const inconsistentFeedback = await service.createNote("painpoint", "Inconsistent feedback", "Different coaches say different things, kids get confused")

  console.log(`  ✓ Created ${3} pain points`)

  // 4. Link ideas to personas and pain points
  console.log("\nLinking notes...")

  await service.linkNotes(aiAnalysis.id, coachMike.id, "solves_problem_for")
  await service.linkNotes(aiAnalysis.id, parentSarah.id, "enables")
  await service.linkNotes(aiAnalysis.id, noTimeForVideo.id, "addresses")
  await service.linkNotes(progressDashboard.id, parentSarah.id, "helps")
  await service.linkNotes(drillSuggestions.id, expensiveLessons.id, "mitigates")
  await service.linkNotes(drillSuggestions.id, aiAnalysis.id, "depends_on")

  console.log(`  ✓ Created ${6} links`)

  // 5. Tag everything with plateiq
  console.log("\nTagging notes...")

  const allNotes = [coachMike, parentSarah, aiAnalysis, progressDashboard, drillSuggestions, noTimeForVideo, expensiveLessons, inconsistentFeedback]
  for (const note of allNotes) {
    await service.tagNote(note.id, "plateiq")
  }
  await service.tagNote(coachMike.id, "persona")
  await service.tagNote(parentSarah.id, "persona")

  console.log(`  ✓ Tagged all notes`)

  // 6. Create SWOT collection
  console.log("\nCreating SWOT analysis...")

  const swot = await service.createCollection("PlateIQ Market Analysis", "swot", "SWOT analysis for PlateIQ baseball analytics app")

  const s1 = await service.createNote("swot_s", "AI-powered - unique tech", "Computer vision for swing analysis is novel in youth sports")
  const s2 = await service.createNote("swot_s", "Mobile-first", "Works with any smartphone camera")
  const w1 = await service.createNote("swot_w", "Requires good video quality", "Poor lighting or angles reduce accuracy")
  const w2 = await service.createNote("swot_w", "No brand recognition", "Unknown in the market")
  const o1 = await service.createNote("swot_o", "Youth sports is huge market", "Millions of kids play baseball")
  const o2 = await service.createNote("swot_o", "Parents spend on kids", "High willingness to pay for child development")
  const t1 = await service.createNote("swot_t", "Big players could enter", "MLB or ESPN could build similar")
  const t2 = await service.createNote("swot_t", "Privacy concerns", "Video of minors requires careful handling")

  for (const note of [s1, s2, w1, w2, o1, o2, t1, t2]) {
    await service.addNoteToCollection(swot.id, note.id)
    await service.tagNote(note.id, "plateiq")
  }

  console.log(`  ✓ Created SWOT with ${8} items`)

  // 7. Test renders
  console.log("\n" + "=".repeat(60))
  console.log("RENDER TESTS")
  console.log("=".repeat(60))

  // Render persona
  console.log("\n📋 Persona Render:")
  console.log(render.renderPersona(coachMike))

  // Render links
  console.log("\n📋 Links for AI Swing Analysis:")
  const links = await service.getLinkedNotes(aiAnalysis.id)
  console.log(render.renderLinks(aiAnalysis, links))

  // Render SWOT
  console.log("\n📋 SWOT Analysis:")
  const swotNotes = await service.getCollectionNotes(swot.id)
  console.log(render.renderSWOT(
    swot.name,
    swotNotes.filter(n => n.type === "swot_s"),
    swotNotes.filter(n => n.type === "swot_w"),
    swotNotes.filter(n => n.type === "swot_o"),
    swotNotes.filter(n => n.type === "swot_t")
  ))

  // Render note list
  console.log("\n📋 All Notes:")
  const allNotesFromDb = await service.listNotes()
  console.log(render.renderNoteList(allNotesFromDb))

  // Test search
  console.log("\n📋 Search 'coach':")
  const searchResults = await service.searchNotes("coach")
  console.log(render.renderNoteList(searchResults))

  // Test tag lookup
  console.log("\n📋 Notes tagged #plateiq:")
  const taggedNotes = await service.getNotesByTag("plateiq")
  console.log(`Found ${taggedNotes.length} notes with #plateiq tag`)

  console.log("\n" + "=".repeat(60))
  console.log("✅ All E2E tests passed!")
  console.log("=".repeat(60))

  await closeDb()
}

test().catch(err => {
  console.error("❌ Test failed:", err)
  process.exit(1)
})
