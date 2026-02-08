# Specification

## Summary
**Goal:** Add Firestore-based audit logging for key order actions and provide an ADMIN-only Audit Logs viewer in the app.

**Planned changes:**
- Create a frontend audit logging service that writes best-effort documents to Firestore `/auditLogs` for: Order created, Order updated, Payment updated, Order deleted (including action, human-facing orderId, localId when available, actor userId/role, timestamp, and action-specific details).
- Wire audit logging into existing flows: after successful local order create, order edit/update, payment update from the Update Payment dialog, and order delete—without breaking offline-first behavior when unauthenticated/offline/Firestore unconfigured.
- Add an ADMIN-only Audit Logs screen that lists recent `/auditLogs` entries newest-first, with clear English labels (and access denied UI for STAFF users who reach the route indirectly).
- Add an ADMIN-only entry point to Audit Logs from the Reports screen and register a new navigation route/screen key in the app shell routing (without modifying immutable frontend paths).
- Add concise documentation to an existing Firebase setup doc describing Firestore security rules for `/auditLogs` (ADMIN-only reads; authenticated writes).

**User-visible outcome:** ADMIN users can open a new Audit Logs view from Reports to see recent order-related audit events, while STAFF users cannot access or view audit logs; core order/payment flows continue to work normally even when offline or not signed in.
