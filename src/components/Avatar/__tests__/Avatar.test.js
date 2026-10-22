import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/image", () => {
  function MockNextImage({ unoptimized, ...props }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" {...props} />;
  }
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

import Avatar, { AVATAR_TONES, avatarTone, userInitial } from "../Avatar";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

describe("avatarTone", () => {
  test("the same email always gets the same tone, whatever its case or spacing", () => {
    const tone = avatarTone("reader@example.com");
    expect(AVATAR_TONES).toContain(tone);
    expect(avatarTone("reader@example.com")).toBe(tone);
    expect(avatarTone("  Reader@Example.com ")).toBe(tone);
  });

  test("different emails spread across the palette", () => {
    const tones = new Set(
      ["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com", "f@x.com", "g@x.com", "h@x.com"].map(avatarTone)
    );
    expect(tones.size).toBeGreaterThan(2);
  });
});

describe("Avatar", () => {
  test("uses the provider's picture when there is one", () => {
    const { container } = render(
      <Avatar user={{ email: "r@x.com", user_metadata: { avatar_url: "https://lh3.googleusercontent.com/a/pic" } }} />
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "https://lh3.googleusercontent.com/a/pic");
    expect(screen.queryByText("R")).not.toBeInTheDocument();
  });

  test("otherwise shows the initial on the email's tone", () => {
    render(<Avatar user={{ email: "reader@example.com", user_metadata: {} }} />);
    const initial = screen.getByText("R");
    expect(initial).toHaveStyle({ background: hexToRgb(avatarTone("reader@example.com")) });
  });

  test("falls back to the initial when the picture fails to load", () => {
    const { container } = render(
      <Avatar user={{ email: "reader@example.com", user_metadata: { avatar_url: "https://lh3.googleusercontent.com/a/gone" } }} />
    );
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  test("prefers the full name for the initial", () => {
    expect(userInitial({ email: "x@y.com", user_metadata: { full_name: "Laith Munir" } })).toBe("L");
    expect(userInitial({ email: "x@y.com" })).toBe("X");
    expect(userInitial(null)).toBe("?");
  });
});
