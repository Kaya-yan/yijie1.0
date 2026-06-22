import pathlib
import struct
import unittest
import zlib

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


class ZhangXuefengSpriteTests(unittest.TestCase):
    def test_sprite_corners_are_transparent_for_canvas_rendering(self) -> None:
        image_path = pathlib.Path(__file__).resolve().parents[1] / "public" / "zhangxuefeng.png"
        width, height, rgba = read_png_rgba(image_path)

        def alpha_at(x: int, y: int) -> int:
            return rgba[(y * width + x) * 4 + 3]

        corners = [
            alpha_at(0, 0),
            alpha_at(width - 1, 0),
            alpha_at(0, height - 1),
            alpha_at(width - 1, height - 1),
        ]

        self.assertTrue(
            all(alpha == 0 for alpha in corners),
            f"Expected transparent sprite corners, got alpha values {corners}",
        )

        opaque_pixels = sum(1 for index in range(3, len(rgba), 4) if rgba[index] > 0)
        self.assertGreater(opaque_pixels, width * height * 0.1)


if __name__ == "__main__":
    unittest.main()
