#!/usr/bin/env python3
"""Generate the kmsg Connected Bubbles brand asset system."""

from __future__ import annotations

import base64
import math
import shutil
import subprocess
import tempfile
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "assets" / "brand" / "source"
PNG_DIR = ROOT / "assets" / "brand" / "png"
REVIEW_DIR = ROOT / "assets" / "brand" / "review"
FONT_PATH = (
    ROOT
    / "site"
    / "node_modules"
    / "@fontsource-variable"
    / "geist"
    / "files"
    / "geist-latin-wght-normal.woff2"
)

CANVAS = 1024
YELLOW = "#FEE500"
YELLOW_PAPER = "#F2D500"
INK = "#19170D"
PAPER = "#F7F7F2"
WHITE = "#FFFFFF"
DARK = "#11110F"
MUTED = "#68675F"
STROKE = 96
SMALL_STROKE = 104
LEFT_PATH = (
    "M312 304H472C534 304 584 354 584 416V496C584 558 534 608 472 608"
    "H352L240 712L264 600C226 580 200 540 200 496V416C200 354 250 304 312 304Z"
)
RIGHT_PATH = (
    "M552 416H712C750 416 786 436 806 468L872 392L824 500V608"
    "C824 670 774 720 712 720H552C490 720 440 670 440 608V528"
    "C440 466 490 416 552 416Z"
)

SVG_HEADER = '<svg xmlns="http://www.w3.org/2000/svg"'


def svg_document(view_box: str, content: str, *, width: int | None = None, height: int | None = None) -> str:
    size = ""
    if width is not None:
        size += f' width="{width}"'
    if height is not None:
        size += f' height="{height}"'
    return f'{SVG_HEADER}{size} viewBox="{view_box}">\n{content}\n</svg>\n'


def symbol_markup(
    color: str,
    *,
    prefix: str,
    stroke: int = STROKE,
    transform: str | None = None,
) -> str:
    _ = prefix
    inner = f"""
<g transform="translate(20 46) scale(.86)">
  <g transform="translate(90 50)">
    <path d="{RIGHT_PATH}" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <path d="{LEFT_PATH}" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</g>""".strip()
    if transform:
        return f'<g transform="{transform}">\n{inner}\n</g>'
    return inner


def app_icon_markup(*, prefix: str, transform: str | None = None) -> str:
    content = f"""
<rect x="32" y="32" width="960" height="960" rx="216" fill="{YELLOW}"/>
{symbol_markup(INK, prefix=f"{prefix}-symbol")}""".strip()
    if transform:
        return f'<g transform="{transform}">\n{content}\n</g>'
    return content


def outline_text(text: str, *, weight: int, tracking_em: float = 0.0) -> tuple[list[str], float]:
    if not FONT_PATH.exists():
        raise FileNotFoundError(
            f"Geist font not found at {FONT_PATH}. Run `cd site && npm ci` first."
        )

    font = instantiateVariableFont(TTFont(FONT_PATH), {"wght": weight}, inplace=False)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"].metrics
    upem = font["head"].unitsPerEm
    tracking = tracking_em * upem

    glyphs: list[tuple[object, float, tuple[float, float, float, float] | None]] = []
    cursor = 0.0
    aggregate: list[tuple[float, float, float, float]] = []
    for char in text:
        glyph_name = cmap.get(ord(char))
        if glyph_name is None:
            raise ValueError(f"Geist font does not contain {char!r}")
        glyph = glyph_set[glyph_name]
        bounds_pen = BoundsPen(glyph_set)
        glyph.draw(bounds_pen)
        bounds = bounds_pen.bounds
        glyphs.append((glyph, cursor, bounds))
        if bounds is not None:
            x_min, y_min, x_max, y_max = bounds
            aggregate.append((x_min + cursor, y_min, x_max + cursor, y_max))
        advance, _ = hmtx[glyph_name]
        cursor += advance + tracking

    if not aggregate:
        raise ValueError("Cannot outline empty text")

    x_min = min(item[0] for item in aggregate)
    y_min = min(item[1] for item in aggregate)
    x_max = max(item[2] for item in aggregate)
    y_max = max(item[3] for item in aggregate)
    scale = 512 / (y_max - y_min)

    paths: list[str] = []
    for glyph, offset, bounds in glyphs:
        if bounds is None:
            continue
        svg_pen = SVGPathPen(glyph_set)
        transform = Transform(
            scale,
            0,
            0,
            -scale,
            (offset - x_min) * scale,
            y_max * scale,
        )
        glyph.draw(TransformPen(svg_pen, transform))
        paths.append(svg_pen.getCommands())

    return paths, (x_max - x_min) * scale


