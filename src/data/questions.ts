export interface Question {
  id: number;
  round: number;
  title: string;
  scenario: string;
  illustration: string;
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
    title: "The Misfit",
    scenario:
      "You just hired Alex. Alex is incredibly creative, always suggesting wild new ideas, but misses deadlines, hates routines, and has a messy desk. Where do you assign Alex to maximize company efficiency?",
    illustration: "/images/scenario-1.png",
    options: [
      {
        label: "A",
        text: "Data Entry & Auditing (Strict rules, high focus).",
        score: -50,
      },
      {
        label: "B",
        text: "Fire Alex. Professionalism is everything.",
        score: 0,
      },
      {
        label: "C",
        text: "Research & Development (Idea generation, flexible schedule).",
        score: 100,
      },
      {
        label: "D",
        text: "Customer Service (Dealing with angry clients).",
        score: -20,
      },
    ],
  },
  {
    id: 2,
    round: 2,
    title: "The Bored Veterans",
    scenario:
      "Your senior developers are highly paid, have great benefits, and work in a nice office. However, productivity is dropping, and they complain about feeling \"uninspired\" by doing the same routine tasks everyday. How do you motivate them to get their spark back?",
    illustration: "/images/scenario-2.png",
    options: [
      {
        label: "A",
        text: "Give them another 10% salary increase.",
        score: 20,
      },
      {
        label: "B",
        text: "Give them autonomy to lead a challenging new \"passion project.\"",
        score: 100,
      },
      {
        label: "C",
        text: "Threaten to replace them with fresh graduates.",
        score: -100,
      },
      {
        label: "D",
        text: "Improve the office air conditioning and buy free snacks.",
        score: 0,
      },
    ],
  },
  {
    id: 3,
    round: 3,
    title: "The Eager Rookie",
    scenario:
      "You just hired a fresh graduate named Sam. Sam is extremely enthusiastic and excited to work, but has absolutely zero technical skills or experience in this field. Which leadership style should you use to manage Sam today?",
    illustration: "/images/scenario-3.png",
    options: [
      {
        label: "A",
        text: "Delegating: Give them the goal and let them figure it out alone.",
        score: -50,
      },
      {
        label: "B",
        text: "Participating: Ask Sam for their strategic opinions on the project.",
        score: 10,
      },
      {
        label: "C",
        text: "Telling/Directing: Give them highly specific, step-by-step instructions.",
        score: 100,
      },
      {
        label: "D",
        text: "Selling: Persuade them to work hard, even though they already are.",
        score: 0,
      },
    ],
  },
  {
    id: 4,
    round: 4,
    title: "The Broken Telephone",
    scenario:
      "The CEO sent out an urgent memo stating: \"We need to optimize synergistic paradigms by Q3 to avoid redundancy protocols.\" By the time the message reached the frontline workers, they thought they were all getting fired, causing a panic. What communication barrier caused this, and how do you fix it?",
    illustration: "/images/scenario-4.png",
    options: [
      {
        label: "A",
        text: "The CEO used too much Jargon; translate it into simple language.",
        score: 100,
      },
      {
        label: "B",
        text: "It was Information Overload; send 5 more emails to clarify.",
        score: -50,
      },
      {
        label: "C",
        text: "It's a lack of feedback; ignore the panic, they will figure it out.",
        score: -50,
      },
      {
        label: "D",
        text: "Physical distraction; buy everyone noise-canceling headphones.",
        score: 0,
      },
    ],
  },
  {
    id: 5,
    round: 5,
    title: "The Robot Uprising",
    scenario:
      "You are replacing the old manual data system with a new AI software. 40% of your veteran staff are actively protesting the change because they are afraid the AI will steal their jobs. How do you manage this resistance to change?",
    illustration: "/images/scenario-5.png",
    options: [
      {
        label: "A",
        text: "Coercion: Tell them to learn the AI or pack their bags.",
        score: -100,
      },
      {
        label: "B",
        text: "Manipulation: Secretly install the AI without telling them until it's done.",
        score: -50,
      },
      {
        label: "C",
        text: "Education & Communication: Hold workshops showing how the AI helps them, not replaces them.",
        score: 100,
      },
      {
        label: "D",
        text: "Surrender: Cancel the AI project to keep the peace.",
        score: 0,
      },
    ],
  },
  {
    id: 6,
    round: 6,
    title: "The Culture Clash",
    scenario:
      "A new American executive takes over and implements a public \"Rank and Yank\" system, where the lowest-performing employee of the month is publicly called out to drive competitive spirit. Your local Filipino team is devastated, and teamwork completely collapses. What local cultural value did the foreign executive violate?",
    illustration: "/images/scenario-6.png",
    options: [
      {
        label: "A",
        text: "Ningas Kugon (Starting strong but losing interest).",
        score: 0,
      },
      {
        label: "B",
        text: "Bahala Na (Fatalism/leaving it to fate).",
        score: 0,
      },
      {
        label: "C",
        text: "Mañana Habit (Procrastination).",
        score: 0,
      },
      {
        label: "D",
        text: "Pakikisama & Amor Propio (Smooth interpersonal relations & self-esteem).",
        score: 100,
      },
    ],
  },
];
