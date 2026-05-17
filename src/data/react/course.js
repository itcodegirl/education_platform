// ═══════════════════════════════════════════════
// REACT COURSE — 10 Modules, ~41 Lessons
//
// Clean curriculum: no stubs, no duplicates.
//
// M1:  React Fundamentals Part 1 (5 lessons)
// M2:  React Fundamentals Part 2 (7 lessons)
// M3:  Side Effects & Data Fetching (3 lessons)
// M4:  Advanced State Management (3 lessons)
// M5:  Performance Optimization (3 lessons)
// M6:  Routing & Navigation (2 lessons)
// M7:  Forms & Validation (3 lessons)
// M8:  Component Design Patterns (9 lessons)
// M9:  Testing (3 lessons)
// M10: Build Tools & Deployment (3 lessons)
//
// The numeric `module1..moduleN` exports inside the source files
// are historical (they reflect ordering from a much larger set).
// What ships in the curriculum is the order of the array below —
// that is the single source of truth for the learner.
// ═══════════════════════════════════════════════

import { module1 as reactFundamentalsPart1 } from './modules/what-react-is.js';
import { module2 as reactFundamentalsPart2 } from './modules/jsx-the-language-of-react.js';
import { module9 as sideEffectsAndDataFetching } from './modules/useeffect.js';
import { module15 as advancedStateManagement } from './modules/usereducer.js';
import { module16 as performanceOptimization } from './modules/performance-optimization.js';
import { module13 as routingAndNavigation } from './modules/react-router.js';
import { module8 as formsAndValidation } from './modules/forms-in-react.js';
import { module19 as componentDesignPatterns } from './modules/component-design-patterns.js';
import { module20 as testing } from './modules/testing-basics.js';
import { module23 as buildToolsAndDeployment } from './modules/deployment-devtools.js';
import { applyReactLessonQualityFrames } from './lessonQualityFrames.js';

export const REACT_MODULES = applyReactLessonQualityFrames([
  reactFundamentalsPart1,
  reactFundamentalsPart2,
  sideEffectsAndDataFetching,
  advancedStateManagement,
  performanceOptimization,
  routingAndNavigation,
  formsAndValidation,
  componentDesignPatterns,
  testing,
  buildToolsAndDeployment,
]);
