// More specific transition regex that looks for explicit transition phrases
export const TRANSITION_REGEX = /(let'?s (move|continue|proceed|advance)[^\n]*next (section|part|step)|moving to the next|let'?s move on|let'?s continue to|are you ready to continue)/i;
export const END_REGEX = /(thank you for your time|we'?ll be in touch|interview (is|has been)? (now )?(complete|completed|finished|over)|have a great day|this concludes|final thoughts|best of luck)/i;

// More specific transition regex that excludes system messages
export const USER_TRANSITION_REGEX = /^(let'?s (move|continue|proceed|advance)[^\n]*next (section|part|step))/i; 