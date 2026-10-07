import type { Raw } from '../types';
import math from './math';
import eng from './eng';
import sci from './sci';
import soc from './soc';
import jpn from './jpn';
import gika from './gika';

export const EXTRA: Record<string, Raw[]> = Object.assign({}, math, eng, sci, soc, jpn, gika);