def path_group(paths: list[str], color: str, *, transform: str | None = None) -> str:
    body = "\n".join(f'<path d="{path}" fill="{color}"/>' for path in paths)
    if transform:
        return f'<g transform="{transform}">\n{body}\n</g>'
    return body


def signature_markup(
    word_paths: list[str],
    word_width: float,
    *,
    prefix: str,
    symbol_color: str,
    word_color: str,
) -> tuple[str, int]:
    word_scale = 0.82
    word_x = 760
    word_y = 110
    width = math.ceil(word_x + word_width * word_scale + 80)
    symbol = symbol_markup(
        symbol_color,
        prefix=f"{prefix}-mark",
        transform="translate(-91 -121) scale(.868)",
    )
    content = f"""
{symbol}
{path_group(word_paths, word_color, transform=f"translate({word_x} {word_y}) scale({word_scale})")}""".strip()
    return content, width


def social_markup(
    word_paths: list[str],
    word_width: float,
    descriptor_paths: list[str],
    descriptor_width: float,
    *,
    prefix: str,
) -> str:
    word_scale = min(0.58, 620 / word_width)
    descriptor_scale = min(0.19, 610 / descriptor_width)
    return f"""
<rect width="1200" height="630" fill="{DARK}"/>
<rect x="0" y="0" width="1200" height="12" fill="{YELLOW}"/>
{app_icon_markup(prefix=f"{prefix}-icon", transform="translate(72 125) scale(.371)")}
{path_group(word_paths, PAPER, transform=f"translate(500 168) scale({word_scale:.6f})")}
<rect x="500" y="382" width="96" height="8" rx="4" fill="{YELLOW}"/>
{path_group(descriptor_paths, PAPER, transform=f"translate(500 424) scale({descriptor_scale:.6f})")}
<path d="M500 535H1128" stroke="#35352E" stroke-width="2"/>
<circle cx="512" cy="566" r="7" fill="{YELLOW}"/>
<path d="M534 560H790V572H534Z" fill="#AAA99F"/>""".strip()


def write_source(name: str, view_box: str, content: str, *, width: int | None = None, height: int | None = None) -> Path:
    path = SOURCE_DIR / name
    path.write_text(svg_document(view_box, content, width=width, height=height))
    return path


def render(svg_path: Path, png_path: Path, *, width: int, height: int | None = None) -> None:
    renderer = shutil.which("rsvg-convert")
    if renderer is None:
        raise RuntimeError("rsvg-convert is required. Install librsvg first.")
    command = [renderer, "--width", str(width)]
    if height is not None:
        command.extend(["--height", str(height)])
    command.extend(["--output", str(png_path), str(svg_path)])
    subprocess.run(command, check=True)


def data_uri(path: Path) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    media = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return f"data:{media};base64,{encoded}"


