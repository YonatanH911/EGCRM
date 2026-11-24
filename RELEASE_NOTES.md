# EGCRM Release Notes

## Version 0.2.8 (Latest)

### Data Integrity
- **Account Field Recovery**: Added a guarded migration that restores blank website, phone, description, and address fields from each account's mapped Dynamics record without overwriting existing EGCRM values.

## Version 0.2.7

### Bug Fixes
- **Legacy Contact Compatibility**: Contact responses now preserve malformed historical Dynamics email text without causing Contracts, Activities, or other contact-dependent views to fail. New and edited contacts still require valid email addresses.

## Version 0.2.6

### Data Integrity
- **Dynamics Record Recovery**: Added guarded migrations that separate distinct Dynamics records previously merged by duplicate names, contact emails, contract titles, or deposit numbers.
- **Complete Snapshot Validation**: Added a read-only full Dynamics exporter and coverage checks for accounts, contacts, contracts, vaults, deposits, and their relationships.
- **Safer Future Imports**: Excel imports now claim each matched CRM row once, preventing multiple Dynamics GUIDs from silently sharing one local record.

## Version 2.1

### New Features & Enhancements
- **Intelligent Data Linking**: Revolutionized the Accounts dashboard by replacing static text fields (like Industry) with dynamic, interactive dropdowns. Users can now seamlessly link and unlink related Contacts and Deposits directly from an Account page.
- **Unified Data Importer**: Consolidated multiple independent Excel import scripts into `import_excel_exports.py`, which processes dependencies in order and supports active and inactive Dynamics exports.

## Version 2.0

### New Features & Enhancements
- **Light/Dark Mode Theme**: Introduced a comprehensive theme switching system using Next.js and Tailwind CSS. Added seamless color inversion across the entire app via a new settings toggle.
- **Enhanced Settings UI**: Remodeled the UI dropdown menu and removed the unused language selection options for a cleaner user experience.
- **Hebrew Database Support**: Converted the database tables and connection strings to `utf8mb4` encoding to natively support full Hebrew text and emojis without crashing.
- **Vault & Deposit Management**: Upgraded the forms and data handling for creating properties in the Vault and Deposit modules.
- **Role-Based Activities Board**: Replaced the standard table view in the activities dashboard with an interactive Kanban Board layout for Sales users, providing a visual representation of tasks by status.

### Bug Fixes
- **API Proxy Routing**: Fixed Nginx proxy misconfigurations by removing trailing slashes from FastAPI backend routes, resolving persistent 404 errors during creation requests.
- **Git Security**: Cleaned up the repository by properly untracking sensitive database properties and expanding `.gitignore` rules.
