import React from 'react';
import styled, { css } from 'styled-components';
import {
  AnimatePresence,
  motion,
  type MotionValue,
  type SpringOptions,
  useMotionValue,
  useSpring,
  useTransform
} from 'framer-motion';

export type DockNavItem = {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  className?: string;
  ariaLabel?: string;
};

type Orientation = 'horizontal' | 'vertical';

export type MagnificationDockProps = {
  items: DockNavItem[];
  className?: string;
  orientation?: Orientation;
  distance?: number;
  panelSize?: number;
  baseItemSize?: number;
  magnification?: number;
  spring?: SpringOptions;
  panelPadding?: number;
  itemGap?: number;
  ariaLabel?: string;
};

type DockPanelProps = {
  $orientation: Orientation;
  $panelSize: number;
  $panelPadding: number;
  $itemGap: number;
};

type DockItemButtonProps = {
  $active?: boolean;
};

type DockLabelProps = {
  $orientation: Orientation;
};

type DockItemProps = {
  item: DockNavItem;
  axis: MotionValue<number>;
  orientation: Orientation;
  distance: number;
  spring: SpringOptions;
  baseItemSize: number;
  magnification: number;
  hoverEnabled: boolean;
};

const DockViewport = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  max-width: none;
  overflow: visible;
`;

const DockPanel = styled(motion.div)<DockPanelProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $itemGap }) => `${$itemGap}px`};
  padding: ${({ $panelPadding }) => `${$panelPadding}px`};
  border-radius: 32px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 241, 233, 0.82))'
      : 'linear-gradient(180deg, rgba(17, 20, 26, 0.84), rgba(8, 10, 14, 0.92))'};
  box-shadow: ${({ theme }) =>
    theme.isLight
      ? '0 18px 44px rgba(118, 85, 46, 0.14)'
      : '0 24px 46px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.04)'};
  backdrop-filter: blur(24px) saturate(135%);
  overflow: visible;
  touch-action: pan-x pan-y;

  ${({ $orientation, $panelSize }) =>
    $orientation === 'horizontal'
      ? css`
          min-height: ${$panelSize}px;
          flex-direction: row;
        `
      : css`
          min-width: ${$panelSize}px;
          flex-direction: column;
        `}
`;

const DockItemButton = styled(motion.button)<DockItemButtonProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  padding: 0;
  cursor: pointer;
  color: ${({ theme, $active }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  background: ${({ theme, $active }) =>
    $active
      ? theme.isLight
        ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,242,234,0.92))'
        : 'linear-gradient(180deg, rgba(38, 44, 53, 0.98), rgba(18, 21, 28, 0.96))'
      : theme.isLight
        ? 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(245,238,229,0.6))'
        : 'linear-gradient(180deg, rgba(31, 36, 44, 0.88), rgba(14, 17, 23, 0.92))'};
  box-shadow: ${({ theme, $active }) =>
    $active
      ? theme.isLight
        ? '0 14px 28px rgba(118, 85, 46, 0.14), inset 0 1px 0 rgba(255,255,255,0.86)'
        : '0 16px 28px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255,255,255,0.08)'
      : theme.isLight
        ? '0 10px 24px rgba(118, 85, 46, 0.08), inset 0 1px 0 rgba(255,255,255,0.68)'
        : '0 10px 20px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255,255,255,0.04)'};
  outline: none;

  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    border: 1px solid
      ${({ theme, $active }) =>
        $active
          ? theme.isLight
            ? 'rgba(201, 106, 22, 0.32)'
            : 'rgba(245, 154, 74, 0.28)'
          : theme.isLight
            ? 'rgba(162, 124, 84, 0.12)'
            : 'rgba(255, 255, 255, 0.06)'};
    pointer-events: none;
  }

  &:focus-visible {
    box-shadow:
      0 0 0 3px ${({ theme }) => theme.colors.ring},
      ${({ theme, $active }) =>
        $active
          ? theme.isLight
            ? '0 14px 28px rgba(118, 85, 46, 0.14)'
            : '0 16px 28px rgba(0, 0, 0, 0.26)'
          : theme.isLight
            ? '0 10px 24px rgba(118, 85, 46, 0.08)'
            : '0 10px 20px rgba(0, 0, 0, 0.22)'};
  }
`;

const DockIcon = styled.div<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $active }) =>
    $active ? (theme.isLight ? theme.colors.accent : theme.colors.highlight) : theme.colors.text.secondary};
  transition: color ${({ theme }) => theme.transitions.fast};

  svg {
    width: 20px;
    height: 20px;
    stroke-width: 2.1;
  }
`;

