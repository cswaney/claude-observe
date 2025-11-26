# TODO

## Pending Features

1. Display additional log details
   - Add UUID, ISO timestamp, token usage to detail view
   - Show agent ID for subagent logs
   - Display tool parameters for tool logs

2. Display full agent history in detail view
   - Show complete agent execution timeline
   - Track agent start/end events
   - Display agent nesting relationships

3. Modify sparkline settings to increase variation
   - Use log scale?
   - Or set maximum level so we can see variation at lower values?
   - Add max. and avg. tokens/min labels
  
4. Store filter state by view
   - When navigating back to the session log browser, we should see the same filters as before we looked at a detail or agent log browser.
   - Same should be true foro the agent log browser
   - The filters should reset when
     - We go from session to agent log browser
     - We go from welcome to session log browser
