# EGCRM Release Notes

## Version 2.1 (Latest)

### New Features & Enhancements
- **Intelligent Data Linking**: Revolutionized the Accounts dashboard by replacing static text fields (like Industry) with dynamic, interactive dropdowns. Users can now seamlessly link and unlink related Contacts and Deposits directly from an Account page.
- **Unified Data Importer**: Consolidated multiple independent Excel import scripts into a powerful `import_all.py` engine that strictly processes dependencies (Accounts -> Contacts -> Vaults -> Deposits) to prevent orphaned records.

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
