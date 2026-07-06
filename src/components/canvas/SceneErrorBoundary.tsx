"use client";

import { Component, type ReactNode } from "react";

export default class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("HeroScene render failed, falling back to CSS background:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
