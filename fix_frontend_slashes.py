import os
import re

frontend_dir = "c:/projects/CRM_Dynamics/frontend/src"
for root, dirs, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith(".tsx") or f.endswith(".ts"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            
            def repl(m):
                inner = m.group(3)
                if inner.endswith('/'):
                    inner = inner[:-1]
                return f"{m.group(1)}{m.group(2)}{inner}{m.group(4)}"
                
            new_content = re.sub(r'(api\.(?:get|post|put|patch|delete)\()([\'"`])(.*?)([\'"`])', repl, content)
            if new_content != content:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Updated {path}")
