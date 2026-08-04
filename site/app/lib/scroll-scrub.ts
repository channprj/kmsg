export const DIM_WORD_OPACITY = 0.22

export function clampScrollProgress(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function calculateElementScrollProgress(
  rect: Pick<DOMRectReadOnly, "top" | "height">,
  viewportHeight: number,
) {
  if (
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.height) ||
    rect.height < 0 ||
    !Number.isFinite(viewportHeight) ||
    viewportHeight <= 0
  ) {
    return 1
  }

  const startTop = viewportHeight * 0.85
  const endTop = viewportHeight * 0.5 - rect.height
  const distance = startTop - endTop
  if (distance <= 0) return 1

  return clampScrollProgress((startTop - rect.top) / distance)
}

export function calculateWordOpacity(
  progress: number,
  index: number,
  count: number,
) {
  if (
    !Number.isFinite(progress) ||
    !Number.isInteger(index) ||
    !Number.isInteger(count) ||
    count <= 0 ||
    index < 0 ||
    index >= count
  ) {
    return 1
  }

  const rangeStart = index / count
  const rangeEnd = (index + 1) / count
  const localProgress = clampScrollProgress(
    (progress - rangeStart) / (rangeEnd - rangeStart),
  )

  return DIM_WORD_OPACITY + (1 - DIM_WORD_OPACITY) * localProgress
}
