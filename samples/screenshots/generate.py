#!/usr/bin/env python3
"""Render deterministic onboarding-flow screenshots as PNGs.

Each image is a self-contained mock of a product's first-run screen. The
teardown files in samples/ are grounded in the exact elements drawn here, so a
reviewer can open the PNG and check the read against what is on screen. Run:

    python3 samples/screenshots/generate.py

Requires Pillow and Arial (present on macOS). Output is deterministic: the same
run produces byte-identical PNGs, so the committed screenshots are reproducible.
"""
import os
from PIL import Image, ImageDraw, ImageFont

# Write the PNGs next to this script, which is samples/screenshots/.
OUT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT, exist_ok=True)

AR = "/System/Library/Fonts/Supplemental/Arial.ttf"
ARB = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(ARB if bold else AR, size)


def rrect(d, box, r, **kw):
    d.rounded_rectangle(box, radius=r, **kw)


def new(w=1200, h=820, bg="#ffffff"):
    img = Image.new("RGB", (w, h), bg)
    return img, ImageDraw.Draw(img)


def save(img, name):
    p = os.path.join(OUT, name)
    img.save(p, "PNG")
    print("wrote", p)


# ---------------------------------------------------- Scheduling (Calendly-style)
def scheduling():
    img, d = new(bg="#ffffff")
    d.rectangle([0, 0, 1200, 56], fill="#ffffff")
    d.line([0, 56, 1200, 56], fill="#eceef1")
    d.text((28, 18), "Set up your booking page", font=font(16, True),
           fill="#1a1a2e")
    d.text((980, 20), "Step 2 of 4", font=font(13), fill="#8b90a0")
    # left form: availability + event type
    d.text((48, 100), "Your event type", font=font(20, True), fill="#1a1a2e")
    rrect(d, [48, 148, 560, 208], 8, outline="#dfe2e8")
    d.text((68, 166), "30 Minute Meeting", font=font(15, True),
           fill="#1a1a2e")
    d.text((68, 182), "calendly.com/you/30min", font=font(12),
           fill="#0069ff")
    d.text((48, 240), "Set your weekly hours", font=font(15, True),
           fill="#1a1a2e")
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    for i, day in enumerate(days):
        y = 280 + i * 46
        # toggle on
        rrect(d, [48, y, 84, y + 24], 12, fill="#0069ff")
        d.ellipse([64, y + 2, 84, y + 22], fill="#ffffff")
        d.text((100, y + 2), day, font=font(14, True), fill="#1a1a2e")
        rrect(d, [160, y - 2, 300, y + 26], 6, outline="#dfe2e8")
        d.text((176, y + 3), "9:00am - 5:00pm", font=font(12), fill="#41465a")
    # calendar-connect gate (the real friction)
    rrect(d, [48, 540, 560, 640], 10, fill="#fff6e9", outline="#f0c674")
    d.text((72, 560), "Connect your calendar to go live",
           font=font(14, True), fill="#8a5a00")
    d.text((72, 586),
           "Bookings are paused until Google or Outlook is connected.",
           font=font(12), fill="#8a5a00")
    rrect(d, [72, 606, 260, 632], 6, fill="#ffffff", outline="#f0c674")
    d.text((90, 611), "Connect Google Calendar", font=font(11, True),
           fill="#8a5a00")
    # right: live preview of the public booking page
    d.rectangle([620, 56, 1200, 820], fill="#f4f6f9")
    d.text((648, 92), "Preview of your public page", font=font(13),
           fill="#8b90a0")
    rrect(d, [648, 124, 1152, 720], 12, fill="#ffffff", outline="#e3e7ee")
    d.ellipse([684, 156, 740, 212], fill="#dfe6f5")
    d.text((760, 168), "Meet with You", font=font(18, True), fill="#1a1a2e")
    d.text((760, 194), "30 min", font=font(13), fill="#8b90a0")
    # month grid
    d.text((684, 244), "Select a Day", font=font(14, True), fill="#1a1a2e")
    for r in range(4):
        for c in range(7):
            x = 684 + c * 62
            y = 284 + r * 56
            rrect(d, [x, y, x + 50, y + 46], 8, outline="#e3e7ee")
            d.text((x + 16, y + 12), str(r * 7 + c + 1), font=font(13),
                   fill="#41465a")
    d.text((684, 540), "No times shown until a day is picked and the "
           "calendar is connected.", font=font(11), fill="#b0b5c2")
    save(img, "scheduling-onboarding.png")


# The Docusign example uses real, captured screenshots of the eSignature premium
# free-trial flow (samples/screenshots/docusign-trial/), not a synthetic mock, so
# there is no docusign() renderer here. Only the Calendly screen is synthetic.
if __name__ == "__main__":
    scheduling()
