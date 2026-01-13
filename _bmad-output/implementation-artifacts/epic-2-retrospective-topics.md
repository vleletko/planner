# Epic 2 Retrospective Topics

**Epic:** Epic 2 - Project Workspace Management
**Status:** In Progress

This file collects topics, deferred decisions, and discussion items for the Epic 2 retrospective.

---

## Deferred Decisions

### 1. Project Overview Page Purpose

**Date Added:** 2025-12-16
**Context:** Story 2-1 implementation

**Current State:**
- `/projects/[projectId]` shows a placeholder "overview" with project metadata (owner, member count, created date)
- This page provides little value - the data is either obvious or available in Settings

**Deferred Because:**
- No project-scoped data to display yet (cards, resources, statuses not implemented)
- The main board is a **shared/mixed board** across all projects, not per-project
- Projects are **namespaces** for cards/resources, not containers for boards

**Open Questions for Discussion:**
1. **Should statuses/transitions be project-scoped or global?**
   - Shared board implies global statuses might make more sense
   - But different projects might need different workflows
   - Need to revisit PRD/architecture decision

2. **What project-scoped data would justify an overview page?**
   - Project-level resources (Epic 6)
   - Project configuration summary (statuses, card types, fields)
   - Recent activity in this project
   - Project-specific cards view (filtered board?)

3. **UX Flow: What happens when you click a project?**
   - Current: Goes to empty overview page
   - Option A: Go directly to Settings
   - Option B: Go to Board with project filter applied
   - Option C: Keep overview but make it useful later

**Temporary Solution:**
- For now, project click goes to overview → user clicks Settings
- Add back navigation from Settings to project list
- Revisit when Epic 3 (statuses/card types) or Epic 6 (resources) is implemented

---

## Topics to Discuss

_Add items here as the epic progresses_

---

## Notes

_General observations during Epic 2 implementation_
