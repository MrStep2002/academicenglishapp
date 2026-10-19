"""Bundle the Representation game into one self-contained page (for previews).
Usage: python3 tools/bundle.py   (writes dist/representation.html)"""
import pathlib, base64, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
unit = root / "representation"
read = lambda p: p.read_text(encoding="utf-8")
fonts = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: 'url("data:font/woff2;base64,' + base64.b64encode((root / "fonts" / m.group(1)).read_bytes()).decode() + '")', read(root / "css/fonts.css"))
scripts = "".join(f"<script>\n{read(unit / p)}\n</script>\n" for p in ["data/words.js", "data/practice.js", "data/zh.js", "js/engine.js", "js/app.js"])
page = f"""<title>Media Studies Vocab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
{fonts}
{read(unit / "css/app.css")}
</style>
<div id="app"></div>
{scripts}"""
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist/representation.html"
out.parent.mkdir(exist_ok=True)
out.write_text(page, encoding="utf-8")
print("wrote", out, len(page), "bytes")
