import type React from 'react';
import {Aspirator} from './Aspirator';
import {Bernoulli} from './Bernoulli';
import {Blood} from './Blood';
import {Bunsen} from './Bunsen';
import {Continuity} from './Continuity';
import {Debit} from './Debit';
import {Flow} from './Flow';
import {Hook} from './Hook';
import {Ideal} from './Ideal';
import {Lift} from './Lift';
import {Nebulizer} from './Nebulizer';
import {Outro} from './Outro';
import {PressureSpeed} from './PressureSpeed';
import {Recap} from './Recap';
import {Roadmap} from './Roadmap';
import {Roof} from './Roof';
import {Ships} from './Ships';
import {Strategy} from './Strategy';
import {Title} from './Title';
import {Torricelli} from './Torricelli';
import {Venturi} from './Venturi';
import {Viscometer} from './Viscometer';
import {Viscosity} from './Viscosity';

// Pemetaan id adegan di naskah → komponen visual.
export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  title: Title,
  roadmap: Roadmap,
  ideal: Ideal,
  flow: Flow,
  debit: Debit,
  continuity: Continuity,
  pressurespeed: PressureSpeed,
  bernoulli: Bernoulli,
  venturi: Venturi,
  torricelli: Torricelli,
  lift: Lift,
  viscosity: Viscosity,
  strategy: Strategy,
  aspirator: Aspirator,
  bunsen: Bunsen,
  nebulizer: Nebulizer,
  viscometer: Viscometer,
  blood: Blood,
  ships: Ships,
  roof: Roof,
  recap: Recap,
  outro: Outro,
};
