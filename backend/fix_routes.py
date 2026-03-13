import re

file_path = "c:/projects/CRM_Dynamics/backend/main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I noticed the previous replace might have duplicated some lines, so I'll also fix any duplicate `@app.post("/users/", ...)` lines if they exist.
# Let's just fix all trailing slashes in route definitions.
content = re.sub(r'(@app\.(?:get|post|put|patch|delete)\("[^"]+?)/"\)', r'\1")', content)

# Remove the duplicated users post we accidentally created
content = re.sub(r'@app\.post\("/users/", response_model=schemas\.UserResponse\)\n', '', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
