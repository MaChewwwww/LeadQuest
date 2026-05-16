export interface Question {
  id: number;
  round: number;
  scenario: string;
  options: {
    label: string;
    text: string;
    score: number;
  }[];
}

/**
 * Placeholder questions for 6 rounds of leadership scenarios.
 * Replace these with your actual course content before the presentation.
 * 
 * Scoring: Each option has a score value. Higher scores reward better
 * leadership decisions. Negative scores penalize poor choices.
 */
export const questions: Question[] = [
  {
    id: 1,
    round: 1,
    scenario:
      "Your team just missed a critical deadline. During the post-mortem meeting, a junior team member is being blamed by the rest of the group. As the team leader, what do you do?",
    options: [
      {
        label: "A",
        text: "Let the team vent their frustrations — they need to express how they feel.",
        score: 0,
      },
      {
        label: "B",
        text: "Redirect the conversation to process failures rather than individual blame.",
        score: 100,
      },
      {
        label: "C",
        text: "Defend the junior member publicly and take personal responsibility.",
        score: 75,
      },
      {
        label: "D",
        text: "End the meeting and address it privately with each person later.",
        score: 25,
      },
    ],
  },
  {
    id: 2,
    round: 2,
    scenario:
      "Two of your most experienced team members have a fundamental disagreement about the project's technical direction. Both approaches have merit, but the conflict is slowing down the entire team. How do you handle it?",
    options: [
      {
        label: "A",
        text: "Make the final decision yourself to end the deadlock quickly.",
        score: 25,
      },
      {
        label: "B",
        text: "Ask both to present data-driven cases and let the team vote.",
        score: 100,
      },
      {
        label: "C",
        text: "Have them work together to find a compromise solution.",
        score: 75,
      },
      {
        label: "D",
        text: "Bring in an external expert to settle the debate.",
        score: 0,
      },
    ],
  },
  {
    id: 3,
    round: 3,
    scenario:
      "You discover that a key stakeholder has been providing conflicting requirements to different parts of your team, causing duplicated work and confusion. What is your first move?",
    options: [
      {
        label: "A",
        text: "Escalate the issue to your manager immediately.",
        score: 0,
      },
      {
        label: "B",
        text: "Schedule a alignment meeting with the stakeholder and all affected team leads.",
        score: 100,
      },
      {
        label: "C",
        text: "Document the conflicting requirements and email it to the stakeholder.",
        score: 50,
      },
      {
        label: "D",
        text: "Pick the requirements that make the most sense and proceed.",
        score: -50,
      },
    ],
  },
  {
    id: 4,
    round: 4,
    scenario:
      "Your organization is going through a major restructuring. Your team is anxious about layoffs, and productivity has dropped significantly. Morale is at an all-time low. What approach do you take?",
    options: [
      {
        label: "A",
        text: "Be transparent about what you know and don't know. Create a safe space for concerns.",
        score: 100,
      },
      {
        label: "B",
        text: "Keep the team focused on deliverables — staying productive is the best protection.",
        score: 50,
      },
      {
        label: "C",
        text: "Reassure everyone that everything will be fine to keep spirits up.",
        score: -25,
      },
      {
        label: "D",
        text: "Advocate to upper management for clarity on behalf of your team.",
        score: 75,
      },
    ],
  },
  {
    id: 5,
    round: 5,
    scenario:
      "A high-performing team member comes to you wanting to leave for a different department. Losing them would significantly impact your project's success. They cite lack of growth opportunities. What do you do?",
    options: [
      {
        label: "A",
        text: "Try to convince them to stay by highlighting the project's importance.",
        score: 0,
      },
      {
        label: "B",
        text: "Support their decision and help them transition smoothly.",
        score: 75,
      },
      {
        label: "C",
        text: "Work with them to create a development plan that addresses their growth needs.",
        score: 100,
      },
      {
        label: "D",
        text: "Offer them a leadership role or promotion to retain them.",
        score: 25,
      },
    ],
  },
  {
    id: 6,
    round: 6,
    scenario:
      "Your team has delivered a successful product, but you realize that one team member did far more work than everyone else. During the team celebration, the CEO asks who deserves the most credit. How do you respond?",
    options: [
      {
        label: "A",
        text: "Name the top contributor — they deserve the recognition.",
        score: 25,
      },
      {
        label: "B",
        text: "Credit the entire team equally — it was a team effort.",
        score: 50,
      },
      {
        label: "C",
        text: "Highlight specific contributions from multiple team members, emphasizing collaboration.",
        score: 100,
      },
      {
        label: "D",
        text: "Deflect attention and focus on the product's impact instead.",
        score: 0,
      },
    ],
  },
];
