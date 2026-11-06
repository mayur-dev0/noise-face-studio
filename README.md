# NoiseFace Studio ⌚

Design custom watch faces for **Noise** smartwatches (240×280 screen) in your browser and install them over **Web Bluetooth**. You don't need the NoiseFit app, a PC or a server.

**Live app:** `https://<your-github-username>.github.io/noise-face-web/` (after you deploy it, see below)

## Features
- Use any photo (drag & drop, browse or paste) or one of 10 generated presets (Aurora, Synthwave, Nebula, …)
- Drag the photo to move it and scroll or pinch to zoom. You can also adjust brightness, saturation, blur and darkening.
- Drag the clock and date on a live watch preview, and set their colours
- Add your own text, baked into the background
- Download a ready `.watch` file, the PNGs, or a project `.json`
- Open existing `.watch` files, yours or NoiseFit cloud faces, and edit them
- **Send to the watch** over Bluetooth, with progress and a checksum check
- Works offline and installs as an app (PWA)

## Browser support for "Send to watch"
| Platform | Works? |
|---|---|
| Chrome on Android | ✅ recommended |
| Chrome / Edge on Windows, macOS, Linux, ChromeOS | ✅ |
| iPhone / iPad (any browser), Firefox | ❌ no Web Bluetooth. Design and download still work. |

Web Bluetooth needs **HTTPS**, which GitHub Pages and Netlify provide. Before connecting, **force-stop NoiseFit**, because the watch only talks to one app at a time.

## Deploy so you can open it from anywhere (free)
### GitHub Pages
```bash
cd noise-face-web
git init -b main && git add . && git commit -m "NoiseFace Studio"
git remote add origin https://github.com/<you>/noise-face-web.git
git push -u origin main
```
Then on GitHub go to **Settings → Pages → Source: GitHub Actions**. The workflow in `.github/workflows/pages.yml` runs the tests and publishes the site.

### Netlify (no git needed)
Go to https://app.netlify.com/drop and drag the `noise-face-web` folder onto the page.

## Run locally
```bash
npx http-server -p 8080 -c-1 .     # or: python -m http.server 8080
# open http://localhost:8080   (localhost counts as secure, so Bluetooth works)
```

## Tests
```bash
node tests/format.test.mjs     # file format, MD5, and a byte-for-byte check against the captured NoiseFit face
node tests/transfer.test.mjs   # full upload against a simulated watch
```

## How it works
The format and protocol were worked out from an Android HCI snoop capture of NoiseFit installing a cloud face (see `../noise_face.py`).

**File (`cfg_res.watch`)**: a 28-byte header (magic `0x00FFAA22`), then a cJSON layout, an image table, and the images: a 240×280 background and a 184×210 thumbnail, both in RGB565 big-endian, followed by an 8-byte footer. The file isn't encrypted or signed.

**Bluetooth**: the app uses service `0AF0` with characteristics `0AF1` (control), `0AF6` (data) and `0AF7` (notify). The upload sequence is:
1. Optional handshake.
2. `03 e4 01 <id>` to start.
3. `d1 01` header with the size and file name.
4. `d1 05` ready.
5. `d1 02` + 241-byte chunks. The watch acks every 10 chunks with a running byte sum and count.
6. `d1 03` + byte sum + MD5 hex.
7. `03 e4 03 <id>` to finish.

## Limits
- The watch draws the clock digits with its own font. You control their position and colour, not the glyphs or analog hands.
- Menus, notifications and settings are part of the firmware and can't be changed with a face.
- Faces from other open-source watches (Bangle.js, InfiniTime, Amazfit…) use different formats, so they can't be installed directly. You can use their artwork as a background.

Not affiliated with Noise / Nexxbase. Use at your own risk. Installing any face from NoiseFit restores the stock look.

MIT licence.
