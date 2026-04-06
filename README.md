# Implementation Insights & Challenges

It is hard to single out one "most demanding" part of this project, since two problems ended up requiring the most thought - not because they were complicated in the same way, but because each one forced out-of-the-box thinking. Synchronized Multi-Criteria Filtering was a logic problem rooted in state management, while Persistent Filter State during Navigation was more of an architectural decision about where data should live.

---

## 1. Synchronized Multi-Criteria Filtering (Name & Skills)

### The Challenge

The filtering system originally handled "Name" and "Skills" as two completely separate searches, with no awareness of each other. The problem became obvious pretty quickly during testing -> if you searched for "Lazar" and then added "React" as a skill filter, the name would just get dropped - suddenly you're looking at every React developer whose name is and is not Lazar.

### The Solution & Decision Making

The fix was to re-implement the state logic so that neither filter ever work in isolation. I brought in Zustand as a centralized store to hold both nameFilter and skillsFilter at all times, so every search action has the full picture before doing anything.
The way it works now is basically that skill-based queries still hit the server, but the name filter (if present) is applied on the client side immediately after the results come back from skill-based query. It's a small distinction, but it means the two filters always produce an intersection rather than overwriting each other.

### Why This Approach?

I chose this implementation to prioritize User Experience. Filters that reset each other are frustrating, and the whole point of having multiple criteria is to narrow things down together. This approach also pushed me to think more carefully about where state lives and how different parts of the UI stay in sync - which turned out to be one of the more useful things I worked through on this project.


## 2. Persistent Filter State during Navigation (**first part of the second video below**)

### The Challenge

Filter state was originally stored inside the SearchSection component, which seemed fine at first. The issue showed up when navigating away - if you filtered for specific candidates, clicked into a details page, and hit the back button, everything was gone. The component had unmounted, taking all the filter context with it, and the dashboard would reload with the full unfiltered list. From a user's perspective, it just felt like the app forgot what you were doing.

### The Solution & Decision Making

The fix was an architectural one: move the source of truth for filters out of the component entirely and into the global **Zustand** store. By lifting nameFilter and skillsFilter into candidateStore, those values now outlive the component so the navigation doesn't touch them.
The other half of the fix was making fetchCandidates aware of the store's current state. Instead of always executing a plain getAll() call, the function now reads the existing filter values (name and skill filter) on initialization. So when a user comes back from a details page, the store still holds their previous criteria and the filtered fetch runs automatically, showing previously filtered candidates.

### Why This Approach?

The main reason was that storing UI intent locally inside a component always felt like the wrong place for something that needed to survive navigation. Moving it to the global store also cleaned up the component itself. Besides, the filtering logic became reusable across the app rather than being tied to one specific component. It was one of those decisions that felt like extra work upfront but made everything noticeably simpler afterward.


#App demo

https://github.com/user-attachments/assets/5492a444-57b1-466d-b6b8-c0cf211c9183



https://github.com/user-attachments/assets/d62a659f-74cc-4120-b315-5a148f8c023b

