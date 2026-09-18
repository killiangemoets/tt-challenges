import Anthropic from '@anthropic-ai/sdk';

import { config } from '../config.js';

export const anthropic = config.anthropicApiKey
  ? new Anthropic({ apiKey: config.anthropicApiKey })
  : null;
