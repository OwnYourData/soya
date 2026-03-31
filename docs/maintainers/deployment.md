# Deployment

This section describes how to configure and operate a SOyA environment, including available components and deployment modes.

## Components of a SOyA Environment

A typical SOyA setup consists of the following components:

- **SOyA Repository**  
  The central storage for SOyA Structures (JSON-LD) and related artifacts.

- **Forms (soya-form)**  
  A web-based user interface for creating and editing data based on SOyA structures.

- **Web-CLI (soya-web-cli)**  
  A browser-accessible command interface to interact with the repository.

- **CLI (soya CLI tool)**  
  A local command-line tool enabling authoring, validation, and interaction with repositories directly from the terminal.

Depending on the use case, these components can be deployed together or independently.

## Deployment Options

SOyA environments can be deployed in different configurations depending on trust, governance, and access requirements.

### Local Deployment

All components can be deployed locally (e.g., on a developer machine or internal infrastructure).  
This setup is typically used for development, testing, or controlled environments.

### Public Deployment

In a fully public deployment:

- No authentication is required
- All users can:
  - read data
  - create new structures
  - modify existing structures
  - delete structures

This mode maximizes openness but does not provide protection against unintended or malicious changes.

### Public Deployment with Authenticated Users

In this configuration:

- Read access is public (no authentication required)
- Write operations require authentication
- Access control is scoped to user ownership:
  - Users can only modify or delete structures created within their organization
  - Other users' structures are read-only

This mode provides a balance between openness and controlled contribution, suitable for collaborative environments.

### Private Deployment

In a private deployment:

- All access requires authentication
- Only authorized users can:
  - read data
  - create structures
  - modify or delete structures

This mode is used in restricted environments where data access and modification must be fully controlled.

## Summary

The choice of deployment mode depends on the intended level of openness, trust, and governance.  
SOyA supports flexible configurations to accommodate public collaboration as well as fully controlled private environments.
