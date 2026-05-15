Pull latest from main, stage all changes, create a commit with a descriptive message, and push to main.

Steps:
1. Run `git pull origin main` to get the latest changes
2. Run `git status` and `git diff --staged` and `git diff` to see what changed
3. Stage all changes with `git add -A`
4. Analyze the staged changes and write a concise, conventional commit message (feat/fix/refactor/docs/chore prefix)
5. Commit the changes
6. Push to main with `git push origin main`

If there are merge conflicts after pull, stop and report them to me. Do not force push.
