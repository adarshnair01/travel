#!/usr/bin/env python3
"""Convert HEIC/HEIF and JPEG cover images to web-friendly JPEG."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Missing Pillow. Install it with: python3 -m pip install Pillow pillow-heif")

try:
    from pillow_heif import register_heif_opener
except ImportError:
    register_heif_opener = None


SUPPORTED = {".heic", ".heif", ".jpg", ".jpeg"}


def convert(source: Path, output: Path | None, overwrite: bool, quality: int) -> Path:
    suffix = source.suffix.lower()
    if suffix not in SUPPORTED:
        raise ValueError(f"unsupported format: {source.name}")
    if not source.is_file():
        raise FileNotFoundError(source)
    if suffix in {".heic", ".heif"} and register_heif_opener is None:
        raise RuntimeError(
            "HEIC support requires pillow-heif. Install it with: "
            "python3 -m pip install pillow-heif"
        )

    destination = output or source.with_suffix(".jpg")
    if destination.exists() and not overwrite:
        raise FileExistsError(f"{destination} already exists (use --overwrite)")

    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
        image.save(
            destination,
            "JPEG",
            quality=quality,
            optimize=True,
            progressive=True,
        )

    return destination


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert HEIC/HEIF or JPEG cover images to JPEG."
    )
    parser.add_argument("images", type=Path, nargs="+", help="input image(s)")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="output JPEG path (only valid with one input image)",
    )
    parser.add_argument(
        "-d",
        "--out-dir",
        type=Path,
        help="write JPEGs into this folder, keeping each file's name",
    )
    parser.add_argument(
        "-f",
        "--overwrite",
        action="store_true",
        help="replace an existing JPEG",
    )
    parser.add_argument(
        "-q",
        "--quality",
        type=int,
        default=90,
        choices=range(1, 96),
        metavar="1-95",
        help="JPEG quality (default: 90)",
    )
    args = parser.parse_args()

    if args.output and len(args.images) != 1:
        parser.error("--output can only be used with one input image")
    if args.output and args.output.suffix.lower() not in {".jpg", ".jpeg"}:
        parser.error("--output must end in .jpg or .jpeg")
    if args.output and args.out_dir:
        parser.error("use either --output or --out-dir, not both")

    if any(path.suffix.lower() in {".heic", ".heif"} for path in args.images):
        if register_heif_opener is not None:
            register_heif_opener()

    failed = False
    for source in args.images:
        try:
            target = args.output
            if args.out_dir:
                target = args.out_dir / source.with_suffix(".jpg").name
            destination = convert(source, target, args.overwrite, args.quality)
            print(f"{source} -> {destination}")
        except (FileNotFoundError, FileExistsError, RuntimeError, ValueError, OSError) as error:
            print(f"error: {error}", file=sys.stderr)
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
