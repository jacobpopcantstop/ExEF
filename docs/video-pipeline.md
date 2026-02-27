# Video Pipeline (Asynchronous + Accessible)

This site does not depend on live classes. Video references are optional and must be accessible.

## Source of Truth
- Manifest: `data/video-library.json`
- Validation: `python3 scripts/check_video_pipeline.py`
- Policy owner: `data/video-library.json.policy`

## Production Provider Policy
- Primary provider: Cloudflare Stream (`cloudflare_stream`).
- Allowed video hosts are policy-gated via `data/video-library.json.policy.allowed_hosts`.
- External citations (for research/source context) are allowed only when host is explicitly allowlisted.
- Every video reference must continue to include transcript metadata and a non-video fallback reading.

## Required Metadata Per Video
- `id`, `title`, `module`
- `url` (absolute)
- `captions_checked: true`
- `transcript_status` (`youtube_transcript`, `publisher_transcript`, `local_transcript`, `none`)
- `transcript_url` when transcript exists
- `fallback_reading` (paper/brief/PDF)

## Operational Workflow
1. Add video entry to `data/video-library.json`.
2. Verify captions manually in player.
3. Confirm transcript path (YouTube transcript pane, publisher transcript, or local transcript file).
4. Add fallback reading link for accessibility and low-bandwidth users.
5. Run release gate before deploy.
6. Confirm source host is included in `policy.allowed_hosts`.

## Deployment Rule
- If caption/transcript metadata is missing, release gate fails.
- If policy/provider metadata is missing, release gate fails.
- If a video URL host is not allowlisted, release gate fails.
- Optional references can be published only when fallback reading is present.
