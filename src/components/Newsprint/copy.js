/*
 * Invented, neutral local-news copy for the homepage background. No real
 * outlets, people or causes: the background is texture, and a named subject
 * would read as a side being taken. Phrases in [[double brackets]] are the
 * ones the background may mark, chosen because they are the kind of wording
 * Read flags (loaded verbs, characterisation, unattributed claims).
 */
export const STORIES = [
  [
    "The council voted late on Tuesday to approve the revised budget after nearly four hours of debate, with members divided over the cost of road repairs on the east side.",
    "Supporters called the package [[a long-overdue fix]] for streets that have flooded every spring. Opponents described it as [[reckless spending]] at a time when reserves are thin.",
    "The finance office said the plan would draw down about a third of the emergency fund, which it expects to rebuild over five years.",
  ],
  [
    "Residents who attended the meeting were [[left fuming]] after the vote on the bus timetable was delayed for a second month.",
    "The transit authority said the new schedule adds two late-evening routes and removes one that carried fewer than forty riders a day.",
    "A spokesperson [[refused to answer]] questions about the cost of the change, saying figures would be published with the quarterly report.",
  ],
  [
    "Engineers began inspecting the river bridge on Monday, two weeks after a lane was closed when a section of railing came loose.",
    "Officials [[finally admitted]] the inspection had been postponed twice last year. The county said the delays were caused by contractor availability.",
    "Drivers should expect single-lane traffic until the end of the month, the roads department said.",
  ],
  [
    "The school board approved a later start time for the district's three high schools, a change it said follows research on teenage sleep.",
    "Parents [[slammed]] the decision at a packed hearing, saying it would complicate childcare. Others welcomed what they called [[a stunning reversal]] of a policy they had opposed for years.",
    "The new schedule takes effect in January.",
  ],
  [
    "Forecasters expect the warm spell to break by Thursday, with rain moving in from the west and temperatures falling about ten degrees.",
    "The weather service said the region had its driest September in a decade, and asked residents to keep limiting garden watering until reservoirs recover.",
    "Some growers called the restrictions [[a chaotic plan]] that changed three times in a month.",
  ],
  [
    "The library will extend its weekend hours from next week after a survey found most visitors come on Saturdays.",
    "The proposal, which [[so-called experts]] had warned would cost too much, was funded by moving money from the equipment budget.",
    "Staff said the change would add about twelve hours of opening time each week without new hires.",
  ],
  [
    "A planned housing development on the old rail yard cleared its final zoning review, ending a dispute that ran for more than two years.",
    "Neighbours had described the project as [[a controversial scheme]] that would overload local roads. The developer said it would pay for a new traffic signal.",
    "Construction could begin in the spring, pending a final permit.",
  ],
  [
    "The harbour authority raised mooring fees for the first time in six years, citing the cost of dredging the inner channel.",
    "Boat owners [[blasted]] the increase as [[a cash grab]]. The authority said the new rate is still below that of neighbouring marinas.",
    "The change applies from the start of next season.",
  ],
];

/* Splits a paragraph into plain runs and markable phrases. */
export function parseParagraph(text) {
  return text
    .split(/(\[\[[^\]]+\]\])/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("[[") ? { text: part.slice(2, -2), phrase: true } : { text: part, phrase: false }
    );
}
