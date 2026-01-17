import os
from datetime import datetime

BASE_URL = "https://multiverseweb.github.io/OpenDots"

EXCLUDE_DIRS = {".git", ".github", "__pycache__", "node_modules", "venv"}

def get_files():
    files = []
    for root, dirs, filenames in os.walk("."):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

        for name in filenames:
            if name.startswith("."):
                continue
            path = os.path.join(root, name).replace("\\", "/")
            files.append(path.lstrip("./"))
    return files

def generate_sitemap(files):
    today = datetime.utcnow().strftime("%Y-%m-%d")

    urls = []
    for f in files:
        loc = f"{BASE_URL}/{f}" if BASE_URL else f
        urls.append(f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{today}</lastmod>
  </url>""")

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>
"""

def main():
    files = get_files()
    sitemap = generate_sitemap(files)

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap)

    print("sitemap.xml updated")

if __name__ == "__main__":
    main()
