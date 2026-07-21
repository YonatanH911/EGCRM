# Project Rules & Development Workflow

## Deployment & Git Workflow
1. **Local Development**: Implement requested changes in the working tree.
2. **Push to Test Branch**: Commit and push changes to the GitHub `test` branch (`git push origin test`).
3. **Sync/Upload to WSL**: Push/sync changes to the WSL testing environment (`git push wsl test` / `\\wsl.localhost\Ubuntu\home\egcrm`).
4. **User Review**: Wait for the user to review and test in WSL.
5. **Production Release**: Upon explicit approval from the user, push/merge changes to the main branch (`origin master`).