def review_board_svg(
    word_paths: list[str],
    word_width: float,
    descriptor_paths: list[str],
    descriptor_width: float,
) -> str:
    light_signature, signature_width = signature_markup(
        word_paths,
        word_width,
        prefix="review-light-signature",
        symbol_color=INK,
        word_color=INK,
    )
    dark_signature, _ = signature_markup(
        word_paths,
        word_width,
        prefix="review-dark-signature",
        symbol_color=YELLOW,
        word_color=PAPER,
    )
    signature_scale = 220 / signature_width
    social = social_markup(
        word_paths,
        word_width,
        descriptor_paths,
        descriptor_width,
        prefix="review-social",
    )
    content = f"""
<rect width="1280" height="1024" fill="#EEEADF"/>
<text x="60" y="72" fill="{INK}" font-family="Arial, sans-serif" font-size="34" font-weight="700">kmsg · Connected Bubbles</text>
<text x="60" y="105" fill="{MUTED}" font-family="Arial, sans-serif" font-size="16">Message bridge identity system · approved direction</text>

<rect x="60" y="142" width="420" height="500" rx="30" fill="#FFFDF5"/>
<text x="90" y="185" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14" font-weight="700">PRIMARY APP ICON</text>
{app_icon_markup(prefix="review-app", transform="translate(108 210) scale(.316)")}
<text x="90" y="584" fill="{INK}" font-family="Arial, sans-serif" font-size="18" font-weight="700">Friendly geometry. Technical precision.</text>
<text x="90" y="614" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14">Kakao yellow retained. Mascot language removed.</text>

<rect x="510" y="142" width="710" height="260" rx="30" fill="#FFFDF5"/>
<text x="540" y="185" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14" font-weight="700">SYMBOL SYSTEM</text>
<rect x="540" y="210" width="205" height="150" rx="22" fill="{DARK}"/>
{symbol_markup(YELLOW, prefix="review-primary", transform="translate(511 181) scale(.245)")}
<rect x="762" y="210" width="205" height="150" rx="22" fill="#EEEADF"/>
{symbol_markup(INK, prefix="review-mono", transform="translate(733 181) scale(.245)")}
<rect x="984" y="210" width="205" height="150" rx="22" fill="#756600"/>
{symbol_markup(WHITE, prefix="review-reverse", transform="translate(955 181) scale(.245)")}
<text x="610" y="385" fill="{MUTED}" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">PRIMARY</text>
<text x="832" y="385" fill="{MUTED}" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">MONO</text>
<text x="1054" y="385" fill="{MUTED}" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">REVERSE</text>

<rect x="510" y="430" width="710" height="240" rx="30" fill="#FFFDF5"/>
<text x="540" y="470" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14" font-weight="700">HORIZONTAL SIGNATURE</text>
<rect x="540" y="492" width="650" height="74" rx="16" fill="#EEEADF"/>
<g transform="translate(560 496) scale({signature_scale:.6f})">{light_signature}</g>
<rect x="540" y="576" width="650" height="74" rx="16" fill="{DARK}"/>
<g transform="translate(560 580) scale({signature_scale:.6f})">{dark_signature}</g>

<rect x="60" y="700" width="1160" height="260" rx="30" fill="#FFFDF5"/>
<text x="90" y="740" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14" font-weight="700">SOCIAL PREVIEW · 1200 × 630</text>
<g transform="translate(90 760) scale(.30)">{social}</g>
<text x="550" y="786" fill="{INK}" font-family="Arial, sans-serif" font-size="18" font-weight="700">Core idea</text>
<text x="550" y="820" fill="{MUTED}" font-family="Arial, sans-serif" font-size="15">Two directional speech loops form one bridge.</text>
<text x="550" y="852" fill="{INK}" font-family="Arial, sans-serif" font-size="18" font-weight="700">Priority surfaces</text>
<text x="550" y="886" fill="{MUTED}" font-family="Arial, sans-serif" font-size="15">GitHub README · project website · 32px header</text>
<text x="550" y="922" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13">Flat vector · no gradient · no shadow · no mascot</text>"""
    return svg_document("0 0 1280 1024", content, width=1280, height=1024)