const DockIconMotion = styled(motion.div)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const DockLabel = styled(motion.div)<DockLabelProps>`
  position: absolute;
  pointer-events: none;
  z-index: 3;
  white-space: nowrap;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,241,233,0.94))'
      : 'linear-gradient(180deg, rgba(20,24,30,0.96), rgba(10,12,16,0.96))'};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.42rem 0.7rem;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.72rem;
  letter-spacing: -0.01em;
  box-shadow: ${({ theme }) =>
    theme.isLight ? '0 12px 28px rgba(118, 85, 46, 0.12)' : '0 14px 28px rgba(0, 0, 0, 0.24)'};

  ${({ $orientation }) =>
    $orientation === 'horizontal'
      ? css`
          left: 50%;
          bottom: calc(100% + 12px);
          transform: translateX(-50%);
        `
      : css`
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
        `}
`;

const useHoverCapability = () => {
  const [hoverEnabled, setHoverEnabled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setHoverEnabled(media.matches);
    sync();

    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  return hoverEnabled;
};

const DockItem: React.FC<DockItemProps> = ({
  item,
  axis,
  orientation,
  distance,
  spring,
  baseItemSize,
  magnification,
  hoverEnabled
}) => {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [showLabel, setShowLabel] = React.useState(false);

  const pointerDistance = useTransform(axis, (pointer) => {
    if (!hoverEnabled || !Number.isFinite(pointer)) return Number.POSITIVE_INFINITY;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return Number.POSITIVE_INFINITY;

    const center =
      orientation === 'horizontal' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;

    return pointer - center;
  });

  const targetSize = useTransform(pointerDistance, (delta) => {
    if (!Number.isFinite(delta)) return baseItemSize;
    const normalizedDistance = Math.abs(delta);
    if (normalizedDistance >= distance) return baseItemSize;

    const progress = 1 - normalizedDistance / distance;
    return baseItemSize + (magnification - baseItemSize) * progress;
  });

  const size = useSpring(targetSize, spring);
  const offset = useTransform(size, (value) =>
    hoverEnabled ? Math.max(0, (value - baseItemSize) * (orientation === 'horizontal' ? 0.18 : 0.08)) : 0
  );
  const scale = useTransform(size, [baseItemSize, magnification], [1, 1.08]);
  const verticalLift = useTransform(offset, (value) => -value);
  const horizontalShift = useTransform(offset, (value) => value * 0.5);

  return (
    <DockItemButton
      ref={ref}
      type="button"
      onClick={item.onClick}
      onMouseEnter={() => hoverEnabled && setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      onFocus={() => setShowLabel(true)}
      onBlur={() => setShowLabel(false)}
      $active={item.active}
      aria-label={item.ariaLabel ?? String(item.label)}
      className={item.className}
      style={{
        width: size,
        height: size,
        y: orientation === 'horizontal' ? verticalLift : 0,
        x: orientation === 'vertical' ? horizontalShift : 0
      }}
      whileTap={{ scale: 0.94 }}
    >
      <DockIcon
        $active={item.active}
        as={DockIconMotion}
        style={{
          scale
        }}
      >
        {item.icon}
      </DockIcon>

      <AnimatePresence>
        {showLabel && (
          <DockLabel
            $orientation={orientation}
            initial={{ opacity: 0, y: orientation === 'horizontal' ? 6 : 0, x: orientation === 'vertical' ? -6 : 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: orientation === 'horizontal' ? 4 : 0, x: orientation === 'vertical' ? -4 : 0 }}
            transition={{ duration: 0.18 }}
            role="tooltip"
          >
            {item.label}
          </DockLabel>
        )}
      </AnimatePresence>
    </DockItemButton>
  );
};

export const MagnificationDock: React.FC<MagnificationDockProps> = ({
  items,
  className,
  orientation = 'horizontal',
  distance = 180,
  panelSize = 68,
  baseItemSize = 50,
  magnification = 74,
  panelPadding = 10,
  itemGap = 10,
  spring = { mass: 0.12, stiffness: 180, damping: 15 },
  ariaLabel = 'Primary navigation'
}) => {
  const axis = useMotionValue(Number.POSITIVE_INFINITY);
  const hoverEnabled = useHoverCapability();

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!hoverEnabled || event.pointerType !== 'mouse') return;
      axis.set(orientation === 'horizontal' ? event.clientX : event.clientY);
    },
    [axis, hoverEnabled, orientation]
  );

  const resetAxis = React.useCallback(() => {
    axis.set(Number.POSITIVE_INFINITY);
  }, [axis]);

  return (
    <DockViewport className={className}>
      <DockPanel
        $orientation={orientation}
        $panelSize={panelSize}
        $panelPadding={panelPadding}
        $itemGap={itemGap}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetAxis}
        onBlur={resetAxis}
        role="toolbar"
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <DockItem
            key={item.key}
            item={item}
            axis={axis}
            orientation={orientation}
            distance={distance}
            spring={spring}
            baseItemSize={baseItemSize}
            magnification={magnification}
            hoverEnabled={hoverEnabled}
          />
        ))}
      </DockPanel>
    </DockViewport>
  );
};

export default MagnificationDock;
