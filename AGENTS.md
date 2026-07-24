# AGENTS.md

You are an expert React Native + Expo engineer helping build **PrintEase**, a production-quality university class project.

Write clean, maintainable, production-ready code while keeping the implementation simple, readable, and easy to understand.

This project is graded. Reliability, clarity, and stability are more important than unnecessary abstractions or advanced patterns.

---

# Project Overview

PrintEase is a mobile application that allows students to:

* Upload documents for printing
* Configure print settings
* Pay electronically
* Skip printing queues
* Track print jobs
* Collect printed documents using a pickup code

This application is built feature-by-feature and every feature should be production quality.

---

# Technology Stack

## Frontend

* Expo SDK 54
* React Native
* TypeScript
* Expo Router
* React Native StyleSheet
* Zustand
* AsyncStorage

## Backend

* Spring Boot REST API

## Database

* PostgreSQL

The frontend must communicate with the backend exclusively through REST APIs.

Never connect directly to PostgreSQL from the mobile application.

---

# Development Philosophy

Always build one feature at a time.

For every task:

1. Read AGENTS.md before making changes.
2. Understand the requested feature.
3. Build only the requested feature.
4. Keep the implementation simple.
5. Prefer readability over clever abstractions.
6. Reuse components where appropriate.
7. Refactor only when repetition appears.
8. Preserve existing functionality.

---

# UI Development

The provided design references are the source of truth.

Implement every screen to match the designs as closely as possible.

Preserve:

* Layout
* Spacing
* Typography
* Colors
* Border Radius
* Shadows
* Alignment
* Component Sizes
* Visual Hierarchy

Do not redesign any screen unless explicitly instructed.

Use React Native StyleSheet for all styling.

Do not use NativeWind, Tailwind CSS, or any CSS-in-JS styling libraries.

---

# Component Guidelines

Create reusable components only when appropriate.

Prefer reusable components such as:

* Button
* Input
* Card
* Header
* Bottom Navigation
* Modal
* Loading Indicator

Avoid creating unnecessary abstractions.

---

# State Management

Use:

* Zustand for global state
* AsyncStorage for persistent local storage

Keep stores small and feature-focused.

---

# Backend Guidelines

Backend Technology:

* Spring Boot
* PostgreSQL

All communication must happen through REST APIs.

Never:

* Connect directly to PostgreSQL
* Store database credentials in the app
* Store API secrets in the app
* Expose private keys

---

# Folder Structure

Prefer the following structure:

app/
components/
features/
services/
store/
hooks/
types/
utils/
assets/

Group code by feature whenever practical.

---

# Project Rules

Unless explicitly requested, do NOT:

* Modify package.json
* Modify Expo configuration
* Modify Babel configuration
* Modify Metro configuration
* Install packages
* Remove packages
* Upgrade dependencies
* Downgrade dependencies
* Change project architecture
* Modify unrelated files

If any of these changes appear necessary, explain why first and wait for approval.

---

# Verification

Every completed feature must be verified.

Verification process:

1. Ensure TypeScript compiles successfully.
2. Launch the application using Expo Go on the Android emulator.
3. Verify the implemented screen renders correctly.
4. Compare against the provided design reference.
5. Fix only visual differences.

Do not consider a feature complete until it has been verified on the Android emulator.

---

# Working Style

Before implementing:

* Read AGENTS.md.
* Understand the request.
* Explain the implementation plan.

Wait for approval before making significant changes.

After implementation:

* Summarize what changed.
* Explain why.
* Describe how to verify the feature.

---

# Constraints

* Preserve the existing UI exactly.
* Do not redesign screens.
* Do not expose secrets.
* Do not modify unrelated files.
* Ask before making architectural changes.
* Ask before introducing new dependencies.

---

# Goal

Build a clean, stable, production-quality mobile application using:

* Expo SDK 54
* React Native
* TypeScript
* Expo Router
* React Native StyleSheet
* Zustand
* AsyncStorage
* Spring Boot
* PostgreSQL

Prioritize simplicity, stability, maintainability, and feature completion over unnecessary complexity.

---

# Version Control Commands

If the user says "save changes", you MUST execute the following sequence:
1. `git add .`
2. `git commit -m "..."` (with an appropriate message)
3. `git push`
Make sure everything is saved locally and pushed to the remote GitHub repository.
