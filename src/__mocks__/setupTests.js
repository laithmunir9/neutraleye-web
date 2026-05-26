// Mock IntersectionObserver for Framer Motion's whileInView in JSDOM
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = IntersectionObserver;
