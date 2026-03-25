# About EGCRM

EGCRM (Enterprise Grade Customer Relationship Management) is a modern, full-stack system designed to help teams elegantly track accounts, leads, contracts, contacts, and secure physical storage (vaults & deposits).

## Architecture
- **Frontend**: Next.js (React) application styled with Tailwind CSS. Features a premium glassmorphic visual language, smooth frontend micro-animations, and support for dark/light logical themes.
- **Backend**: Python FastAPI providing high-performance REST APIs with strict Pydantic type validation and robust user authentication.
- **Database**: MariaDB / MySQL serving as the persistent data storage layer, securely integrated with SQLAlchemy ORM and fully supporting multi-lingual entry (e.g., Hebrew `utf8mb4`).

## Version History
- **V2.1**: The "Data Relational" update. Added intelligent, inline dropdown linking/unlinking across relational database tables and unified the massive Excel data importing engine.
- **V2.0**: The "Visuals & Stability" update. Introduced system-wide Light/Dark themes, robust multi-language Unicode database support, an interactive Kanban task board, and stabilized API proxy routing.
- **V1.0**: The initial core infrastructure release. Established the fundamental CRUD operations across the primary CRM modules.
