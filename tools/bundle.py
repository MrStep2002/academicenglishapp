"""Bundle the app into one self-contained page (for previews). Usage: python3 tools/bundle.py"""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
read = lambda p: (root / p).read_text(encoding="utf-8")
import base64, re
fonts = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: 'url("data:font/woff2;base64,' + base64.b64encode((root / "fonts" / m.group(1)).read_bytes()).decode() + '")', read("css/fonts.css"))
scripts = "".join(f"<script>\n{read(p)}\n</script>\n" for p in ["data/words.js", "data/practice.js", "js/engine.js", "js/app.js"])
page = f"""<title>Media Studies Vocab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
{fonts}
{read("css/app.css")}
</style>
<div id="app"></div>
{scripts}"""
(root / "dist").mkdir(exist_ok=True)
(root / "dist/media-vocab.html").write_text(page, encoding="utf-8")
print("wrote dist/media-vocab.html", len(page), "bytes")
