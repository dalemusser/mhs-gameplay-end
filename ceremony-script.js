/*
 * Demo script for the end-of-game ceremony (ceremony.html).
 *
 * This is the swappable DATA artifact — upstream code (mhsgrader + logs + LLM,
 * choosing from a finite pool of pre-recorded ElevenLabs statements) will produce
 * one of these; the ceremony player just performs whatever it's given.
 *
 * Schema:
 *   layout: { mc, group[] }            who's the master of ceremonies + the group order
 *   beats[]: ordered performance beats. Each:
 *     speaker   npc id (omit for a celebration beat)
 *     type      'celebration' for the group cheer beat
 *     text      spoken line (shown in the bubble; karaoke-highlighted)
 *     audio     (later) url of the ElevenLabs clip; omit → placeholder timing
 *     words     (later) [[startSec,"word"],…] from ElevenLabs timestamps; omit → even spacing
 *     expression named mood preset → morph bias (proud/encouraging/thoughtful/serious/excited/happy)
 *     gesture   body anim name (omit → auto talk gesture); 'clap'/'cheer' for celebration
 *     holo      { title, subtitle } (procedural slide) or { src } (image), + optional transition
 *     advance   'click' (wait for Next, default) | 'auto' (+ duration seconds)
 */
window.CEREMONY_SCRIPT = {
  layout: {
    mc: 'Toppo',
    group: ['Jasper', 'Anderson', 'Aryn', 'Tera'],
  },
  beats: [
    {
      speaker: 'Toppo', expression: 'proud', gesture: 'welcome',
      holo: { title: 'MISSION COMPLETE', subtitle: 'Mission HydroSci — Final Debrief' },
      text: "Cadet — you made it. On behalf of the entire Mission HydroSci team, congratulations. What you accomplished out there wasn't easy, and every one of us has something to say about it. So let's take a moment to look back at the journey — together.",
    },
    {
      speaker: 'Tera', expression: 'encouraging',
      holo: { title: 'FIELD STUDY', subtitle: 'Sampling the watershed', transition: 'materialize' },
      text: "When we headed into the field, I wasn't sure what to expect. But you rolled up your sleeves, gathered your samples, and let the data do the talking. That's exactly how real science gets done. Nicely done.",
    },
    {
      speaker: 'Anderson', expression: 'thoughtful',
      holo: { title: 'IN THE LAB', subtitle: 'Analysis & evidence', transition: 'glitch' },
      text: "Back in the lab, you had to make sense of everything you collected — and you didn't just guess. You tested, you measured, you checked your work. That kind of careful thinking will take you a long way.",
    },
    {
      speaker: 'Aryn', expression: 'serious',
      holo: { title: 'THE DECISION', subtitle: 'Weighing the model', transition: 'materialize' },
      text: "The problem we faced didn't have an easy answer. You weighed the evidence and made the call under pressure. You stayed focused, you adapted, and you saw it through. I was impressed.",
    },
    {
      speaker: 'Jasper', expression: 'excited',
      holo: { title: 'THE MISSION', subtitle: 'Teamwork under pressure', transition: 'glitch' },
      text: "I think I gave you the toughest challenge of all — and you met it head-on. You communicated, you trusted your team, and you never gave up. That's what this mission was really about.",
    },
    {
      type: 'celebration', gesture: 'cheer', expression: 'happy', fx: 'confetti',
      holo: { title: 'WELL DONE', subtitle: 'Mission accomplished' },
      advance: 'auto', duration: 4.5,
    },
    {
      speaker: 'Toppo', expression: 'proud', gesture: 'welcome',
      holo: { title: 'CONGRATULATIONS', subtitle: 'Mission HydroSci, signing off' },
      text: "You came to us as a recruit. You're leaving as one of the team. Wherever your curiosity takes you next, remember what you proved here — that you can ask the hard questions and find the answers. Mission HydroSci, signing off. We're proud of you, cadet.",
    },
  ],
};
