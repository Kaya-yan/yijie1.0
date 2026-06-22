from __future__ import annotations

import pathlib
import shutil
import struct
import zlib
from collections import deque

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def paeth_predictor(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png_rgba(path: pathlib.Path) -> tuple[int, int, bytearray]:
    data = path.read_bytes()
    if data[:8] != PNG_SIGNATURE:
        raise ValueError("Not a PNG file")

    width = height = bit_depth = color_type = None
    idat_chunks: list[bytes] = []
    cursor = 8

    while cursor < len(data):
        chunk_len = struct.unpack(">I", data[cursor:cursor + 4])[0]
        chunk_type = data[cursor + 4:cursor + 8]
        chunk_data = data[cursor + 8:cursor + 8 + chunk_len]
        cursor += 12 + chunk_len

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack(
                ">IIBBBBB", chunk_data
            )
            if bit_depth != 8 or compression != 0 or filter_method != 0 or interlace != 0:
                raise ValueError("Unsupported PNG format")
            if color_type not in (2, 6):
                raise ValueError(f"Unsupported color type: {color_type}")
        elif chunk_type == b"IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    if width is None or height is None:
        raise ValueError("Missing IHDR chunk")

    bytes_per_pixel = 3 if color_type == 2 else 4
    stride = width * bytes_per_pixel
    decompressed = zlib.decompress(b"".join(idat_chunks))
    rgba = bytearray(width * height * 4)

    prev_row = bytearray(stride)
    offset = 0

    for y in range(height):
        filter_type = decompressed[offset]
        offset += 1
        row = bytearray(decompressed[offset:offset + stride])
        offset += stride

        if filter_type == 1:
            for i in range(bytes_per_pixel, stride):
                row[i] = (row[i] + row[i - bytes_per_pixel]) & 0xFF
        elif filter_type == 2:
            for i in range(stride):
                row[i] = (row[i] + prev_row[i]) & 0xFF
        elif filter_type == 3:
            for i in range(stride):
                left = row[i - bytes_per_pixel] if i >= bytes_per_pixel else 0
                up = prev_row[i]
                row[i] = (row[i] + ((left + up) // 2)) & 0xFF
        elif filter_type == 4:
            for i in range(stride):
                left = row[i - bytes_per_pixel] if i >= bytes_per_pixel else 0
                up = prev_row[i]
                up_left = prev_row[i - bytes_per_pixel] if i >= bytes_per_pixel else 0
                row[i] = (row[i] + paeth_predictor(left, up, up_left)) & 0xFF
        elif filter_type != 0:
            raise ValueError(f"Unsupported filter type: {filter_type}")

        for x in range(width):
            src = x * bytes_per_pixel
            dst = (y * width + x) * 4
            rgba[dst] = row[src]
            rgba[dst + 1] = row[src + 1]
            rgba[dst + 2] = row[src + 2]
            rgba[dst + 3] = row[src + 3] if bytes_per_pixel == 4 else 255

        prev_row = row

    return width, height, rgba


def write_png_rgba(path: pathlib.Path, width: int, height: int, rgba: bytearray) -> None:
    stride = width * 4
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(rgba[start:start + stride])

    compressed = zlib.compress(bytes(raw), level=9)

    def chunk(chunk_type: bytes, chunk_data: bytes) -> bytes:
        return (
            struct.pack(">I", len(chunk_data))
            + chunk_type
            + chunk_data
            + struct.pack(">I", zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = bytearray(PNG_SIGNATURE)
    png.extend(chunk(b"IHDR", ihdr))
    png.extend(chunk(b"IDAT", compressed))
    png.extend(chunk(b"IEND", b""))
    path.write_bytes(png)


def average_corner_color(width: int, height: int, rgba: bytearray) -> tuple[int, int, int]:
    coords = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    samples = []
    for x, y in coords:
        index = (y * width + x) * 4
        samples.append((rgba[index], rgba[index + 1], rgba[index + 2]))
    return tuple(round(sum(channel) / len(samples)) for channel in zip(*samples))


def is_close_to_background(r: int, g: int, b: int, background: tuple[int, int, int], tolerance: int) -> bool:
    return max(abs(r - background[0]), abs(g - background[1]), abs(b - background[2])) <= tolerance


def remove_edge_background(width: int, height: int, rgba: bytearray, tolerance: int = 20) -> int:
    background = average_corner_color(width, height, rgba)
    queue: deque[tuple[int, int]] = deque()
    visited = bytearray(width * height)
    removed = 0

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= width or y < 0 or y >= height:
            continue

        pixel_index = y * width + x
        if visited[pixel_index]:
            continue
        visited[pixel_index] = 1

        rgba_index = pixel_index * 4
        alpha = rgba[rgba_index + 3]
        if alpha == 0:
            continue

        r = rgba[rgba_index]
        g = rgba[rgba_index + 1]
        b = rgba[rgba_index + 2]
        if not is_close_to_background(r, g, b, background, tolerance):
            continue

        rgba[rgba_index] = 0
        rgba[rgba_index + 1] = 0
        rgba[rgba_index + 2] = 0
        rgba[rgba_index + 3] = 0
        removed += 1

        queue.append((x - 1, y))
        queue.append((x + 1, y))
        queue.append((x, y - 1))
        queue.append((x, y + 1))

    return removed


def main() -> None:
    public_dir = pathlib.Path(__file__).resolve().parents[1] / "public"
    sprite_path = public_dir / "zhangxuefeng.png"
    backup_path = public_dir / "zhangxuefeng.original.png"

    if not backup_path.exists():
        shutil.copyfile(sprite_path, backup_path)

    width, height, rgba = read_png_rgba(sprite_path)
    removed = remove_edge_background(width, height, rgba)
    write_png_rgba(sprite_path, width, height, rgba)
    print(f"Processed {sprite_path.name}: {width}x{height}, removed {removed} background pixels")


if __name__ == "__main__":
    main()
