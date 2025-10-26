import { Buffer } from 'buffer';
import process from 'process';

const g = window;

if (!g.global) g.global = g;
if (!g.process) g.process = process;
if (!g.Buffer) g.Buffer = Buffer;