HOLO LAB — ? ORB 3D TEST 07

Purpose
- Fix the TEST 06 rendering failure.
- Keep the target shell/inclusion look while making the internal content reliably visible on iPhone Safari.

Changes
- Removed WebGL entirely for this test and switched the internal renderer to Canvas 2D + manual 3D projection.
  This avoids the shader/rendering issue seen in TEST 06.
- Sphere shell remains a completely fixed 2D CSS overlay.
- Shell center has no dark fill at all.
- Shell appearance is made only from:
  edge milkiness / subtle holo rim / fixed material highlights.
- Inclusions:
  mostly micro-size,
  some slightly larger,
  a very small minority larger/brighter,
  periodic twinkle,
  occasional stronger flare,
  additive light only,
  never black/dark particles.
- Question:
  front face is one uniform color,
  a small tilt causes a large whole-face hue shift,
  side faces use a different uniform hue,
  dot is treated separately as a short sideways cylinder.

Files
- index.html
- style.css
- app.js
- README.txt
