# Track / playlist catalog for MSW

```bash
npm run tracks:generate
```

Writes:

- `public/tracks.json` — SellerSKU catalog (gitignored)
- `public/playlists.json` — CMS Product page for `searchProducts` (playlists)
- `public/tracks.sample.json` — small sample for CI

Плейлисты в UI = CMS Product в корневой category `playlists` (не Product-артисты).
Треки в UI = склейка SKU + SellerSKU (`mapSellerSkuToTrack`).
