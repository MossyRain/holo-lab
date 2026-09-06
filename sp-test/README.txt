HOLO LAB ? ORB / TEST 27b

SOURCE
- Built directly from the user-provided HOLO_ORB_3D_TEST_24 ZIP.
- TEST 25 / 26 / previous reconstructed 27 code is not used.

UNCHANGED FROM ACTUAL TEST 24
- Question-mark outline and extrusion geometry
- Question-mark dot geometry / same zBack-zFront sweep rule as hook
- Inclusion population and rendering
- Left/right stereo and hue phase
- UI/layout and tilt behavior
- Aurora color-field construction and rim treatment

V27b CHANGES
1. Aurora opacity only
   - The V24 aurora colors are retained.
   - Opacity now falls to transparent toward the visual center according to sphere curvature.
   - No separate milky-white layer was added.

2. Highlights only
   - Reduced from three patches to two.
   - Spherical-coordinate patches are retained.
   - With the ? upright:
       near/front highlight = upper-left
       far/rear highlight   = lower-right
   - Both start nearer the sphere edge and are substantially more elongated.

3. Version identification
   - TEST 27b in UI.
   - V27b burned into each rendered holo panel.
