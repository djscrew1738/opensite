/**
 * TypeScript definitions for useHydration hooks
 */

import { ComponentType, ReactNode, ReactElement } from 'react';

/**
 * Return type for hydration-safe hooks
 */
export interface HydrationState {
  /** Whether the app has hydrated */
  isHydrated: boolean;
  /** Whether running on client */
  isClient: boolean;
}

/**
 * Options for withHydrationSafe HOC
 */
export interface WithHydrationSafeOptions {
  /** Component to render during hydration */
  fallback?: ComponentType<any> | null;
}

/**
 * Props for HydrationSafe render prop component
 */
export interface HydrationSafeProps {
  /** Render function - receives hydration state */
  children: (state: HydrationState) => ReactNode;
  /** Fallback to render during hydration */
  fallback?: ReactNode;
}

/**
 * Props for ClientOnly component
 */
export interface ClientOnlyProps {
  /** Content to render only on client */
  children: ReactNode;
  /** Fallback during SSR/hydration */
  fallback?: ReactNode;
}

/**
 * Props for LazyHydrate component
 */
export interface LazyHydrateProps {
  /** Content to hydrate lazily */
  children: ReactNode;
  /** Fallback before hydration */
  fallback?: ReactNode;
  /** Priority for hydration */
  priority?: 'high' | 'low';
}

/**
 * Props for StaggeredHydration component
 */
export interface StaggeredHydrationProps {
  /** Children to stagger */
  children: ReactElement[];
  /** Delay between each item in ms */
  staggerDelay?: number;
}

/**
 * Detects when the app has finished hydrating on the client
 * @returns Whether the app has hydrated
 */
export function useHydration(): boolean;

/**
 * Returns true only when running in a browser environment after hydration
 * @returns Whether we're on the client after hydration
 */
export function useIsClient(): boolean;

/**
 * Returns a value that only updates after hydration
 * @param clientValueFn - Function that returns the client-side value
 * @param serverValue - Value to use on server and during hydration
 * @returns The safe value
 */
export function useHydrationSafe<T>(clientValueFn: () => T, serverValue: T): T;

/**
 * useState that prevents hydration mismatches
 * @param serverValue - Initial value for SSR
 * @param getClientValue - Function to get client value after hydration
 * @returns [value, setValue]
 */
export function useHydrationState<T>(
  serverValue: T,
  getClientValue: () => T
): [T, React.Dispatch<React.SetStateAction<T>>];

/**
 * Delays rendering until after a specified time post-hydration
 * @param delayMs - Milliseconds to wait after hydration
 * @returns Whether the delay has passed
 */
export function useHydrationDelay(delayMs?: number): boolean;

/**
 * Returns true when the page becomes interactive
 * @returns Whether the page is fully interactive
 */
export function useInteractive(): boolean;

/**
 * HOC that wraps a component with hydration safety
 */
export function withHydrationSafe<P extends object>(
  Component: ComponentType<P>,
  options?: WithHydrationSafeOptions
): ComponentType<P>;

/**
 * Render prop component for hydration-safe rendering
 */
export function HydrationSafe(props: HydrationSafeProps): ReactElement | null;

/**
 * Only renders children on the client after hydration
 */
export function ClientOnly(props: ClientOnlyProps): ReactElement | null;

/**
 * Delays hydration of children until browser is idle
 */
export function LazyHydrate(props: LazyHydrateProps): ReactElement | null;

/**
 * Gradually reveals children to reduce hydration load
 */
export function StaggeredHydration(props: StaggeredHydrationProps): ReactElement;