def size_board_svg(samples: dict[int, Path], legacy_32: Path) -> str:
    actual_items: list[str] = []
    x_positions = [180, 360, 540, 760, 1020]
    for size, x in zip([16, 24, 32, 64, 128], x_positions):
        sample = samples[size]
        actual_items.append(
            f'<image href="{data_uri(sample)}" x="{x - size / 2}" y="{232 - size / 2}" width="{size}" height="{size}"/>'
        )
        actual_items.append(
            f'<text x="{x}" y="314" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">{size}px</text>'
        )

    enlarged_items: list[str] = []
    display_sizes = {16: 128, 24: 144, 32: 160, 64: 176, 128: 192}
    for size, x in zip([16, 24, 32, 64, 128], x_positions):
        display = display_sizes[size]
        enlarged_items.append(
            f'<image href="{data_uri(samples[size])}" x="{x - display / 2}" y="420" width="{display}" height="{display}" style="image-rendering:pixelated"/>'
        )
        enlarged_items.append(
            f'<text x="{x}" y="628" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">{size}px raster</text>'
        )

    old_uri = data_uri(legacy_32)
    new_uri = data_uri(samples[32])
    content = f"""
<rect width="1280" height="1024" fill="{DARK}"/>
<text x="60" y="72" fill="{PAPER}" font-family="Arial, sans-serif" font-size="34" font-weight="700">Small-size validation</text>
<text x="60" y="105" fill="#AAA99F" font-family="Arial, sans-serif" font-size="16">Actual pixels, pixel enlargements, and legacy comparison</text>

<rect x="60" y="140" width="1160" height="190" rx="28" fill="#F7F5ED"/>
<text x="90" y="180" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14" font-weight="700">ACTUAL OUTPUT SIZE</text>
{''.join(actual_items)}

<rect x="60" y="356" width="1160" height="320" rx="28" fill="#F7F5ED"/>
<text x="90" y="396" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14" font-weight="700">PIXEL ENLARGEMENT</text>
{''.join(enlarged_items)}

<rect x="60" y="704" width="1160" height="254" rx="28" fill="#F7F5ED"/>
<text x="90" y="744" fill="{MUTED}" font-family="Arial, sans-serif" font-size="14" font-weight="700">32PX LEGACY / CONNECTED BUBBLES</text>
<image href="{old_uri}" x="122" y="792" width="32" height="32"/>
<image href="{new_uri}" x="376" y="792" width="32" height="32"/>
<image href="{old_uri}" x="550" y="768" width="160" height="160" style="image-rendering:pixelated"/>
<image href="{new_uri}" x="820" y="768" width="160" height="160" style="image-rendering:pixelated"/>
<text x="138" y="858" fill="{INK}" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">Legacy</text>
<text x="392" y="858" fill="{INK}" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">New</text>
<text x="630" y="946" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">Legacy ×5</text>
<text x="900" y="946" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">New ×5</text>
<text x="1090" y="810" fill="{INK}" font-family="Arial, sans-serif" font-size="17" font-weight="700" text-anchor="middle">Pass criteria</text>
<text x="1090" y="844" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">2 counters open</text>
<text x="1090" y="870" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">2 tails visible</text>
<text x="1090" y="896" fill="{MUTED}" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">bridge readable</text>"""
    return svg_document("0 0 1280 1024", content, width=1280, height=1024)


