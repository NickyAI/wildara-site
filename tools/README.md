# Wildara site tooling

The website in `../Site` is plain static HTML/CSS/JS. Nothing here is needed to run or host it.
These scripts regenerate parts of it. They need Python 3 with `Pillow` and `python-docx`
(`pip install Pillow python-docx`).

| Script | What it does |
| --- | --- |
| `proc.py` | Converts every photo in `../Media` to responsive WebP (`-s` 640w, `-m` 1280w, `-l` up to 2400w) in `Site/assets/img`. |
| `parse.py` | Reads the itinerary `.docx` files in `../Itineraries` into `Site/assets/data/safaris.json`. |
| `polish.py` | Tidies titles, assigns photos to each safari, and computes "from" prices. Run it after `parse.py`. |
| `build.py` | Expands the page templates in `src/` into `Site/*.html`. Edit the templates in `src/`, not the built HTML, if you plan to rebuild. |

After running `parse.py` and `polish.py`, regenerate the data file the pages load:

```sh
echo "window.WILDARA_SAFARIS=$(cat ../Site/assets/data/safaris.json);" > ../Site/assets/js/safaris-data.js
```
