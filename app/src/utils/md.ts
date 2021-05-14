import marked from 'marked';
import { sanitize } from 'dompurify';

/**
 * Render and sanitize a markdown string
 */
export function md(str: string) {
	return sanitize(marked(str));
}
