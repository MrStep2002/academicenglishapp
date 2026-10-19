"""Bundle the app into one self-contained page (for previews). Usage: python3 tools/bundle.py"""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
read = lambda p: (root / p).read_text(encoding="utf-8")
scripts = "".join(f"<script>\n{read(p)}\n</script>\n" for p in ["data/words.js", "data/practice.js", "js/engine.js", "js/app.js"])
page = f"""<title>Media Studies Vocab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap">
<style>
{read("css/app.css")}
</style>
<div id="app"></div>
{scripts}"""
(root / "dist").mkdir(exist_ok=True)
(root / "dist/media-vocab.html").write_text(page, encoding="utf-8")
print("wrote dist/media-vocab.html", len(page), "bytes")
