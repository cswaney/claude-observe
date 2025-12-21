# Development Notes

## Navigation Architecture Analysis

### Assessment

The navigation implementation is **solid and well-suited for a terminal UI**. Here's the full assessment:

#### What Works Well

1. **Appropriate architecture choice**: Using state-based view switching instead of a routing library is exactly right for a CLI app. No unnecessary overhead.

2. **Excellent context preservation**: The `savedSelectedIndex` pattern when navigating into agent sessions is thoughtful - users don't lose their place when drilling down and coming back up.

3. **Intuitive keyboard mappings**:

   - Right arrow = "go deeper" (select session, view details, next log)
   - Left arrow = "go back" (previous log)
   - Escape = "go up" (to parent view)
   - This creates a consistent mental model

4. **Hierarchical navigation**: Supporting nested sessions (parent → agent sessions) shows good architectural foresight.

#### Areas Worth Considering

1. **App component size** ([app.js](source/app.js)): At ~685 lines with all navigation logic centralized, this could become harder to maintain. Consider extracting navigation logic into:

   - Custom hooks: `useNavigationState()`, `useBrowserNavigation()`, `useSessionNavigation()`
   - A navigation context provider
   - Separate input handlers per view

2. **Detail view state management** ([Details/index.js](source/views/Details/index.js)): When navigating between logs with left/right arrows, the detail view might not properly reset its scroll state. Consider:

   - Adding a `key` prop based on current log index
   - Resetting `scrollOffset` in a `useEffect` when the log changes

3. **Navigation breadcrumbs**: Users in nested agent sessions might lose track of their depth. Consider showing:

   ```
   Browser > Session (main-session) > Agent Session (agent-abc123)
   ```

4. **Search/filter state**: When navigating detail → session → detail, search query persists (good!), but there's no visual indicator in detail view that you're viewing filtered results.

5. **Missing "open in external viewer" option**: For very long logs or JSON payloads, it might be helpful to export/open in an editor.

#### Enhancement Ideas (if relevant to goals)

- **Command palette**: `/` for search is great - consider a `:` command palette for actions (`:export`, `:clear-filters`, etc.)
- **Bookmarks/favorites**: Pin frequently accessed sessions
- **Recent sessions**: Quick access to last N viewed sessions
- **Jump to timestamp**: In session view, jump to logs at specific time
- **Diff view**: When looking at tool use → tool result, show a diff view

### Navigation Design Decision

**Issue**: Left/right arrow keys work differently across views, creating inconsistent navigation patterns.

**Solution**: Use Shift+arrows for sequential navigation, plain arrows for hierarchical navigation.

See [TODO.md - Navigation](TODO.md#navigation) for the complete unified navigation scheme.

#### Design Principles

- **Plain arrows**: Hierarchical navigation (in/out of views, up/down within lists)
- **Shift+arrows**: Sequential navigation at same level (between logs in detail view)
- **Escape**: Always returns to Browser (universal "exit" behavior)
- **u/d/t/b**: Jump scrolling works consistently across all scrollable lists/content

### Bottom Line

The navigation is **clean, functional, and appropriate** for the app's scope. The state-based approach works well, keyboard shortcuts are intuitive, and the hierarchical navigation is well-implemented. The main consideration is whether to refactor the growing App component for maintainability as features are added.
