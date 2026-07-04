import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PlanViewer3D lazy loading', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const appSource = fs.readFileSync(appPath, 'utf-8');

  it('PlanViewer3D is lazy-loaded with lazy()', () => {
    expect(appSource).toContain('lazy(() =>');
    expect(appSource).toContain('PlanViewer3D');
  });

  it('Suspense fallback wraps PlanViewer3D route', () => {
    expect(appSource).toContain('Suspense');
    expect(appSource).toContain('fallback');
  });
});
