---
name: react-component-architecture
description: Use when creating or refactoring React components. Enforces simple, composable, reusable structure.
---

# React Component Architecture

## Goal

Build components that are:

- simple
- composable
- reusable
- easy to extend

---

## Core rules

### 1. Split components

Split when:

- JSX becomes hard to read
- logic and UI are mixed
- sections can be clearly named

Extract:

- subcomponents
- list items
- UI sections

---

### 2. Hooks

Create hooks when logic is:

- stateful
- reusable
- complex

Rules:

- no JSX
- minimal API
- clear naming

---

### 3. Helpers

Extract pure functions for:

- transformations
- formatting
- derived values

---

### 4. Constants

Extract:

- labels
- limits
- mappings

Never leave magic values inline.

---

### 5. JSX

JSX must be:

- shallow
- readable

Do NOT:

- nest ternaries
- embed business logic
- create complex inline handlers

---

### 6. Naming

Use descriptive names.

Avoid:

- data
- item
- value
- temp

---

### 7. State

- keep local
- avoid unnecessary lifting
- do not store derived state

---

## Workflow (MANDATORY)

1. Identify responsibilities:
   - UI
   - state
   - effects
   - data

2. Split component if needed

3. Extract:
   - hooks
   - helpers
   - constants
   - subcomponents

4. Simplify JSX

5. Validate naming

---

## Hard constraints

- Do not leave large components unrefactored
- Do not duplicate logic
- Do not keep logic inside JSX