def main() -> None:
    for directory in (SOURCE_DIR, PNG_DIR, REVIEW_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    word_paths, word_width = outline_text("kmsg", weight=700, tracking_em=-0.055)
    descriptor_paths, descriptor_width = outline_text(
        "KakaoTalk CLI · MCP server for macOS", weight=500, tracking_em=0.0
    )

    source_paths: list[Path] = []
    source_paths.append(
        write_source(
            "kmsg-symbol-primary.svg",
            "0 0 1024 1024",
            symbol_markup(YELLOW, prefix="primary"),
            width=1024,
            height=1024,
        )
    )
    source_paths.append(
        write_source(
            "kmsg-symbol-mono.svg",
            "0 0 1024 1024",
            symbol_markup(INK, prefix="mono"),
            width=1024,
            height=1024,
        )
    )
    source_paths.append(
        write_source(
            "kmsg-symbol-reverse.svg",
            "0 0 1024 1024",
            symbol_markup(WHITE, prefix="reverse"),
            width=1024,
            height=1024,
        )
    )
    source_paths.append(
        write_source(
            "kmsg-symbol-small-ink.svg",
            "0 0 1024 1024",
            symbol_markup(
                INK,
                prefix="small",
                stroke=SMALL_STROKE,
            ),
            width=1024,
            height=1024,
        )
    )

    light_signature, signature_width = signature_markup(
        word_paths,
        word_width,
        prefix="signature-light",
        symbol_color=INK,
        word_color=INK,
    )
    dark_signature, _ = signature_markup(
        word_paths,
        word_width,
        prefix="signature-dark",
        symbol_color=YELLOW,
        word_color=PAPER,
    )
    source_paths.append(
        write_source(
            "kmsg-signature-light.svg",
            f"0 0 {signature_width} 640",
            light_signature,
            width=signature_width,
            height=640,
        )
    )
    source_paths.append(
        write_source(
            "kmsg-signature-dark.svg",
            f"0 0 {signature_width} 640",
            dark_signature,
            width=signature_width,
            height=640,
        )
    )
    source_paths.append(
        write_source(
            "kmsg-app-icon.svg",
            "0 0 1024 1024",
            app_icon_markup(prefix="app"),
            width=1024,
            height=1024,
        )
    )
    source_paths.append(
        write_source(
            "kmsg-social-preview-1200x630.svg",
            "0 0 1200 630",
            social_markup(
                word_paths,
                word_width,
                descriptor_paths,
                descriptor_width,
                prefix="social",
            ),
            width=1200,
            height=630,
        )
    )

    renders = [
        ("kmsg-symbol-primary.svg", "kmsg-symbol-primary-1024.png", 1024, 1024),
        ("kmsg-symbol-mono.svg", "kmsg-symbol-mono-1024.png", 1024, 1024),
        ("kmsg-symbol-reverse.svg", "kmsg-symbol-reverse-1024.png", 1024, 1024),
        ("kmsg-app-icon.svg", "kmsg-app-icon-1024.png", 1024, 1024),
        ("kmsg-app-icon.svg", "kmsg-app-icon-512.png", 512, 512),
        ("kmsg-app-icon.svg", "kmsg-app-icon-192.png", 192, 192),
        ("kmsg-app-icon.svg", "kmsg-app-icon-64.png", 64, 64),
        ("kmsg-app-icon.svg", "kmsg-app-icon-32.png", 32, 32),
        ("kmsg-app-icon.svg", "kmsg-app-icon-16.png", 16, 16),
        ("kmsg-social-preview-1200x630.svg", "kmsg-social-preview-1200x630.png", 1200, 630),
    ]
    png_paths: list[Path] = []
    for source_name, output_name, width, height in renders:
        output = PNG_DIR / output_name
        render(SOURCE_DIR / source_name, output, width=width, height=height)
        png_paths.append(output)

    for source_name, output_name in [
        ("kmsg-signature-light.svg", "kmsg-signature-light-220.png"),
        ("kmsg-signature-dark.svg", "kmsg-signature-dark-220.png"),
    ]:
        output = PNG_DIR / output_name
        render(SOURCE_DIR / source_name, output, width=220)
        png_paths.append(output)

    with tempfile.TemporaryDirectory(prefix="kmsg-brand-") as temp_name:
        temp_dir = Path(temp_name)
        review_svg = temp_dir / "review.svg"
        review_svg.write_text(
            review_board_svg(
                word_paths, word_width, descriptor_paths, descriptor_width
            )
        )
        review_output = REVIEW_DIR / "kmsg-connected-bubbles-review-1280x1024.png"
        render(review_svg, review_output, width=1280, height=1024)

        samples: dict[int, Path] = {
            16: PNG_DIR / "kmsg-app-icon-16.png",
            32: PNG_DIR / "kmsg-app-icon-32.png",
            64: PNG_DIR / "kmsg-app-icon-64.png",
        }
        for size in (24, 128):
            sample = temp_dir / f"app-{size}.png"
            render(SOURCE_DIR / "kmsg-app-icon.svg", sample, width=size, height=size)
            samples[size] = sample

        legacy_32 = ROOT / "assets" / "brand" / "reference" / "kmsg-legacy-32.png"
        if not legacy_32.exists():
            raise FileNotFoundError(f"Legacy comparison thumbnail not found: {legacy_32}")
        size_svg = temp_dir / "size-review.svg"
        size_svg.write_text(size_board_svg(samples, legacy_32))
        size_output = REVIEW_DIR / "kmsg-connected-bubbles-size-test-1280x1024.png"
        render(size_svg, size_output, width=1280, height=1024)

    print(
        f"Generated {len(source_paths)} SVG sources, {len(png_paths)} PNG outputs, and 2 review boards."
    )


if __name__ == "__main__":
    main()
