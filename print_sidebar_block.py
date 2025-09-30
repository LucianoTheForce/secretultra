from pathlib import Path
import re
text = Path("app/studio/page.tsx").read_text()
match = re.search(r"<StudioSidebar[\s\S]*?/>", text)
if not match:
    print("not found")
else:
    print(repr(match.group(0)))
