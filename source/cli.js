#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import App from './app.js';

// Hardcoded for now - will add UI to select project/session later
const sessionDir = './data';
const sessionId = '404fc69d-751b-4662-b5c0-5c708a100632';

render(<App sessionDir={sessionDir} sessionId={sessionId} />);
